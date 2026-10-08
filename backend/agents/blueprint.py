"""Blueprint Agent (Senior Engineer Mode).

Wraps the Principal Architect agent node to preserve backward-compatibility with
existing LangGraph edges and test suites while executing the full 10-step Senior
Engineer Mode engineering protocol.
"""

from state import HackathonState
from agents.principal_architect import (
    principal_architect_node,
    generate_senior_engineer_blueprint,
    generate_fallback_blueprint,
    SENIOR_ENGINEER_PROMPT_TEMPLATE
)

def blueprint_node(state: HackathonState) -> dict:
    """Executes the Principal Architect / Senior Engineer Mode blueprint generation."""
    return principal_architect_node(state)
