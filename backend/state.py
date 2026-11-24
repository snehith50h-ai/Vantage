"""State schema compatibility bridge.

Re-exports unified HackathonState and update_dict from app.graph.state.
"""

from app.graph.state import HackathonState, update_dict

__all__ = ["HackathonState", "update_dict"]
