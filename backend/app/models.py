"""Request and response models shared by the Vantage API.

Keeping these in one module means the routers, the OpenAPI schema and the
frontend's TypeScript types all describe the same contract. Models that the
frontend depends on are defined here with the exact field names the UI reads;
the frontend's `src/lib/types.ts` mirrors this file.
"""

from __future__ import annotations

import base64
import binascii

from typing import Any, Dict, List, Literal, Optional

from pydantic import BaseModel, Field, field_validator


# --------------------------------------------------------------------- requests
class HackathonRequest(BaseModel):
    organizer_name: str
    problem_statement: str


class EditArchitectureRequest(BaseModel):
    current_architecture: str
    edit_instructions: str
    problem_statement: Optional[str] = ""
    model: Optional[str] = "heterogeneous-routing"


    sketch: Optional[str] = Field(default=None, max_length=2_796_240)

    @field_validator("sketch")
    @classmethod
    def validate_sketch(cls, value):
        if value is None:
            return None
        prefix, _, encoded = value.partition(",")
        signatures = {"data:image/png;base64": b"\x89PNG\r\n\x1a\n", "data:image/jpeg;base64": b"\xff\xd8\xff"}
        if prefix not in signatures:
            raise ValueError("Choose a PNG or JPEG image.")
        try:
            image = base64.b64decode(encoded, validate=True)
        except (ValueError, binascii.Error):
            raise ValueError("Invalid image data.") from None
        if len(image) > 2 * 1024 * 1024 or not image.startswith(signatures[prefix]):
            raise ValueError("Choose a valid PNG or JPEG under 2 MB.")
        return value


class PlaygroundRequest(BaseModel):
    organizer_name: str
    problem_statement: str
    model: Optional[str] = "heterogeneous-routing"
    temperature: Optional[float] = 0.7
    system_instruction: Optional[str] = None
    custom_constraints: Optional[str] = None
    enabled_agents: Optional[List[str]] = ["scraper", "profiler", "feasibility", "blueprint", "pitch"]
    workspace_mode: Literal["hackathon", "agency_rfp"] = "hackathon"
    mode: Optional[str] = "full"
    student_revisions: List[str] = Field(default_factory=list, max_length=8)
    previous_student_plan: Optional[str] = Field(default=None, max_length=4000)

    @field_validator("student_revisions")
    @classmethod
    def validate_revisions(cls, value: List[str]) -> List[str]:
        if any(not note.strip() or len(note) > 1500 for note in value):
            raise ValueError("Each revision must contain 1 to 1,500 characters.")
        return value


class RelatedWorkRequest(BaseModel):
    problem_statement: str = Field(min_length=1, max_length=6000)
    title: str = Field(default="", max_length=350)
    search_topics: list[str] = Field(default_factory=list, max_length=2)


class ExportGuardrailsRequest(BaseModel):
    blueprint_text: str
    feasibility_data: Optional[Dict[str, Any]] = None
    problem: str = ""
    organizer: str = "Hackathon / Enterprise"
    workspace_mode: Literal["hackathon", "agency_rfp"] = "hackathon"
    model: Optional[str] = "cohere/north-mini-code:free"


class AuditRepoRequest(BaseModel):
    github_url: str
    claimed_problem_or_blueprint: Optional[str] = None
    target_sponsor_sdks: List[str] = ["google-genai", "pinecone", "stripe", "redis"]
    model: Optional[str] = "nvidia/nemotron-3-ultra-550b-a55b:free"


class TeamProfileRequest(BaseModel):
    team_name: str
    members: List[Dict[str, Any]]
    model: Optional[str] = "heterogeneous-routing"


class ScopeAssassinRequest(BaseModel):
    project_idea: str
    time_limit_hours: int
    hackathon_context: Optional[str] = "Independent / Hackathon Sprint"
    model: Optional[str] = "heterogeneous-routing"


class ExecutionEngineRequest(BaseModel):
    core_workflow: str
    tech_stack: Optional[str] = "Full Stack (Next.js, FastAPI, PostgreSQL)"
    team_strengths: Optional[List[str]] = Field(default_factory=lambda: ["Full Stack", "Systems Architecture"])
    model: Optional[str] = "heterogeneous-routing"


class ProjectXRayRequest(BaseModel):
    project_contract: str
    current_progress: str
    rubric: str
    model: Optional[str] = "heterogeneous-routing"


class PostmortemRequest(BaseModel):
    project_name: str
    reflections: Dict[str, str]
    model: Optional[str] = "heterogeneous-routing"


class MentorRequest(BaseModel):
    project_state: str
    current_code: str
    model: Optional[str] = "heterogeneous-routing"


class GithubIntelRequest(BaseModel):
    repo_url: str
    commits: List[Dict[str, str]] = Field(default_factory=list, max_length=30)
    architecture_contract: str
    model: Optional[str] = "heterogeneous-routing"


# --------------------------------------------------------------------- responses
class ProjectContract(BaseModel):
    """The golden path a team commits to for the sprint."""

    core_workflow: str = Field(description="One end-to-end user-visible flow, start to finish.")
    differentiation: str = Field(description="Why this beats the obvious alternative.")
    demo_plan: str = Field(description="What the 60-second demo shows, in order.")


class ScopeItem(BaseModel):
    feature: str
    category: Literal["MUST SHIP", "NICE TO HAVE", "FUTURE", "REMOVE"]
    rationale: str


class ScopeResponse(BaseModel):
    project_contract: ProjectContract
    scope: List[ScopeItem]


class ExecutionTask(BaseModel):
    title: str
    complexity: Literal["low", "medium", "high", "critical"]
    dependencies: List[str] = Field(default_factory=list)
    acceptance_criteria: str


class Epic(BaseModel):
    name: str
    objective: str
    tasks: List[ExecutionTask]


class ExecutionResponse(BaseModel):
    epics: List[Epic]
    critical_path_warning: str


class HealthScores(BaseModel):
    technical_readiness: int
    functional_completeness: int
    rubric_alignment: int
    differentiation: int
    demo_readiness: int
    scope_health: int


class XRayResponse(BaseModel):
    health_scores: HealthScores
    overall_risk: Literal["LOW", "MEDIUM", "HIGH", "CRITICAL"]
    risk_rationale: str
    top_three_actions: List[str]


class CapabilityUpdate(BaseModel):
    skill: str
    status: str
    evidence: str


class PostmortemResponse(BaseModel):
    capability_updates: List[CapabilityUpdate]
    lessons_learned: List[str]
    next_project_recommendation: str


class TesterFeedbackCreate(BaseModel):
    persona: str = "Solo Indie Maker"
    category: str = "Feature Review"
    rating: int = Field(default=5, ge=1, le=5)
    feedback: str
    author_name: Optional[str] = "Early Tester"
    author_handle: Optional[str] = None


class TesterFeedbackItem(BaseModel):
    id: str
    persona: str
    category: str
    rating: int
    feedback: str
    author_name: str
    author_handle: Optional[str] = None
    upvotes: int = 0
    created_at: str
