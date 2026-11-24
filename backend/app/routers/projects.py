"""Shared delivery projects, task acceptance criteria, and sourced evidence."""

from datetime import date, datetime, timezone
from hashlib import sha256
import secrets
from typing import Annotated, Literal
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, Header, HTTPException, Query
from psycopg2.extras import Json
from pydantic import AwareDatetime, BaseModel, Field, StringConstraints, ValidationError, field_validator
from starlette.concurrency import run_in_threadpool

from app.github_evidence import github_evidence_target, github_repo, inspect_evidence, recent_commits
from app.hackathon_plan import PLAN_INSTRUCTIONS, GeneratedHackathonPlan, HackathonPlan, TaskStatus, TeamRole, starter_plan
from app.student_plan import StudentPlan, generate_student_artifact
from auth import db_cursor, get_current_user


router = APIRouter(prefix="/api/projects", tags=["projects"])
Title = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=180)]
LongText = Annotated[str, StringConstraints(strip_whitespace=True, max_length=6000)]
Criterion = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=1000)]
Revision = Annotated[int, Field(ge=1)]
TaskLabel = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=24)]


class ProjectBrief(BaseModel):
    title: Title
    brief: LongText = ""
    workflow: LongText = ""
    technical_design: Annotated[str, StringConstraints(strip_whitespace=True, max_length=16000)] = ""
    rubric: LongText = ""
    cuts: LongText = ""
    deadline: AwareDatetime | None = None
    repository: str = Field(default="", max_length=180)
    demo_steps: list[Criterion] = Field(default_factory=list, max_length=20)
    submission_steps: list[Criterion] = Field(default_factory=list, max_length=20)

    @field_validator("repository")
    @classmethod
    def validate_repository(cls, value: str) -> str:
        return github_repo(value) if value.strip() else ""


class ProjectCreate(BaseModel):
    source_run_id: UUID | None = None
    brief: ProjectBrief | None = None
    request_id: UUID | None = None


class ProjectEdit(ProjectBrief):
    revision: Revision


class TaskInput(BaseModel):
    title: Title
    criterion: Criterion
    assignee_id: UUID | None = None
    priority: Literal["required", "optional"] = "required"
    description: Annotated[str, StringConstraints(strip_whitespace=True, max_length=3000)] = ""
    labels: list[TaskLabel] = Field(default_factory=list, max_length=6)
    urgency: Literal["none", "low", "normal", "high", "urgent"] = "none"
    due_date: date | None = None
    status: TaskStatus = "todo"

    @field_validator("labels")
    @classmethod
    def unique_labels(cls, labels: list[str]) -> list[str]:
        unique = {}
        for label in labels:
            unique.setdefault(label.casefold(), label)
        return list(unique.values())


class TaskEdit(TaskInput):
    revision: Revision


class EvidenceInput(BaseModel):
    revision: Revision
    kind: Literal["github", "observation"]
    url: str = Field(default="", max_length=250)
    note: Annotated[str, StringConstraints(strip_whitespace=True, max_length=1000)] = ""
    observed: Literal["passed", "failed"] = "passed"
    environment: Literal["local", "preview", "deployed", "other"] = "local"


class Evidence(BaseModel):
    kind: Literal["check", "pull_request", "observation"]
    outcome: str
    url: str = ""
    note: str = ""
    environment: Literal["local", "preview", "deployed", "other"] | None = None
    commit: str | None = None
    recorded_at: AwareDatetime
    recorded_by: UUID
    criterion_version: int


class Task(TaskInput):
    id: UUID = Field(default_factory=uuid4)
    suggested_role: TeamRole | None = None
    criterion_version: int = 1
    evidence: list[Evidence] = Field(default_factory=list)


class Activity(BaseModel):
    actor_id: UUID
    message: str
    at: AwareDatetime


class ProjectDocument(ProjectBrief):
    tasks: list[Task] = Field(default_factory=list)
    roles: dict[UUID, TeamRole] = Field(default_factory=dict)
    activity: list[Activity] = Field(default_factory=list)
    hackathon_plan: HackathonPlan | None = None
    plan_source: Literal["ai", "starter"] | None = None
    plan_review: Literal["accepted", "revised", "unavailable"] | None = None
    demo_check_task_id: UUID | None = None


class RoleEdit(BaseModel):
    revision: Revision
    role: TeamRole | None


class StatusEdit(BaseModel):
    revision: Revision
    status: TaskStatus


class PlanRequest(BaseModel):
    revision: Revision


class DemoCheckEdit(BaseModel):
    revision: Revision
    task_id: UUID | None


class InviteInput(BaseModel):
    token: str = Field(min_length=43, max_length=43, pattern=r"^[A-Za-z0-9_-]{43}$")


def _project(cur, project_id, user_id, *, lock=False):
    query = """
        SELECT p.id, p.owner_id, p.source_run_id, p.document, p.revision, p.updated_at,
               CASE WHEN p.owner_id = m.user_id THEN p.invite_expires_at END AS invite_expires_at
        FROM delivery_projects p
        JOIN delivery_project_members m ON m.project_id = p.id
        WHERE p.id = %s AND m.user_id = %s
    """
    if lock:
        query += " FOR UPDATE OF p"
    cur.execute(query, (str(project_id), user_id))
    row = cur.fetchone()
    if not row:
        raise HTTPException(404, "Project not found.")
    if lock:
        # A removal can commit while the first SELECT is waiting for its project lock.
        cur.execute(
            "SELECT 1 FROM delivery_project_members WHERE project_id = %s AND user_id = %s",
            (row["id"], user_id),
        )
        if not cur.fetchone():
            raise HTTPException(404, "Project not found.")
    return row


def _members(cur, row):
    cur.execute(
        """SELECT u.id, COALESCE(NULLIF(u.name, ''), 'Teammate') AS name
           FROM delivery_project_members m JOIN users u ON m.user_id = u.id
           WHERE m.project_id = %s ORDER BY (u.id = %s) DESC, u.name NULLS LAST, u.id""",
        (row["id"], row["owner_id"]),
    )
    return cur.fetchall()


def _detail(cur, row, user_id):
    owner = row["owner_id"] == user_id
    return {
        "id": row["id"], "owner_id": row["owner_id"], "is_owner": owner,
        "source_run_id": row["source_run_id"] if owner else None,
        "revision": row["revision"], "updated_at": row["updated_at"],
        "invite_expires_at": row["invite_expires_at"],
        "members": _members(cur, row), **ProjectDocument.model_validate(row["document"]).model_dump(mode="json"),
    }


def _edit(cur, project_id, user_id, revision):
    row = _project(cur, project_id, user_id, lock=True)
    if row["revision"] != revision:
        raise HTTPException(409, "A teammate changed this project. Refresh the project before saving again.")
    return row, ProjectDocument.model_validate(row["document"])


def _write(cur, row, document, user_id, message):
    document.activity.insert(0, Activity(actor_id=user_id, message=message, at=datetime.now(timezone.utc)))
    document.activity = document.activity[:100]
    saved = document.model_dump(mode="json")
    cur.execute(
        """UPDATE delivery_projects SET document = %s, revision = revision + 1, updated_at = now()
           WHERE id = %s RETURNING revision, updated_at""",
        (Json(saved), row["id"]),
    )
    row.update(cur.fetchone())
    row["document"] = saved
    return _detail(cur, row, user_id)


def _task(document, task_id):
    for task in document.tasks:
        if task.id == task_id:
            return task
    raise HTTPException(404, "Task not found.")


def _check_assignee(cur, project_id, assignee_id):
    if assignee_id is None:
        return
    cur.execute(
        "SELECT 1 FROM delivery_project_members WHERE project_id = %s AND user_id = %s",
        (project_id, str(assignee_id)),
    )
    if not cur.fetchone():
        raise HTTPException(422, "Choose someone who is a member of the project.")


@router.get("")
def list_projects(user: dict = Depends(get_current_user), offset: int = Query(0, ge=0)):
    with db_cursor() as cur:
        cur.execute(
            """SELECT p.id, p.document->>'title' AS title, p.document->>'workflow' AS workflow,
                      p.document->>'deadline' AS deadline, p.updated_at, p.owner_id = m.user_id AS is_owner
               FROM delivery_project_members m JOIN delivery_projects p ON p.id = m.project_id
               WHERE m.user_id = %s ORDER BY p.updated_at DESC, p.id LIMIT 51 OFFSET %s""",
            (user["id"], offset),
        )
        rows = cur.fetchall()
    return {"projects": rows[:50], "next_offset": offset + 50 if len(rows) > 50 else None}


def _from_run(cur, run_id, user_id):
    cur.execute(
        "SELECT title, problem_statement, result_json FROM playground_runs WHERE id = %s AND user_id = %s FOR SHARE",
        (str(run_id), user_id),
    )
    run = cur.fetchone()
    if not run:
        raise HTTPException(404, "Saved plan not found.")
    result = run["result_json"] if isinstance(run["result_json"], dict) else {}
    raw = result.get("student_plan") or {}
    try:
        plan = StudentPlan.model_validate(raw)
    except ValidationError:
        plan = None
    plan_brief = raw.get("brief") if isinstance(raw, dict) else None
    if not isinstance(plan_brief, dict):
        plan_brief = {}
    blueprint = result.get("final_blueprint")
    architecture = blueprint.get("architecture") if isinstance(blueprint, dict) else ""
    return ProjectDocument(
        title=(run["title"] or plan_brief.get("title") or "Untitled project").strip()[:180] or "Untitled project",
        brief=(run["problem_statement"] or plan_brief.get("project") or "")[:6000],
        technical_design=architecture[:16000] if isinstance(architecture, str) else "",
        tasks=[Task(title=step.task[:180], criterion=step.done_when) for step in plan.steps] if plan else [],
        demo_steps=plan.demo if plan else [],
        submission_steps=plan.submit if plan else [],
    )


@router.post("")
def create_project(req: ProjectCreate, user: dict = Depends(get_current_user)):
    if (req.source_run_id is None) == (req.brief is None):
        raise HTTPException(422, "Supply a saved plan or a new project brief.")
    if req.source_run_id and req.request_id:
        raise HTTPException(422, "A saved plan already identifies the project.")
    user_id = user["id"]
    run_id = str(req.source_run_id) if req.source_run_id else None
    request_id = str(req.request_id) if req.request_id else None
    with db_cursor() as cur:
        document = (
            _from_run(cur, req.source_run_id, user_id)
            if req.source_run_id else ProjectDocument(**req.brief.model_dump())
        )
        document.activity = [Activity(actor_id=user_id, message="Created the project room.", at=datetime.now(timezone.utc))]
        cur.execute(
            """INSERT INTO delivery_projects (id, owner_id, source_run_id, document)
               VALUES (COALESCE(%s::uuid, gen_random_uuid()), %s, %s, %s)
               ON CONFLICT DO NOTHING RETURNING id""",
            (request_id, user_id, run_id, Json(document.model_dump(mode="json"))),
        )
        row = cur.fetchone()
        if not row:
            cur.execute(
                "SELECT id FROM delivery_projects WHERE owner_id = %s AND (source_run_id = %s OR id = %s)",
                (user_id, run_id, request_id),
            )
            row = cur.fetchone()
            if not row:
                raise HTTPException(409, "Could not open the project from this plan. Try again.")
        cur.execute(
            """INSERT INTO delivery_project_members (project_id, user_id)
               VALUES (%s, %s) ON CONFLICT DO NOTHING""",
            (row["id"], user_id),
        )
    return {"id": row["id"]}


@router.post("/join")
def join_project(req: InviteInput, user: dict = Depends(get_current_user)):
    digest = sha256(req.token.encode()).hexdigest()
    with db_cursor() as cur:
        cur.execute(
            """SELECT id FROM delivery_projects
               WHERE invite_digest = %s AND invite_expires_at > now() FOR UPDATE""",
            (digest,),
        )
        project = cur.fetchone()
        if not project:
            raise HTTPException(404, "This invite has expired, was used, or was revoked.")
        cur.execute(
            """INSERT INTO delivery_project_members (project_id, user_id)
               VALUES (%s, %s) ON CONFLICT DO NOTHING RETURNING user_id""",
            (project["id"], user["id"]),
        )
        if cur.fetchone():
            cur.execute(
                "UPDATE delivery_projects SET invite_digest = NULL, invite_expires_at = NULL WHERE id = %s",
                (project["id"],),
            )
            row = _project(cur, project["id"], user["id"], lock=True)
            document = ProjectDocument.model_validate(row["document"])
            _write(cur, row, document, user["id"], "Joined the project room.")
    return {"id": project["id"]}


@router.get("/{project_id}")
def get_project(project_id: UUID, user: dict = Depends(get_current_user)):
    with db_cursor() as cur:
        return _detail(cur, _project(cur, project_id, user["id"]), user["id"])


def _linked_repository(project_id, user_id):
    with db_cursor() as cur:
        row = _project(cur, project_id, user_id)
    return ProjectDocument.model_validate(row["document"]).repository


@router.get("/{project_id}/github/commits")
async def get_github_commits(project_id: UUID, user: dict = Depends(get_current_user)):
    repository = await run_in_threadpool(_linked_repository, project_id, user["id"])
    if not repository:
        raise HTTPException(422, "Link your team’s GitHub repository first.")
    return {"commits": await recent_commits(repository)}


@router.patch("/{project_id}")
def edit_project(project_id: UUID, req: ProjectEdit, user: dict = Depends(get_current_user)):
    with db_cursor() as cur:
        row, document = _edit(cur, project_id, user["id"], req.revision)
        repository_changed = document.repository.lower() != req.repository.lower()
        demo_context_changed = repository_changed or document.brief != req.brief or document.technical_design != req.technical_design
        if repository_changed or demo_context_changed:
            for task in document.tasks:
                if (repository_changed and any(item.kind != "observation" for item in task.evidence)) or (
                    demo_context_changed and task.id == document.demo_check_task_id and task.evidence
                ):
                    task.criterion_version += 1
        document = document.model_copy(update=req.model_dump(exclude={"revision"}))
        message = "Updated the project brief."
        if repository_changed:
            message = "Linked a GitHub repository." if req.repository else "Removed the GitHub repository link."
        return _write(cur, row, document, user["id"], message)


@router.patch("/{project_id}/role")
def choose_role(project_id: UUID, req: RoleEdit, user: dict = Depends(get_current_user)):
    user_id = user["id"]
    member_id = UUID(str(user_id))
    with db_cursor() as cur:
        row, document = _edit(cur, project_id, user_id, req.revision)
        if req.role is None:
            document.roles.pop(member_id, None)
        else:
            document.roles[member_id] = req.role
        return _write(cur, row, document, user_id, "Updated their team role.")


def _plan_context(project_id, user_id, revision):
    with db_cursor() as cur:
        row = _project(cur, project_id, user_id)
        team_size = len(_members(cur, row))
    if row["revision"] != revision:
        raise HTTPException(409, "A teammate changed this project. Refresh the project before generating a plan.")
    document = ProjectDocument.model_validate(row["document"])
    if document.hackathon_plan is not None and document.plan_source != "starter":
        raise HTTPException(409, "This room already has an AI build plan.")
    if not document.repository or not document.brief:
        raise HTTPException(422, "Link the team repository and save the problem statement before generating a plan.")
    return document, team_size


def _save_plan(project_id, user_id, revision, plan, source, review):
    with db_cursor() as cur:
        row, document = _edit(cur, project_id, user_id, revision)
        previous = document.hackathon_plan
        document.hackathon_plan = plan
        document.plan_source = source
        document.plan_review = review
        if not document.workflow or (previous and document.workflow == previous.workflow):
            document.workflow = plan.workflow
        if not document.technical_design or (previous and document.technical_design == "\n".join(previous.architecture)):
            document.technical_design = "\n".join(plan.architecture)
        if not document.cuts or (previous and document.cuts == "\n".join(previous.cuts)):
            document.cuts = "\n".join(plan.cuts)
        if not document.demo_steps or (previous and document.demo_steps == previous.demo):
            document.demo_steps = plan.demo
        if not document.submission_steps or (previous and document.submission_steps == previous.submit):
            document.submission_steps = plan.submit
        check = plan.demo_check
        add_check = check is not None and document.demo_check_task_id is None and len(document.tasks) < 24
        if previous is None:
            available_slots = 24 - len(document.tasks) - int(add_check)
            existing_titles = {task.title.casefold() for task in document.tasks}
            if add_check and check is not None:
                existing_titles.add(check.title.casefold())
            for step in plan.steps:
                if available_slots <= 0:
                    break
                title = step.task[:180].strip()
                if title.casefold() in existing_titles:
                    continue
                document.tasks.append(Task(title=title, criterion=step.done_when, suggested_role=step.role))
                existing_titles.add(title.casefold())
                available_slots -= 1
        if add_check and check is not None:
            task = Task(title=check.title, criterion=check.expected, description=check.task_description(), suggested_role="testing")
            document.tasks.append(task)
            document.demo_check_task_id = task.id
        message = "Published the AI build plan." if source == "ai" else "Published a starter build plan."
        return _write(cur, row, document, user_id, message)


@router.post("/{project_id}/plan")
async def generate_plan(
    project_id: UUID,
    req: PlanRequest,
    user: dict = Depends(get_current_user),
    x_openrouter_api_key: str | None = Header(None),
    x_gemini_api_key: str | None = Header(None),
):
    user_id = user["id"]
    document, team_size = await run_in_threadpool(_plan_context, project_id, user_id, req.revision)
    plan, completion = await generate_student_artifact(
        GeneratedHackathonPlan,
        f"{PLAN_INSTRUCTIONS}\n"
        f"Project: {document.title}\nProblem statement: {document.brief}\n"
        f"Team size currently in the room: {team_size}\n"
        f"Chosen roles: {', '.join(sorted(document.roles.values())) or 'Not specified'}\n"
        f"Planning time (UTC): {datetime.now(timezone.utc).isoformat()}\n"
        f"Deadline: {document.deadline or 'Not specified'}\nEvent rules: {document.rubric or 'Not specified'}\n"
        f"Existing workflow: {document.workflow}\nExisting architecture: {document.technical_design}\n"
        f"Existing exclusions: {document.cuts}",
        grounding=f"{document.brief}\n{document.rubric}",
        byok_openrouter=x_openrouter_api_key,
        byok_gemini=x_gemini_api_key,
        model_override=None,
    )
    if plan is None and document.hackathon_plan is not None:
        raise HTTPException(503, "AI guidance is still unavailable. You can keep working from the starter plan.")
    source = "ai" if plan else "starter"
    review = completion.metadata.get("quality_review") if completion else None
    return await run_in_threadpool(
        _save_plan, project_id, user_id, req.revision, plan or starter_plan(document.brief), source, review,
    )


@router.put("/{project_id}/demo-check")
def choose_demo_check(project_id: UUID, req: DemoCheckEdit, user: dict = Depends(get_current_user)):
    with db_cursor() as cur:
        row, document = _edit(cur, project_id, user["id"], req.revision)
        if req.task_id is not None:
            task = _task(document, req.task_id)
            message = f"Selected “{task.title}” as the key demo check."
        else:
            message = "Cleared the key demo check."
        document.demo_check_task_id = req.task_id
        return _write(cur, row, document, user["id"], message)


@router.post("/{project_id}/tasks")
def add_task(project_id: UUID, req: TaskEdit, user: dict = Depends(get_current_user)):
    with db_cursor() as cur:
        row, document = _edit(cur, project_id, user["id"], req.revision)
        if len(document.tasks) >= 24:
            raise HTTPException(422, "A project can have up to 24 tasks. Review what can move out of scope.")
        _check_assignee(cur, row["id"], req.assignee_id)
        document.tasks.append(Task(**req.model_dump(exclude={"revision"})))
        return _write(cur, row, document, user["id"], f"Added task “{req.title}”.")


@router.patch("/{project_id}/tasks/{task_id}")
def edit_task(project_id: UUID, task_id: UUID, req: TaskEdit, user: dict = Depends(get_current_user)):
    with db_cursor() as cur:
        row, document = _edit(cur, project_id, user["id"], req.revision)
        task = _task(document, task_id)
        _check_assignee(cur, row["id"], req.assignee_id)
        procedure_changed = (
            "description" in req.model_fields_set and req.description != task.description
            and document.demo_check_task_id == task.id
        )
        if procedure_changed or (task.title, task.criterion) != (req.title, req.criterion):
            task.criterion_version += 1
        task.title = req.title
        task.criterion = req.criterion
        task.assignee_id = req.assignee_id
        task.priority = req.priority
        for field, value in req.model_dump(include={"description", "labels", "urgency", "due_date", "status"}, exclude_unset=True).items():
            setattr(task, field, value)
        return _write(cur, row, document, user["id"], f"Updated task “{task.title}”.")


@router.patch("/{project_id}/tasks/{task_id}/status")
def move_task(project_id: UUID, task_id: UUID, req: StatusEdit, user: dict = Depends(get_current_user)):
    with db_cursor() as cur:
        row, document = _edit(cur, project_id, user["id"], req.revision)
        task = _task(document, task_id)
        task.status = req.status
        status = req.status.replace("_", " ") if req.status != "todo" else "to do"
        return _write(cur, row, document, user["id"], f"Moved “{task.title}” to {status}.")


@router.delete("/{project_id}/tasks/{task_id}")
def remove_task(project_id: UUID, task_id: UUID, revision: Revision, user: dict = Depends(get_current_user)):
    with db_cursor() as cur:
        row, document = _edit(cur, project_id, user["id"], revision)
        task = _task(document, task_id)
        document.tasks.remove(task)
        if document.demo_check_task_id == task.id:
            document.demo_check_task_id = None
        return _write(cur, row, document, user["id"], f"Removed task “{task.title}”.")


def _evidence_context(project_id, task_id, user_id, revision):
    with db_cursor() as cur:
        row = _project(cur, project_id, user_id)
        if row["revision"] != revision:
            raise HTTPException(409, "The project changed. Refresh it before recording evidence.")
        document = ProjectDocument.model_validate(row["document"])
        _task(document, task_id)
        return document.repository


def _save_evidence(project_id, task_id, user_id, req, kind, outcome, url, commit):
    with db_cursor() as cur:
        row, document = _edit(cur, project_id, user_id, req.revision)
        task = _task(document, task_id)
        task.evidence = [item for item in task.evidence if not url or item.url != url][:9]
        task.evidence.insert(0, Evidence(
            kind=kind, outcome=outcome, url=url, note=req.note, commit=commit,
            environment=req.environment if kind == "observation" else None,
            recorded_at=datetime.now(timezone.utc), recorded_by=UUID(str(user_id)),
            criterion_version=task.criterion_version,
        ))
        message = f"Recorded {kind.replace('_', ' ')} evidence for “{task.title}” ({outcome})."
        return _write(cur, row, document, user_id, message)


@router.post("/{project_id}/tasks/{task_id}/evidence")
async def record_evidence(project_id: UUID, task_id: UUID, req: EvidenceInput, user: dict = Depends(get_current_user)):
    if req.kind == "observation":
        if not req.note or req.url:
            raise HTTPException(422, "Describe the environment, steps, and result you observed.")
        kind, outcome, url, commit = "observation", req.observed, "", None
    else:
        repository = await run_in_threadpool(_evidence_context, project_id, task_id, user["id"], req.revision)
        try:
            repo, target, number, url = github_evidence_target(req.url)
        except ValueError as exc:
            raise HTTPException(422, str(exc)) from None
        if not repository or repo.lower() != repository.lower():
            raise HTTPException(422, "Use a link from the GitHub repository saved in the project brief.")
        if target == "actions/runs" and not req.note:
            raise HTTPException(422, "Explain how the workflow checks this task’s acceptance criterion.")
        outcome, commit = await inspect_evidence(repo, target, number)
        kind = "check" if target == "actions/runs" else "pull_request"
    return await run_in_threadpool(_save_evidence, project_id, task_id, user["id"], req, kind, outcome, url, commit)


def _owner(cur, project_id, user_id):
    row = _project(cur, project_id, user_id, lock=True)
    if row["owner_id"] != user_id:
        raise HTTPException(403, "Only the project owner can manage access.")
    return row


@router.post("/{project_id}/invite")
def create_invite(project_id: UUID, user: dict = Depends(get_current_user)):
    token = secrets.token_urlsafe(32)
    with db_cursor() as cur:
        _owner(cur, project_id, user["id"])
        cur.execute(
            """UPDATE delivery_projects SET invite_digest = %s, invite_expires_at = now() + interval '1 day'
               WHERE id = %s RETURNING invite_expires_at""",
            (sha256(token.encode()).hexdigest(), str(project_id)),
        )
        return {"token": token, "expires_at": cur.fetchone()["invite_expires_at"]}


@router.delete("/{project_id}/invite")
def revoke_invite(project_id: UUID, user: dict = Depends(get_current_user)):
    with db_cursor() as cur:
        _owner(cur, project_id, user["id"])
        cur.execute(
            "UPDATE delivery_projects SET invite_digest = NULL, invite_expires_at = NULL WHERE id = %s",
            (str(project_id),),
        )
    return {"ok": True}


@router.delete("/{project_id}")
def delete_project(project_id: UUID, user: dict = Depends(get_current_user)):
    with db_cursor() as cur:
        row = _owner(cur, project_id, user["id"])
        cur.execute("DELETE FROM delivery_projects WHERE id = %s", (row["id"],))
    return {"ok": True}


@router.delete("/{project_id}/members/{member_id}")
def remove_member(project_id: UUID, member_id: UUID, user: dict = Depends(get_current_user)):
    with db_cursor() as cur:
        row = _owner(cur, project_id, user["id"])
        if str(member_id) == str(user["id"]):
            raise HTTPException(422, "The project owner cannot be removed.")
        cur.execute(
            "DELETE FROM delivery_project_members WHERE project_id = %s AND user_id = %s",
            (row["id"], str(member_id)),
        )
        document = ProjectDocument.model_validate(row["document"])
        document.roles.pop(member_id, None)
        for task in document.tasks:
            if task.assignee_id == member_id:
                task.assignee_id = None
        return _write(cur, row, document, user["id"], "Removed a teammate’s room access.")
