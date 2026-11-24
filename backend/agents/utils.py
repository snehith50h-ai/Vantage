"""Re-export module for agents utility functions.
Maintains backward compatibility with both `from utils import ...` and `from agents.utils import ...`.
"""

import sys
import os

# Ensure backend root is on sys.path
backend_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_root not in sys.path:
    sys.path.insert(0, backend_root)

from utils import (
    extract_text_content,
    parse_json_robustly,
    extract_problem_keywords,
    generate_dynamic_feasibility_fallback,
    generate_dynamic_pitch_fallback,
    generate_dynamic_repo_audit_fallback,
    generate_dynamic_agency_rfp_feasibility
)

from agents.guardrail_exporter import (
    IDEGuardrailBundle,
    generate_fallback_guardrail_bundle,
    generate_guardrail_bundle
)

__all__ = [
    "extract_text_content",
    "parse_json_robustly",
    "extract_problem_keywords",
    "generate_dynamic_feasibility_fallback",
    "generate_dynamic_pitch_fallback",
    "generate_dynamic_repo_audit_fallback",
    "generate_dynamic_agency_rfp_feasibility",
    "IDEGuardrailBundle",
    "generate_fallback_guardrail_bundle",
    "generate_guardrail_bundle"
]
