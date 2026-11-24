"""Blueprint-to-IDE Guardrail Exporter Agent.

Bridges the gap between high-level architectural blueprints and actual IDE coding
environments (Cursor, Windsurf, Claude Code, GitHub Copilot).

Generates:
1. .cursorrules: Strict service boundaries, allowed stack, and explicit DO NOT BUILD list.
2. CLAUDE.md: Architecture governance, testing commands, DB conventions, anti-spaghetti rules.
3. docker-compose.yml: Runnable service orchestration matching proposed architecture.
4. vantage.lock.json: Machine-readable contract of approved services, ports, and forbidden dependencies.
"""

import os
import json
import re
from typing import Dict, Any, Optional, List
from pydantic import BaseModel, Field
from langchain_google_genai import ChatGoogleGenerativeAI
from utils import parse_json_robustly, extract_text_content, extract_problem_keywords

class IDEGuardrailBundle(BaseModel):
    cursorrules: str = Field(description="Content for .cursorrules file")
    claude_md: str = Field(description="Content for CLAUDE.md architectural governance")
    docker_compose_yml: str = Field(description="Runnable docker-compose.yml stub")
    vantage_lock_json: str = Field(description="Machine-readable vantage.lock.json contract")
    agents_md: str = Field(default="", description="Content for AGENTS.md for Antigravity IDE/CLI")
    codex_md: str = Field(default="", description="Content for CODEX.md for OpenAI Codex")

def generate_fallback_guardrail_bundle(
    problem: str,
    organizer: str = "Hackathon / Enterprise",
    architecture_markdown: str = "",
    feasibility_data: Optional[Dict[str, Any]] = None,
    workspace_mode: str = "hackathon"
) -> IDEGuardrailBundle:
    """Deterministic, production-grade fallback generator for IDE guardrails."""
    keywords = extract_problem_keywords(problem, count=4)
    primary_kw = keywords[0] if keywords else "Core Engine"
    secondary_kw = keywords[1] if len(keywords) > 1 else "API Gateway"
    prob_summary = problem[:140] if problem else "Real-World Engineering Challenge"
    
    # Extract scope cuts from feasibility if present
    cut_features = []
    if feasibility_data and isinstance(feasibility_data, dict):
        for item in feasibility_data.get("why_not_that_feature", []):
            if isinstance(item, dict) and "feature" in item:
                cut_features.append(f"- DO NOT BUILD {item['feature']}: {item.get('why_rejected', 'Excluded from MVP')}")
    
    if not cut_features:
        cut_features = [
            "- DO NOT BUILD custom OAuth2 or SMS authentication (Use mocked Bearer tokens or Supabase Auth)",
            "- DO NOT BUILD native iOS/Android clients (Web client must be strictly mobile-responsive)",
            "- DO NOT BUILD multi-tenant enterprise billing or Stripe subscription webhooks in MVP sprint",
            "- DO NOT BUILD manual drag-and-drop custom dashboard builders (Use deterministic preset cards)"
        ]
    scope_cut_text = "\n".join(cut_features)

    # 1. .cursorrules
    cursorrules = f"""# ==============================================================================
# VANTAGE AUTONOMOUS IDE GUARDRAIL (.cursorrules)
# Project: {primary_kw} ({organizer})
# Goal: {prob_summary}
# Mode: {workspace_mode.upper()}
# ==============================================================================

# 1. ARCHITECTURAL BOUNDARIES & SERVICE ISOLATION
- Backend must reside strictly in `backend/` using FastAPI (Python 3.11+).
- Frontend must reside strictly in `frontend/` using Next.js 15+ (App Router).
- Do not cross-import backend code into frontend or vice-versa.
- All inter-service communication must use strictly typed JSON schemas (Pydantic v2 & TypeScript interfaces).

# 2. MANDATED TECH STACK
- Frontend: Next.js 15, React 19, Tailwind CSS, Lucide React icons.
- Backend: FastAPI, Pydantic v2, Uvicorn, HTTPX for async external calls.
- Persistence: PostgreSQL 16 (Relational + pgvector for semantic search), Redis 7 (Cache/PubSub).
- Formatting & Linting: Black/Ruff for Python, ESLint/Prettier for TypeScript.

# 3. STRICT "DO NOT BUILD" LIST (SCOPE CUT GUARDRAIL)
{scope_cut_text}

# 4. CODING STANDARDS & ANTI-SPAGHETTI RULES
- Never put database queries or raw SQL inside FastAPI endpoint routers; encapsulate in repository/service layer.
- Never hardcode API keys, database credentials, or secret tokens. Read exclusively from process.env / os.getenv.
- Every async function must include comprehensive error handling with meaningful HTTP status codes (400, 404, 422, 500).
- Keep component files under 250 lines. Decompose UI elements into reusable primitives.
"""

    # 2. CLAUDE.md
    claude_md = f"""# CLAUDE.md - Architectural Governance & Build Protocols

> **Project**: {primary_kw}
> **Context**: {organizer} - {prob_summary}
> **Governance Engine**: Vantage Autonomous AI Architecture OS

---

## 🛠️ Build, Test, and Run Commands

### Backend (FastAPI + Python)
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\\Scripts\\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
pytest tests/ -v --cov=.
```

### Frontend (Next.js 15 + TypeScript)
```bash
cd frontend
npm install
npm run dev      # Local dev server on http://localhost:3000
npm run build    # Production build verification
npm run lint     # Strict ESLint checks
```

### Infrastructure (Docker Compose)
```bash
docker compose up -d postgres redis
docker compose ps
docker compose logs -f api
```

---

## 🏛️ Database Conventions & Schema Hygiene
1. **Migrations**: All schema changes must be version-controlled using Alembic or raw idempotent SQL migrations in `backend/migrations/`.
2. **Naming Conventions**:
   - Tables: `snake_case` plural (e.g., `audit_reports`, `service_nodes`).
   - Columns: `snake_case` with explicit type annotations (e.g., `created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()`).
   - Primary Keys: Always `id UUID PRIMARY KEY DEFAULT gen_random_uuid()` or `BIGSERIAL`.
3. **Indexes**: Mandatory B-Tree indexes on all foreign keys and frequently queried status/tenant columns.

---

## 🛡️ Anti-Spaghetti & Security Directives
- **Zero Raw Mutations**: State updates must flow through verified domain services with input validation.
- **Fail Closed**: In external network disruptions, return deterministic degradation responses rather than crashing the client UI.
- **Telemetry**: Log all incoming requests with correlation IDs (`X-Request-ID`) for distributed tracing.
"""

    # 3. docker-compose.yml
    docker_compose_yml = f"""version: '3.8'

services:
  postgres:
    image: pgvector/pgvector:pg16
    container_name: {primary_kw.lower().replace(' ', '-')}-postgres
    environment:
      POSTGRES_USER: vantage_user
      POSTGRES_PASSWORD: vantage_secret_password
      POSTGRES_DB: vantage_{primary_kw.lower().replace(' ', '_')}
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U vantage_user -d vantage_{primary_kw.lower().replace(' ', '_')}"]
      interval: 5s
      timeout: 5s
      retries: 5
    networks:
      - vantage-net

  redis:
    image: redis:7.2-alpine
    container_name: {primary_kw.lower().replace(' ', '-')}-redis
    ports:
      - "6379:6379"
    volumes:
      - redisdata:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 5
    networks:
      - vantage-net

  api:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: {primary_kw.lower().replace(' ', '-')}-api
    environment:
      DATABASE_URL: postgresql://vantage_user:vantage_secret_password@postgres:5432/vantage_{primary_kw.lower().replace(' ', '_')}
      REDIS_URL: redis://redis:6379/0
      PORT: "8000"
      ENVIRONMENT: "development"
    ports:
      - "8000:8000"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - vantage-net

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: {primary_kw.lower().replace(' ', '-')}-frontend
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:8000
    ports:
      - "3000:3000"
    depends_on:
      - api
    networks:
      - vantage-net

networks:
  vantage-net:
    driver: bridge

volumes:
  pgdata:
  redisdata:
"""

    # 4. vantage.lock.json
    lock_data = {
        "vantage_version": "2.2.0",
        "contract_schema": "https://vantage.dev/schemas/lockfile.v1.json",
        "project": {
            "name": primary_kw,
            "subsystem": secondary_kw,
            "organizer": organizer,
            "mode": workspace_mode,
            "generated_at": "2026-10-14T07:00:00Z"
        },
        "approved_services": [
            {
                "name": "frontend-web",
                "framework": "Next.js 15 (App Router)",
                "port": 3000,
                "protocol": "HTTP/HTTPS",
                "allowed_dependencies": ["react", "next", "tailwindcss", "lucide-react"]
            },
            {
                "name": "backend-api",
                "framework": "FastAPI (Python 3.11+)",
                "port": 8000,
                "protocol": "HTTP / OpenAPI v3",
                "allowed_dependencies": ["fastapi", "uvicorn", "pydantic", "httpx", "sqlalchemy"]
            },
            {
                "name": "persistence-relational",
                "engine": "PostgreSQL 16 + pgvector",
                "port": 5432,
                "protocol": "PostgreSQL Wire Protocol"
            },
            {
                "name": "cache-event-queue",
                "engine": "Redis 7.2",
                "port": 6379,
                "protocol": "RESP"
            }
        ],
        "forbidden_dependencies": [
            "electron",
            "react-native",
            "django-allauth",
            "stripe-webhook-sdk-unmocked"
        ],
        "scope_cuts": cut_features,
        "ci_drift_checks": {
            "enforce_port_allocations": True,
            "deny_unapproved_ports": True,
            "lint_on_push": True
        }
    }
    vantage_lock_json = json.dumps(lock_data, indent=2)

    agents_md = f"""# ==============================================================================
# VANTAGE ANTIGRAVITY AGENT SWARM GOVERNANCE (AGENTS.md)
# Workspace: {primary_kw} ({organizer})
# Council Mode: {workspace_mode.upper()}
# Engine: Google Antigravity Agentic IDE & CLI (`agy`)
# ==============================================================================

## 🤖 Swarm Architecture & Multi-Agent Directives
- **Subagent Delegation**: Partition heavy computational pipelines into focused skills under `.agents/skills/`.
- **Preserve Documentation**: Maintain all schema annotations, docstrings, and type definitions across code generation rounds.
- **Google Cloud Runtime**:
  - Gemini SDK: `@google/genai` (TypeScript) or `google-genai` (Python 3.11+).
  - Use `gemini-3.5-flash-lite` for high-throughput worker subagents and `gemini-3.8-flash` for high-reasoning council consensus.
  - Rely on Application Default Credentials (ADC) or explicit environment headers.

## 🚫 Hard Scope Cuts & "DO NOT BUILD" Boundaries
{scope_cut_text}

## ⚡ Antigravity CLI Verification Workflows
```bash
# Verify workspace integrity and skill definitions
agy workspace status

# Run local swarm execution against vantage contract
agy run --blueprint ./vantage.lock.json

# Test API endpoints under synthetic load
pytest tests/ -v
```
"""

    codex_md = f"""# ==============================================================================
# VANTAGE OPENAI CODEX & COPILOT ARCHITECTURAL RULES (CODEX.md)
# Project: {primary_kw} ({organizer})
# Target Autopilot: OpenAI Codex CLI / VS Code Copilot
# Mode: {workspace_mode.upper()}
# ==============================================================================

## 🎯 Architecture & Implementation Boundaries
- Strict separation of concerns: Fast-path API endpoints in `backend/`, modular App Router in `frontend/`.
- Pydantic v2 schemas required for all input payloads and response envelopes.
- Async HTTP client calls must use connection pooling and exponential backoff retry.

## 🚫 Out of Scope Features
{scope_cut_text}

## 🚀 One-Line Execution
```bash
# Launch codex workspace runner
codex run .
```
"""

    return IDEGuardrailBundle(
        cursorrules=cursorrules,
        claude_md=claude_md,
        docker_compose_yml=docker_compose_yml,
        vantage_lock_json=vantage_lock_json,
        agents_md=agents_md,
        codex_md=codex_md
    )

from app.core.llm_router import router, MODEL_CODE_GUARDRAILS

async def generate_guardrail_bundle(
    blueprint_text: str,
    feasibility_data: Optional[Dict[str, Any]] = None,
    problem: str = "",
    organizer: str = "Hackathon / Enterprise",
    workspace_mode: str = "hackathon",
    model_name: str = "gemini-3.5-flash-lite",
    api_key: Optional[str] = None,
    byok_gemini: Optional[str] = None,
) -> IDEGuardrailBundle:
    """Invokes Cohere North Mini Code (or fallback) to generate custom IDE guardrails or returns high-fidelity fallback."""
    prompt = f"""You are the Lead Systems Architect and DevOps Governor.
TASK: Translate this architectural blueprint and feasibility trade-offs into an exact, runnable IDE Guardrail Bundle.

CONTEXT:
Problem Statement: {problem}
Organizer / Client: {organizer}
Workspace Mode: {workspace_mode}
Architectural Blueprint Excerpt:
{blueprint_text[:3500]}

Feasibility & Scope Cuts:
{json.dumps(feasibility_data or {}, indent=2)[:1500]}

Generate 6 production files:
1. `cursorrules`: Complete .cursorrules text enforcing folder layout, allowed dependencies, API schema discipline, and a strict DO NOT BUILD list derived from scope cuts.
2. `claude_md`: Complete CLAUDE.md containing exact terminal commands for build/test, database migrations, and anti-spaghetti rules.
3. `agents_md`: Complete AGENTS.md for Google Antigravity IDE/CLI containing agent roles, skills structure, and Google GenAI conventions.
4. `codex_md`: Complete CODEX.md containing OpenAI Codex / Copilot guardrails.
5. `docker_compose_yml`: Complete runnable docker-compose.yml wiring the exact services (frontend, backend, postgres/pgvector, redis, queues).
6. `vantage_lock_json`: Stringified JSON contract (vantage.lock.json) with approved services, ports, forbidden packages, and CI drift assertions.

Return ONLY valid JSON matching this schema:
{{
  "cursorrules": "string",
  "claude_md": "string",
  "agents_md": "string",
  "codex_md": "string",
  "docker_compose_yml": "string",
  "vantage_lock_json": "string"
}}
"""
    try:
        routed_res = await router.complete(
            task="guardrails",
            prompt=prompt,
            temperature=0.2,
            byok_openrouter=api_key,
            byok_gemini=byok_gemini,
            model_override=model_name if model_name != "gemini-3.5-flash-lite" else None,
        )
        text = extract_text_content(routed_res.content)
        parsed = parse_json_robustly(text)
        if parsed and isinstance(parsed, dict) and "cursorrules" in parsed:
            fb = generate_fallback_guardrail_bundle(problem, organizer, blueprint_text, feasibility_data, workspace_mode)
            return IDEGuardrailBundle(
                cursorrules=parsed.get("cursorrules", fb.cursorrules),
                claude_md=parsed.get("claude_md", fb.claude_md),
                agents_md=parsed.get("agents_md", fb.agents_md),
                codex_md=parsed.get("codex_md", fb.codex_md),
                docker_compose_yml=parsed.get("docker_compose_yml", fb.docker_compose_yml),
                vantage_lock_json=parsed.get("vantage_lock_json", fb.vantage_lock_json)
            )
    except Exception as e:
        print(f"Error in LLM guardrail generation: {e}. Utilizing deterministic fallback.")

    return generate_fallback_guardrail_bundle(
        problem, organizer, blueprint_text, feasibility_data, workspace_mode
    )
