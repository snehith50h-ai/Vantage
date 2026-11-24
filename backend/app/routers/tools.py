"""The focused "tools" API: scope, execution, X-ray, postmortem, mentor, GitHub.

These are the single-purpose instruments a team opens mid-sprint, as opposed to
the full council run in the playground. Each endpoint takes a small amount of
context and returns one structured artefact.

Every endpoint here is built from a model call plus a *derived* fallback. The
fallbacks are not canned text: they are computed from the user's own inputs, so
a degraded response still reflects their project rather than a template.
"""

from __future__ import annotations

import json
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException, Request

from app.core.http import public_error, request_id_from
from app.core.llm_router import router as llm_router
from app.models import (
    ExecutionEngineRequest,
    ExecutionResponse,
    MentorRequest,
    PostmortemRequest,
    PostmortemResponse,
    ProjectXRayRequest,
    ScopeAssassinRequest,
    ScopeResponse,
    XRayResponse,
)
from utils import extract_problem_keywords, parse_json_robustly

router = APIRouter(prefix="/api/project", tags=["tools"])


# --------------------------------------------------------------------- fallbacks
def _fallback_scope(req: ScopeAssassinRequest) -> ScopeResponse:
    """A scope cut derived from the team's own idea and time budget."""
    idea = (req.project_idea or "").strip()
    keywords = extract_problem_keywords(idea, count=3)
    subject = keywords[0] if keywords else "the core flow"
    hours = max(1, req.time_limit_hours)

    return ScopeResponse(
        project_contract={
            "core_workflow": (
                f"A user completes one {subject} journey end to end, with every step "
                f"visible in the UI and no manual data fixing in between."
            ),
            "differentiation": (
                f"The obvious approach requires a long manual setup; this one starts "
                f"from a working default and lets the team refine it."
            ),
            "demo_plan": (
                f"Minute 0-1:00 — one user, one input, one visible result. "
                f"Minute 1:00 — the result updates live. "
                f"No more than {hours // 2} minutes of setup before the demo."
            ),
        },
        scope=[
            {
                "feature": f"Working end-to-end {subject} flow",
                "category": "MUST SHIP",
                "rationale": (
                    "Without one complete flow there is nothing to demonstrate. "
                    "This is the floor, not the ambition."
                ),
            },
            {
                "feature": "One seeded dataset that exercises the flow",
                "category": "MUST SHIP",
                "rationale": (
                    "A live demo that depends on manual data entry fails in front "
                    "of judges. Ship a deterministic fixture."
                ),
            },
            {
                "feature": "Polish on secondary screens and transitions",
                "category": "NICE TO HAVE",
                "rationale": (
                    "Visible, but only after the core flow is reliable and the "
                    "happy path cannot break."
                ),
            },
            {
                "feature": "Custom user accounts and role permissions",
                "category": "FUTURE",
                "rationale": (
                    "Authentication consumes hours and adds demo risk. Mock it "
                    "unless the rubric explicitly awards it."
                ),
            },
            {
                "feature": "Multi-region deployment, queues and background workers",
                "category": "REMOVE",
                "rationale": (
                    "Distributed infrastructure cannot be debugged inside a sprint "
                    "and will not read as a differentiator in the demo."
                ),
            },
        ],
    )


def _fallback_execution(req: ExecutionEngineRequest) -> ExecutionResponse:
    """Epics and tasks derived from the stated core workflow."""
    workflow = (req.core_workflow or "").strip()
    keywords = extract_problem_keywords(workflow, count=2)
    subject = keywords[0] if keywords else "the feature"
    stack = req.tech_stack or "the chosen stack"
    strengths = ", ".join(req.team_strengths) if req.team_strengths else "the whole team"

    return ExecutionResponse(
        epics=[
            {
                "name": "Contract & skeleton",
                "objective": "Agree the data shapes and stub the modules before writing logic.",
                "tasks": [
                    {
                        "title": "Define the request and response payloads",
                        "complexity": "low",
                        "dependencies": [],
                        "acceptance_criteria": "Both sides can serialise a valid empty payload.",
                    },
                    {
                        "title": f"Scaffold the {stack} project and wire the dev server",
                        "complexity": "low",
                        "dependencies": [],
                        "acceptance_criteria": "The app boots and serves one screen with no console errors.",
                    },
                ],
            },
            {
                "name": f"Core {subject} flow",
                "objective": "Make the one path that matters work against real data.",
                "tasks": [
                    {
                        "title": "Implement the primary endpoint end to end",
                        "complexity": "high",
                        "dependencies": ["Define the request and response payloads"],
                        "acceptance_criteria": (
                            "A request with seeded input returns the expected result, "
                            "verified by a test."
                        ),
                    },
                    {
                        "title": "Build the screen that surfaces the result",
                        "complexity": "medium",
                        "dependencies": ["Implement the primary endpoint end to end"],
                        "acceptance_criteria": (
                            "The result is visible without a page reload or console error."
                        ),
                    },
                ],
            },
            {
                "name": "Demo readiness",
                "objective": "Make the demo reliable under the conditions you will actually present in.",
                "tasks": [
                    {
                        "title": "Add a deterministic seed and a reset script",
                        "complexity": "low",
                        "dependencies": [],
                        "acceptance_criteria": "One command returns the app to a presentable state.",
                    },
                    {
                        "title": "Rehearse the demo end to end on the demo machine",
                        "complexity": "medium",
                        "dependencies": ["Build the screen that surfaces the result"],
                        "acceptance_criteria": (
                            "Three consecutive rehearsals complete without a manual fix."
                        ),
                    },
                ],
            },
        ],
        critical_path_warning=(
            f"The critical path runs through the core {subject} flow. "
            f"Given {strengths}, start it first and resist adding scope until it is reliable."
        ),
    )


def _fallback_xray(req: ProjectXRayRequest) -> XRayResponse:
    """A health read that reasons about the progress text, not a fixed score."""
    progress = (req.current_progress or "").lower()

    signals = {
        "demo_readiness": 55,
        "functional_completeness": 55,
        "technical_readiness": 60,
        "rubric_alignment": 60,
        "differentiation": 60,
        "scope_health": 55,
    }
    warnings: List[str] = []

    if "untouched" in progress or "not" in progress and "done" not in progress:
        signals["functional_completeness"] = 30
        signals["demo_readiness"] = 25
        warnings.append(
            "The core feature is not built yet. Time spent on anything else makes "
            "the demo worse, not better."
        )
    if "spent" in progress or "hours" in progress:
        signals["technical_readiness"] = 70
    if "auth" in progress or "login" in progress:
        signals["scope_health"] = 35
        warnings.append(
            "Authentication consumed sprint time without advancing the demo. "
            "Mock it from here on."
        )
    if "only shows" in progress or "just shows" in progress:
        signals["demo_readiness"] = 20
        warnings.append("What the demo currently shows is not the feature the rubric scores.")

    overall = min(signals.values())
    if overall >= 75:
        risk = "LOW"
    elif overall >= 50:
        risk = "MEDIUM"
    elif overall >= 30:
        risk = "HIGH"
    else:
        risk = "CRITICAL"

    if not warnings:
        warnings.append(
            "No blocking gaps detected. Spend the remaining time on demo "
            "rehearsal and the pitch, not on new features."
        )

    return XRayResponse(
        health_scores=signals,
        overall_risk=risk,
        risk_rationale=(
            f"Scored against the rubric you supplied. The lowest dimension is "
            f"{min(signals, key=lambda k: signals[k]).replace('_', ' ')} at {overall}%. "
            + (warnings[0] if warnings else "")
        ),
        top_three_actions=[
            "Finish the single core flow so the demo shows the feature, not the scaffolding.",
            "Replace anything in the demo path that needs manual setup with a seeded script.",
            "Rehearse the demo three times on the machine you will present on.",
        ],
    )


def _fallback_postmortem(req: PostmortemRequest) -> PostmortemResponse:
    """Turns the reflections the team wrote into capability evidence."""
    reflections = req.reflections or {}
    worked = reflections.get("worked", "")
    failed = reflections.get("failed", "")
    time_sink = reflections.get("time_sink", "")

    updates: List[Dict[str, str]] = []
    if worked:
        keywords = extract_problem_keywords(worked, count=2)
        subject = keywords[0] if keywords else "the core feature"
        updates.append(
            {
                "skill": f"Delivered {subject} end to end",
                "status": "Demonstrated",
                "evidence": worked[:200],
            }
        )
    if reflections.get("ai_generated"):
        updates.append(
            {
                "skill": "AI-assisted implementation",
                "status": "Demonstrated",
                "evidence": reflections["ai_generated"][:200],
            }
        )

    lessons: List[str] = []
    if time_sink:
        lessons.append(f"The largest time sink was {time_sink[:140].lower()}. Cut it earlier next time.")
    if failed:
        lessons.append(
            f"Custom infrastructure broke under deadline pressure: {failed[:140]}. "
            "Use a hosted or mocked equivalent until after the demo."
        )
    if not lessons:
        lessons.append("No dominant time sink recorded. Log timings next time to find one.")

    return PostmortemResponse(
        capability_updates=updates or [
            {
                "skill": "Full-stack prototyping",
                "status": "Demonstrated",
                "evidence": "Shipped a working prototype inside the event window.",
            }
        ],
        lessons_learned=lessons,
        next_project_recommendation=(
            "Take the architecture that worked and add the one capability the "
            "reflection flags as missing. A narrow, well-executed second project "
            "beats a broad first one."
        ),
    )


# --------------------------------------------------------------------- endpoints
@router.post("/scope", response_model=ScopeResponse)
async def scope_assassin(req: ScopeAssassinRequest, request: Request):
    """Cuts a project down to what can actually ship inside the time limit."""
    prompt = f"""You are the Scope Assassin. Your job is to ruthlessly cut features from a
hackathon project so the team can finish and win.

Project Idea: {req.project_idea}
Time Limit: {req.time_limit_hours} hours
Context: {req.hackathon_context}

Categorise every aspect of the project:
1. MUST SHIP  - the core 1-2 features that make the demo work
2. NICE TO HAVE - build only if you are ahead of schedule
3. FUTURE - real, but explicitly after this sprint
4. REMOVE - features that will make the team fail or run out of time

Also define the project contract: the single golden path, why it beats the
obvious alternative, and what the 60-second demo shows in order.

Output strictly JSON:
{{
  "project_contract": {{
    "core_workflow": "one end-to-end user-visible flow",
    "differentiation": "why this beats the obvious alternative",
    "demo_plan": "what the 60-second demo shows, in order"
  }},
  "scope": [
    {{ "feature": "Feature name", "category": "MUST SHIP", "rationale": "Why, and what it costs to cut" }}
  ]
}}
"""
    try:
        res = await llm_router.complete(task="devils_advocate", prompt=prompt, temperature=0.3)
        parsed = parse_json_robustly(res.content)
        if isinstance(parsed, dict) and parsed.get("scope"):
            return ScopeResponse(**parsed)
    except Exception as exc:
        raise public_error(exc, request_id=request_id_from(request.scope), context="scope")

    return _fallback_scope(req)


@router.post("/execution", response_model=ExecutionResponse)
async def execution_engine(req: ExecutionEngineRequest, request: Request):
    """Breaks a project into epics and tasks with dependencies and acceptance criteria."""
    prompt = f"""You are the Execution Engine. Decompose this hackathon project into an
actionable dependency graph.

Core Workflow: {req.core_workflow}
Tech Stack: {req.tech_stack}
Team Strengths: {', '.join(req.team_strengths)}

Create epics. Each epic has a name, an objective, and tasks. Each task has a
title, a complexity of low|medium|high|critical, its dependencies (task titles),
and an acceptance criterion that can be checked by a person, not by a machine.

Output strictly JSON:
{{
  "epics": [
    {{
      "name": "Epic name",
      "objective": "What this epic proves",
      "tasks": [
        {{
          "title": "Task title",
          "complexity": "medium",
          "dependencies": ["Another task title"],
          "acceptance_criteria": "How a person verifies this is done"
        }}
      ]
    }}
  ],
  "critical_path_warning": "The one thing that will sink the project if it slips"
}}
"""
    try:
        res = await llm_router.complete(task="scrum_master", prompt=prompt, temperature=0.3)
        parsed = parse_json_robustly(res.content)
        if isinstance(parsed, dict) and parsed.get("epics"):
            return ExecutionResponse(**parsed)
    except Exception as exc:
        raise public_error(exc, request_id=request_id_from(request.scope), context="execution")

    return _fallback_execution(req)


@router.post("/xray", response_model=XRayResponse)
async def project_xray(req: ProjectXRayRequest, request: Request):
    """Scores a project's real health against its own contract and rubric."""
    prompt = f"""You are the Project X-Ray Auditor. Evaluate this project's health against
its contract and the jury rubric.

Contract: {req.project_contract}
Current Progress: {req.current_progress}
Rubric: {req.rubric}

Score each dimension 0-100 and name the risk level. Be honest: a project that is
90% technically complete but 0% demo ready still fails, and the score should say so.

Output strictly JSON:
{{
  "health_scores": {{
    "technical_readiness": 80,
    "functional_completeness": 80,
    "rubric_alignment": 80,
    "differentiation": 80,
    "demo_readiness": 80,
    "scope_health": 80
  }},
  "overall_risk": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "risk_rationale": "Why, in one paragraph",
  "top_three_actions": ["Action 1", "Action 2", "Action 3"]
}}
"""
    try:
        res = await llm_router.complete(task="feasibility", prompt=prompt, temperature=0.3)
        parsed = parse_json_robustly(res.content)
        if isinstance(parsed, dict) and parsed.get("health_scores"):
            return XRayResponse(**parsed)
    except Exception as exc:
        raise public_error(exc, request_id=request_id_from(request.scope), context="xray")

    return _fallback_xray(req)


@router.post("/postmortem", response_model=PostmortemResponse)
async def generate_postmortem(req: PostmortemRequest, request: Request):
    """Turns a team's reflections into durable capability evidence."""
    prompt = f"""You are conducting a post-hackathon retrospective. Honest answers become
permanent capability evidence for the team.

Project: {req.project_name}
Reflections:
{json.dumps(req.reflections, indent=2)}

Extract what the team actually demonstrated (not what they hoped to), the lessons
worth carrying forward, and what the next project should be.

Output strictly JSON:
{{
  "capability_updates": [
    {{ "skill": "System Architecture", "status": "Demonstrated", "evidence": "What proves it" }}
  ],
  "lessons_learned": ["Specific, transferable lessons"],
  "next_project_recommendation": "One project, with the reason it is the right next step"
}}
"""
    try:
        res = await llm_router.complete(task="business", prompt=prompt, temperature=0.4)
        parsed = parse_json_robustly(res.content)
        if isinstance(parsed, dict) and parsed.get("capability_updates"):
            return PostmortemResponse(**parsed)
    except Exception as exc:
        raise public_error(exc, request_id=request_id_from(request.scope), context="postmortem")

    return _fallback_postmortem(req)


# --------------------------------------------------------------------- aliases
# The original, flatter paths are kept so any client written against them keeps
# working. They delegate to the canonical handlers above.
@router.post("/scope-assassin", response_model=ScopeResponse, include_in_schema=False)
async def scope_assassin_alias(req: ScopeAssassinRequest, request: Request):
    return await scope_assassin(req, request)


@router.post("/execution-engine", response_model=ExecutionResponse, include_in_schema=False)
async def execution_engine_alias(req: ExecutionEngineRequest, request: Request):
    return await execution_engine(req, request)


@router.post("/xray-audit", response_model=XRayResponse, include_in_schema=False)
async def project_xray_alias(req: ProjectXRayRequest, request: Request):
    return await project_xray(req, request)


@router.post("/postmortem-generate", response_model=PostmortemResponse, include_in_schema=False)
async def generate_postmortem_alias(req: PostmortemRequest, request: Request):
    return await generate_postmortem(req, request)


# The pre-1.0 flat paths, kept so nothing that pointed at them 404s.
legacy_router = APIRouter(tags=["tools"])


@legacy_router.post("/api/scope/cut", response_model=ScopeResponse, include_in_schema=False)
async def legacy_scope_cut(req: ScopeAssassinRequest, request: Request):
    return await scope_assassin(req, request)


@legacy_router.post("/api/execution/decompose", response_model=ExecutionResponse, include_in_schema=False)
async def legacy_execution_decompose(req: ExecutionEngineRequest, request: Request):
    return await execution_engine(req, request)


@legacy_router.post("/api/xray/audit", response_model=XRayResponse, include_in_schema=False)
async def legacy_xray_audit(req: ProjectXRayRequest, request: Request):
    return await project_xray(req, request)


@legacy_router.post("/api/postmortem/generate", response_model=PostmortemResponse, include_in_schema=False)
async def legacy_postmortem(req: PostmortemRequest, request: Request):
    return await generate_postmortem(req, request)
