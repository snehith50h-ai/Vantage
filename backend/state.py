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
    jury_profile: Optional[str]
    feasibility_analysis: Optional[Dict[str, Any]]
    final_blueprint: Annotated[dict, update_dict]
