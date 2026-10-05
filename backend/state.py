from typing import TypedDict, List, Dict, Optional, Annotated, Any

def update_dict(d1: dict, d2: dict) -> dict:
    if d1 is None:
        d1 = {}
    if d2 is None:
        d2 = {}
    return {**d1, **d2}

class HackathonState(TypedDict):
    organizer_name: str
    problem_statement: str
    scraped_history: List[Dict[str, str]]
    precedent_intelligence: Optional[Dict[str, Any]]
    github_intel: Optional[Dict[str, Any]] # New
    jury_profile: Optional[str]
    feasibility_analysis: Optional[Dict[str, Any]]
    scope_cut_analysis: Optional[Dict[str, Any]]
    architecture_diagrams: Optional[str]
    judge_score: Optional[Dict[str, Any]]
    risk_assessment: Optional[Dict[str, Any]] # New
    execution_timeline: Optional[Dict[str, Any]] # New
    business_model: Optional[Dict[str, Any]] # New
    ux_design_system: Optional[Dict[str, Any]] # New
    final_blueprint: Annotated[dict, update_dict]
