"""Unified HackathonState for Vantage Heterogeneous Multi-Model DAG.

Supports safe concurrent telemetry aggregation via operator.add reducer,
backward-compatible dict mergers, and multimodal context passing across the 4 DAG phases.
"""

from __future__ import annotations

import operator
from typing import TypedDict, List, Dict, Optional, Annotated, Any


def update_dict(d1: Optional[dict], d2: Optional[dict]) -> dict:
    """Safe reducer that merges two dictionaries without overwriting with None."""
    res = {}
    if d1 and isinstance(d1, dict):
        res.update(d1)
    if d2 and isinstance(d2, dict):
        res.update(d2)
    return res


class HackathonState(TypedDict, total=False):
    """Unified state schema flowing across the 4-phase LangGraph DAG."""

    # 1. Inputs & Configuration
    organizer_name: str
    problem_statement: str
    custom_constraints: Optional[str]
    workspace_mode: Optional[str]  # "hackathon" | "agency_rfp"
    byok_openrouter: Optional[str]
    byok_gemini: Optional[str]
    preferred_model: Optional[str]

    # 2. Phase 1: Security & Reconnaissance
    safety_status: Optional[Dict[str, Any]]
    scraped_history: List[Dict[str, str]]
    precedent_intelligence: Optional[Dict[str, Any]]
    github_intel: Optional[Dict[str, Any]]
    multimodal_rag_context: Optional[List[Dict[str, Any]]]
    jury_profile: Optional[str]

    # 3. Phase 2: Anchor Architecture
    architecture_diagrams: Optional[str]
    final_blueprint: Annotated[dict, update_dict]

    # 4. Phase 3: Trade-offs & Critical Stress Testing
    feasibility_analysis: Optional[Dict[str, Any]]
    scope_cut_analysis: Optional[Dict[str, Any]]
    risk_assessment: Optional[Dict[str, Any]]
    judge_score: Optional[Dict[str, Any]]

    # 5. Phase 4: Delivery & Storytelling
    execution_timeline: Optional[Dict[str, Any]]
    business_model: Optional[Dict[str, Any]]
    ux_design_system: Optional[Dict[str, Any]]
    ide_guardrails: Optional[Dict[str, Any]]
    repo_audit: Optional[Dict[str, Any]]

    # 6. Concurrent Telemetry Aggregation (Thread-safe list append across parallel nodes)
    telemetry: Annotated[List[Dict[str, Any]], operator.add]
