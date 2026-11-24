"""Heterogeneous Multi-Model 4-Phase LangGraph Workflow for Vantage.

Orchestrates 10 Permanent OpenRouter Models + Google Gemini in a disciplined DAG:
- Phase 1 (Fan-Out): safety_gate_node -> (recon_and_scout_node, multimodal_rag_node, jury_profiler_node)
- Phase 2 (Anchor): principal_architect_node (Nemotron 3 Ultra 550B)
- Phase 3 (Fan-Out): devils_advocate_node + feasibility_node (Nemotron 3 Super 120B)
- Phase 4 (Fan-Out): scrum_master_node, pitch_strategist_node, business_strategist_node, ux_visionary_node -> END
"""

from __future__ import annotations

import os
import time
import json
import asyncio
from typing import Dict, Any, List

from langgraph.graph import StateGraph, START, END
from app.graph.state import HackathonState
from app.core.llm_router import (
    router,
    MODEL_CORE_ARCH,
    MODEL_HIGH_SPEED_COUNCIL,
    MODEL_PROFILER_PITCH,
    MODEL_RECON_SCRAPER,
    MODEL_MULTIMODAL_UX,
    MODEL_CONTENT_SAFETY,
)
from app.db.vector_store import hybrid_search_with_rerank
from agents.scraper import search_duckduckgo
from utils import (
    parse_json_robustly,
    generate_dynamic_feasibility_fallback,
    generate_dynamic_pitch_fallback,
    extract_problem_keywords,
    generate_dynamic_agency_rfp_feasibility,
)
from agents.principal_architect import (
    async_generate_senior_engineer_blueprint,
    generate_senior_engineer_blueprint,
    generate_fallback_blueprint,
    extract_mermaid_code,
)


# =============================================================================
# PHASE 1 NODES
# =============================================================================

async def safety_gate_node(state: HackathonState) -> Dict[str, Any]:
    """Scans problem statement & context for injection or jailbreak payloads."""
    t0 = time.time()
    prob = state.get("problem_statement", "")
    byok_or = state.get("byok_openrouter")
    byok_gem = state.get("byok_gemini")

    safety_res = await router.check_content_safety(
        text=prob,
        context="hackathon_problem_statement",
        byok_openrouter=byok_or,
        byok_gemini=byok_gem,
    )

    latency = int((time.time() - t0) * 1000)
    telemetry_item = {
        "node": "safety_gate",
        "agent": "Security Gateway Shield",
        "model_used": safety_res.get("model_used", MODEL_CONTENT_SAFETY),
        "provider": safety_res.get("provider", "local"),
        "tier": "Security Gateway & Repo Injection Shield (4B)",
        "latency_ms": latency,
        "input_tokens": len(prob) // 4,
        "output_tokens": 30,
        "cost_usd": 0.0,
        "status": "completed",
        "details": f"Content safety verified: threat_level={safety_res.get('threat_level')}",
    }

    return {
        "safety_status": safety_res,
        "telemetry": [telemetry_item],
    }


async def recon_and_scout_node(state: HackathonState) -> Dict[str, Any]:
    """Mines DuckDuckGo and GitHub using Google Gemma 4 26B-A4B MoE."""
    t0 = time.time()
    org = state.get("organizer_name", "Hackathon")
    prob = state.get("problem_statement", "")
    byok_or = state.get("byok_openrouter")
    byok_gem = state.get("byok_gemini")

    web_results = await asyncio.to_thread(search_duckduckgo, f"{org} hackathon past winners GitHub projects", max_results=3)
    if not web_results:
        web_results = await asyncio.to_thread(search_duckduckgo, f"{prob[:80]} open source system architecture github", max_results=3)

    context_str = "\n".join([f"- [{r.get('title', '')}]: {r.get('snippet', '')}" for r in web_results])

    prompt = (
        f"You are a Senior Open-Source & Competitive Intelligence Scout.\n"
        f"Organizer: {org}\n"
        f"Problem: {prob[:300]}\n"
        f"Scraped Web Data:\n{context_str}\n\n"
        f"TASK: Extract past winning patterns, key prior-art GitHub repositories, and benchmarks.\n"
        f"Return ONLY valid JSON matching:\n"
        f"{{\n"
        f"  \"past_editions_analyzed\": \"Summary of past editions & winners\",\n"
        f"  \"winning_patterns\": [\"Pattern 1\", \"Pattern 2\", \"Pattern 3\"],\n"
        f"  \"winning_ppt_strategy\": \"Presentation flow breakdown\",\n"
        f"  \"benchmarks\": [\"Latency < 250ms\", \"Zero external cloud costs\"]\n"
        f"}}"
    )

    res = await router.complete(
        task="scraper",
        prompt=prompt,
        temperature=0.2,
        byok_openrouter=byok_or,
        byok_gemini=byok_gem,
    )

    parsed = parse_json_robustly(res.content)
    if not parsed or not isinstance(parsed, dict):
        parsed = {
            "past_editions_analyzed": f"Winning solutions for {org} deliver demonstrable end-to-end data processing pipelines with verified open-source tooling.",
            "winning_patterns": [
                "Full Stack Working Prototype over mock-heavy slides.",
                "Offline-first fault tolerance against field connectivity dropouts.",
                "Ruthless scope hygiene cutting non-essential microservices.",
            ],
            "winning_ppt_strategy": "Problem reality -> Secret sauce architecture -> Live pipeline simulation -> ROI.",
            "benchmarks": ["P95 latency < 300ms", "Zero broken endpoints during jury cross-examination"],
        }

    parsed["web_sources"] = web_results if web_results else [
        {"title": f"{org} Previous Editions Archive", "snippet": "Historical benchmarks and rubrics", "url": "#"}
    ]

    telemetry_item = {
        "node": "recon_and_scout",
        "agent": "Web & GitHub Recon Scout",
        "model_used": res.model_used,
        "provider": res.provider,
        "tier": res.tier,
        "latency_ms": res.latency_ms,
        "input_tokens": res.input_tokens,
        "output_tokens": res.output_tokens,
        "cost_usd": res.cost_usd,
        "status": "completed",
        "details": f"Synthesized web intel with {len(parsed['web_sources'])} live citations.",
    }

    return {
        "scraped_history": [
            {"project_name": r.get("title", "")[:40], "description": r.get("snippet", "")[:120], "url": r.get("url", "")}
            for r in web_results
        ],
        "precedent_intelligence": parsed,
        "github_intel": {
            "query_used": f"{org} {prob[:40]}",
            "open_source_precedents": [r.get("title", "") for r in web_results[:3]],
        },
        "telemetry": [telemetry_item],
    }


async def multimodal_rag_node(state: HackathonState) -> Dict[str, Any]:
    """Embeds and reranks precedents with Nemotron 1B Embedder and Cross-Encoder Reranker."""
    t0 = time.time()
    prob = state.get("problem_statement", "")
    org = state.get("organizer_name", "Hackathon")
    byok_or = state.get("byok_openrouter")
    byok_gem = state.get("byok_gemini")

    rag_results = await hybrid_search_with_rerank(
        query=prob,
        organizer=org,
        top_k=4,
        candidate_pool_size=15,
        byok_openrouter=byok_or,
        byok_gemini=byok_gem,
    )

    latency = int((time.time() - t0) * 1000)
    telemetry_item = {
        "node": "multimodal_rag",
        "agent": "Nemotron Multimodal pgvector RAG",
        "model_used": "nvidia/nemotron-3-embed-1b:free + reranker",
        "provider": "openrouter",
        "tier": "pgvector Multimodal Embedder & Reranker",
        "latency_ms": latency,
        "input_tokens": len(prob) // 4,
        "output_tokens": 128,
        "cost_usd": 0.0,
        "status": "completed",
        "details": f"Retrieved and cross-encoder reranked {len(rag_results)} vector precedents.",
    }

    return {
        "multimodal_rag_context": rag_results,
        "telemetry": [telemetry_item],
    }


async def jury_profiler_node(state: HackathonState) -> Dict[str, Any]:
    """Reverse-engineers scoring weights and jury traps using Gemma 4 31B."""
    org = state.get("organizer_name", "National Hackathon")
    prob = state.get("problem_statement", "")
    constraints = state.get("custom_constraints", "")
    byok_or = state.get("byok_openrouter")
    byok_gem = state.get("byok_gemini")

    prompt = (
        f"You are an Elite Hackathon Jury Profiler and Rubric Analyst.\n"
        f"Organizer: {org}\n"
        f"Problem Statement: {prob}\n"
        f"{'Target Constraints: ' + constraints if constraints else ''}\n\n"
        f"TASK:\n"
        f"1. Profile the judging panel for {org}: their technical backgrounds, biases, and hot-button priorities.\n"
        f"2. Provide an Evaluation Rubric Breakdown with scoring weights (Architecture 30%, Feasibility 30%, Innovation 20%, Presentation 20%).\n"
        f"3. List 'Winning Cheat Codes' and 'Disqualification Red Flags' to ensure the team ranks #1."
    )

    res = await router.complete(
        task="profiler",
        prompt=prompt,
        temperature=0.3,
        byok_openrouter=byok_or,
        byok_gemini=byok_gem,
    )

    profile_text = res.content.strip()
    if not profile_text:
        profile_text = (
            f"### Jury Profile & Rubric Matrix for {org}\n\n"
            f"* **Jury Mindset**: Senior engineering directors and domain practitioners seeking verifiable systems.\n"
            f"* **Scoring Weight Distribution**:\n"
            f"  - **Technical Architecture & Data Pipeline**: 30%\n"
            f"  - **Field Feasibility & Low-Cost Bill of Materials**: 30%\n"
            f"  - **Innovation & Algorithmic Moat**: 20%\n"
            f"  - **Presentation Clarity & Live Demo Flow**: 20%\n"
            f"* **Winning Cheat Codes**:\n"
            f"  - Demonstrate end-to-end data flow live in front of the judges.\n"
            f"  - Explicitly justify tech stack trade-offs ('Why we chose X over Y')."
        )

    telemetry_item = {
        "node": "jury_profiler",
        "agent": "Jury Profiler & Rubrics",
        "model_used": res.model_used,
        "provider": res.provider,
        "tier": res.tier,
        "latency_ms": res.latency_ms,
        "input_tokens": res.input_tokens,
        "output_tokens": res.output_tokens,
        "cost_usd": res.cost_usd,
        "status": "completed",
        "details": f"Deconstructed scoring rubrics and jury biases for '{org}'.",
    }

    return {
        "jury_profile": profile_text,
        "telemetry": [telemetry_item],
    }


# =============================================================================
# PHASE 2 NODE: PRINCIPAL ARCHITECT (ANCHOR)
# =============================================================================

async def principal_architect_node(state: HackathonState) -> Dict[str, Any]:
    """Generates 11-section system blueprint with Mermaid C4 diagram using Nemotron 3 Ultra 550B."""
    org = state.get("organizer_name", "Hackathon")
    prob = state.get("problem_statement", "")
    jury_profile = state.get("jury_profile", "")
    constraints = state.get("custom_constraints", "")
    byok_or = state.get("byok_openrouter")
    byok_gem = state.get("byok_gemini")
    preferred_model = state.get("preferred_model")

    t0 = time.time()
    try:
        blueprint_result = await async_generate_senior_engineer_blueprint(
            problem=prob,
            organizer=org,
            jury_profile=jury_profile,
            constraints=constraints or "",
            sources=state.get("precedent_intelligence", {}).get("web_sources", []),
            feasibility_data=state.get("feasibility_analysis"),
            model_name=preferred_model,
            temperature=0.2,
            byok_openrouter=byok_or,
            byok_gemini=byok_gem,
        )
        architecture = blueprint_result["architecture"]
        mermaid_code = blueprint_result.get("mermaid_code", "")
        model_used = blueprint_result.get("model_used", preferred_model or MODEL_CORE_ARCH)
        provider = blueprint_result.get("provider", "openrouter")
        tier = blueprint_result.get("tier", "Core Architecture & MoE Reasoning (550B)")
        latency = blueprint_result.get("latency_ms", int((time.time() - t0) * 1000))
        in_tokens = blueprint_result.get("input_tokens", (len(prob) + len(jury_profile)) // 4)
        out_tokens = blueprint_result.get("output_tokens", len(architecture) // 4)
    except Exception as e:
        print(f"[Workflow] Principal architect exception: {e}. Using resilient fallback.")
        fallback = generate_fallback_blueprint(prob, org, jury_profile, constraints or "")
        architecture = fallback["architecture"]
        mermaid_code = fallback.get("mermaid_code", "")
        model_used = MODEL_CORE_ARCH
        provider = "fallback"
        tier = "Core Architecture & MoE Reasoning (550B)"
        latency = int((time.time() - t0) * 1000)
        in_tokens = (len(prob) + len(jury_profile)) // 4
        out_tokens = len(architecture) // 4

    telemetry_item = {
        "node": "principal_architect",
        "agent": "Principal Architect (Senior Engineer Mode)",
        "model_used": model_used,
        "provider": provider,
        "tier": tier,
        "latency_ms": latency,
        "input_tokens": in_tokens,
        "output_tokens": out_tokens,
        "cost_usd": 0.0,
        "status": "completed",
        "details": "Engineered 11-section system specification with interactive Mermaid C4 diagram.",
    }

    return {
        "architecture_diagrams": mermaid_code,
        "final_blueprint": {
            "architecture": architecture,
            "mermaid_code": mermaid_code,
        },
        "telemetry": [telemetry_item],
    }


# =============================================================================
# PHASE 3 NODES: TRADE-OFFS & CRITICAL STRESS TESTING
# =============================================================================

async def feasibility_node(state: HackathonState) -> Dict[str, Any]:
    """Generates 0-100 Feasibility Score, MVP vs Post cuts, Cloud FinOps, and SOW sprints using Nemotron 3 Super 120B."""
    org = state.get("organizer_name", "Hackathon")
    prob = state.get("problem_statement", "")
    jury_profile = state.get("jury_profile", "")
    constraints = state.get("custom_constraints", "")
    workspace_mode = state.get("workspace_mode", "hackathon")
    byok_or = state.get("byok_openrouter")
    byok_gem = state.get("byok_gemini")

    if workspace_mode == "agency_rfp":
        prompt = (
            f"You are a Senior Solutions Architect preparing a Client RFP Response & Production SOW.\n"
            f"Client: {org}\n"
            f"Problem: {prob}\n"
            f"Jury / Stakeholder Context: {jury_profile[:300]}\n\n"
            f"TASK: Conduct a production feasibility audit with Cloud FinOps (1k, 10k, 100k users) and 4 SOW sprints.\n"
            f"Return ONLY valid JSON matching:\n"
            f"{{\n"
            f"  \"technical_feasibility\": {{\"score\": 95, \"summary\": \"Production-grade roadmap\", \"key_enablers\": [\"Enabler 1\"]}},\n"
            f"  \"economic_viability\": {{\"score\": 90, \"summary\": \"Cloud FinOps summary\", \"unit_cost_estimate\": \"$0.02/user\"}},\n"
            f"  \"cloud_finops_monthly_estimates\": {{\"currency\": \"USD\", \"tiers\": [{{\"tier_name\": \"1,000 Users\", \"monthly_total_usd\": 185, \"breakdown\": {{}}}}]}},\n"
            f"  \"statement_of_work_sprints\": [{{\"sprint_number\": 1, \"duration_weeks\": 2, \"title\": \"Foundation\", \"deliverables\": [\"API\"], \"acceptance_criteria\": \"Tests pass\"}}],\n"
            f"  \"why_this_feature\": [{{\"feature\": \"Feature 1\", \"why_chosen\": \"Reason\", \"rubric_alignment\": \"Criteria\"}}],\n"
            f"  \"why_not_that_feature\": [{{\"feature\": \"Feature 2\", \"why_rejected\": \"Reason\", \"risk_avoided\": \"Crash\"}}],\n"
            f"  \"tech_tradeoffs\": [{{\"layer\": \"Database\", \"chosen\": \"PostgreSQL\", \"alternative\": \"MongoDB\", \"tradeoff_rationale\": \"Strict relational schema\"}}]\n"
            f"}}"
        )
    else:
        prompt = (
            f"You are an Elite Hackathon Feasibility Strategist.\n"
            f"Organizer: {org}\n"
            f"Problem: {prob}\n"
            f"Jury Profile Context: {jury_profile[:300]}\n\n"
            f"TASK: Evaluate feasibility in a 24-36h sprint. Build 'Why THIS vs Why NOT THAT' feature matrix and comparative tech trade-offs.\n"
            f"Return ONLY valid JSON matching:\n"
            f"{{\n"
            f"  \"technical_feasibility\": {{\"score\": 92, \"summary\": \"High feasibility in 36h\", \"key_enablers\": [\"Pre-built SDKs\"]}},\n"
            f"  \"economic_viability\": {{\"score\": 88, \"summary\": \"Zero cloud spend for demo\", \"unit_cost_estimate\": \"$0.00 during hackathon\"}},\n"
            f"  \"mvp_scope_cuts\": [\"Omit Kubernetes\", \"Omit blockchain integration\"],\n"
            f"  \"why_this_feature\": [{{\"feature\": \"Core Pipeline\", \"why_chosen\": \"High rubric weight\", \"rubric_alignment\": \"30% Working Prototype\"}}],\n"
            f"  \"why_not_that_feature\": [{{\"feature\": \"Mobile App\", \"why_rejected\": \"Time sink\", \"risk_avoided\": \"Incomplete demo\"}}],\n"
            f"  \"tech_tradeoffs\": [{{\"layer\": \"Backend\", \"chosen\": \"FastAPI\", \"alternative\": \"Django\", \"tradeoff_rationale\": \"Async performance and minimal boilerplate\"}}]\n"
            f"}}"
        )

    res = await router.complete(
        task="feasibility",
        prompt=prompt,
        temperature=0.3,
        byok_openrouter=byok_or,
        byok_gemini=byok_gem,
    )

    feasibility_data = parse_json_robustly(res.content)
    if not feasibility_data or not isinstance(feasibility_data, dict):
        if workspace_mode == "agency_rfp":
            feasibility_data = generate_dynamic_agency_rfp_feasibility(prob, org)
        else:
            feasibility_data = generate_dynamic_feasibility_fallback(prob, org, constraints)

    telemetry_item = {
        "node": "feasibility",
        "agent": "Trade-off & Feasibility Engine",
        "model_used": res.model_used,
        "provider": res.provider,
        "tier": res.tier,
        "latency_ms": res.latency_ms,
        "input_tokens": res.input_tokens,
        "output_tokens": res.output_tokens,
        "cost_usd": res.cost_usd,
        "status": "completed",
        "details": f"Computed Feasibility Score ({feasibility_data.get('technical_feasibility', {}).get('score', 92)}/100) and trade-off matrix.",
    }

    return {
        "feasibility_analysis": feasibility_data,
        "scope_cut_analysis": {
            "mvp_cuts": feasibility_data.get("mvp_scope_cuts", []),
            "why_not_that": feasibility_data.get("why_not_that_feature", []),
        },
        "final_blueprint": {
            "feasibility": feasibility_data,
            "tradeoff_matrix": feasibility_data.get("tech_tradeoffs", []),
        },
        "telemetry": [telemetry_item],
    }


async def devils_advocate_node(state: HackathonState) -> Dict[str, Any]:
    """Stress tests the architecture, finds SPOFs, and generates 5 toughest jury questions using Nemotron 3 Super 120B."""
    prob = state.get("problem_statement", "")
    arch = state.get("final_blueprint", {}).get("architecture", "")
    byok_or = state.get("byok_openrouter")
    byok_gem = state.get("byok_gemini")

    prompt = (
        f"You are the Devil's Advocate and Lead Red-Team Architect for Hackathon Defense.\n"
        f"Problem: {prob}\n"
        f"Proposed Architecture:\n{arch[:1500]}\n\n"
        f"TASK: Poke holes into the design. Identify 3 single points of failure (SPOFs), unproven assumptions, "
        f"and the 5 hardest cross-examination questions judges will ask during the demo.\n"
        f"Return ONLY valid JSON matching:\n"
        f"{{\n"
        f"  \"single_points_of_failure\": [\"SPOF 1 with mitigation\", \"SPOF 2 with mitigation\"],\n"
        f"  \"unproven_assumptions\": [\"Assumption 1\", \"Assumption 2\"],\n"
        f"  \"hardest_jury_questions\": [\n"
        f"    {{\"question\": \"Tough inquiry\", \"recommended_defense\": \"Rock-solid technical answer\"}}\n"
        f"  ]\n"
        f"}}"
    )

    res = await router.complete(
        task="devils_advocate",
        prompt=prompt,
        temperature=0.4,
        byok_openrouter=byok_or,
        byok_gemini=byok_gem,
    )

    risk_data = parse_json_robustly(res.content)
    if not risk_data or not isinstance(risk_data, dict):
        risk_data = {
            "single_points_of_failure": [
                "Single database instance without read replica during peak jury demo traffic -> Mitigate with in-memory caching layer.",
                "Third-party API rate limit exhaustion during live demo -> Mitigate with pre-seeded fallback responses.",
            ],
            "unproven_assumptions": [
                "Assuming low-latency cellular connectivity in the demo hall.",
                "Assuming zero breaking schema changes between microservices.",
            ],
            "hardest_jury_questions": [
                {"question": "How does your architecture handle network disconnection during telemetry streaming?", "recommended_defense": "Local SQLite edge buffering with automatic reconnection and replay."},
                {"question": "Why did you build custom services instead of existing managed services?", "recommended_defense": "To maintain zero cold starts and achieve 100% deterministic local reproducible evaluation."},
            ],
        }

    telemetry_item = {
        "node": "devils_advocate",
        "agent": "Devil's Advocate Stress Tester",
        "model_used": res.model_used,
        "provider": res.provider,
        "tier": res.tier,
        "latency_ms": res.latency_ms,
        "input_tokens": res.input_tokens,
        "output_tokens": res.output_tokens,
        "cost_usd": res.cost_usd,
        "status": "completed",
        "details": f"Flagged {len(risk_data.get('single_points_of_failure', []))} SPOFs and synthesized tough jury defense counter-arguments.",
    }

    return {
        "risk_assessment": risk_data,
        "telemetry": [telemetry_item],
    }


# =============================================================================
# PHASE 4 NODES: DELIVERY, STORYTELLING & UX
# =============================================================================

async def scrum_master_node(state: HackathonState) -> Dict[str, Any]:
    """Generates hour-by-hour 24h/48h sprint timeline with zero-blocking tracks using Nemotron 3 Super 120B."""
    prob = state.get("problem_statement", "")
    byok_or = state.get("byok_openrouter")
    byok_gem = state.get("byok_gemini")

    prompt = (
        f"You are an Elite Hackathon Technical Project Manager & Scrum Master.\n"
        f"Problem: {prob}\n\n"
        f"TASK: Generate an hour-by-hour 24-hour sprint execution timeline with parallel tracks for Frontend, Backend, and AI/DevOps.\n"
        f"Return ONLY valid JSON matching:\n"
        f"{{\n"
        f"  \"checkpoints\": [\n"
        f"    {{\"hours\": \"0-4h\", \"title\": \"Foundation & Contracts\", \"frontend_tasks\": \"Setup Next.js, Mock API client\", \"backend_tasks\": \"Setup FastAPI, Define Pydantic Schemas\", \"milestone\": \"API contract locked\"}},\n"
        f"    {{\"hours\": \"4-12h\", \"title\": \"Core Pipeline & Persistence\", \"frontend_tasks\": \"Dashboard wireframes, State management\", \"backend_tasks\": \"Core ingestion, pgvector integration\", \"milestone\": \"End-to-end data flow\"}},\n"
        f"    {{\"hours\": \"12-20h\", \"title\": \"Polish & Edge Cases\", \"frontend_tasks\": \"Mermaid diagram viewer, Error toasts\", \"backend_tasks\": \"Latency optimization, Fallback recovery\", \"milestone\": \"Feature freeze\"}},\n"
        f"    {{\"hours\": \"20-24h\", \"title\": \"Demo Video & Rehearsals\", \"frontend_tasks\": \"Demo script sync\", \"backend_tasks\": \"Docker compose verification\", \"milestone\": \"Jury submission ready\"}}\n"
        f"  ]\n"
        f"}}"
    )

    res = await router.complete(
        task="scrum_master",
        prompt=prompt,
        temperature=0.3,
        byok_openrouter=byok_or,
        byok_gemini=byok_gem,
    )

    timeline_data = parse_json_robustly(res.content)
    if not timeline_data or not isinstance(timeline_data, dict):
        timeline_data = {
            "checkpoints": [
                {"hours": "0-4h", "title": "Contract Lock & Scaffolding", "frontend_tasks": "Next.js 16 skeleton, Mock state hooks", "backend_tasks": "FastAPI routes, Pydantic schemas", "milestone": "Contracts locked"},
                {"hours": "4-12h", "title": "Core Pipeline Execution", "frontend_tasks": "Interactive studio components", "backend_tasks": "Multi-model router & RAG engine", "milestone": "First end-to-end trace"},
                {"hours": "12-18h", "title": "Defensive Hardening", "frontend_tasks": "Error recovery toasts, SVG export", "backend_tasks": "Rate-limit circuit breakers", "milestone": "Zero crash guarantee"},
                {"hours": "18-24h", "title": "Demo Polish & Pitch Sync", "frontend_tasks": "High-contrast visual styling", "backend_tasks": "Docker compose verify", "milestone": "Submission locked"},
            ]
        }

    telemetry_item = {
        "node": "scrum_master",
        "agent": "Scrum Master & Execution Engine",
        "model_used": res.model_used,
        "provider": res.provider,
        "tier": res.tier,
        "latency_ms": res.latency_ms,
        "input_tokens": res.input_tokens,
        "output_tokens": res.output_tokens,
        "cost_usd": res.cost_usd,
        "status": "completed",
        "details": f"Generated hour-by-hour 24h sprint breakdown with {len(timeline_data.get('checkpoints', []))} milestones.",
    }

    return {
        "execution_timeline": timeline_data,
        "telemetry": [telemetry_item],
    }


async def pitch_strategist_node(state: HackathonState) -> Dict[str, Any]:
    """Generates 5-slide winning presentation deck and Q&A defense using Gemma 4 31B."""
    org = state.get("organizer_name", "National Hackathon")
    prob = state.get("problem_statement", "")
    jury_profile = state.get("jury_profile", "")
    byok_or = state.get("byok_openrouter")
    byok_gem = state.get("byok_gemini")

    prompt = (
        f"You are a World-Class Pitch Coach & Storyteller.\n"
        f"Organizer: {org}\n"
        f"Problem: {prob}\n"
        f"Jury Profile Context: {jury_profile[:300]}\n\n"
        f"TASK: Design a winning 5-slide pitch deck structure and 3 tough cross-examination answers.\n"
        f"Return ONLY valid JSON matching:\n"
        f"{{\n"
        f"  \"slides\": [\n"
        f"    {{\"title\": \"Slide 1: The Problem Reality\", \"content\": \"Core pain points & market urgency\", \"speaker_notes\": \"What to say out loud\"}},\n"
        f"    {{\"title\": \"Slide 2: Our Architecture & Secret Sauce\", \"content\": \"Why our system works when others fail\", \"speaker_notes\": \"Explain technical secret\"}},\n"
        f"    {{\"title\": \"Slide 3: Live End-to-End Demo\", \"content\": \"Demonstration flow and user telemetry\", \"speaker_notes\": \"Guide the judge's eyes\"}},\n"
        f"    {{\"title\": \"Slide 4: Field Feasibility & Low Cost\", \"content\": \"Unit economics and deployability\", \"speaker_notes\": \"Demonstrate viability\"}},\n"
        f"    {{\"title\": \"Slide 5: Team & Next Steps\", \"content\": \"Production roadmap\", \"speaker_notes\": \"Call to action\"}}\n"
        f"  ],\n"
        f"  \"jury_defense_qa\": [\n"
        f"    {{\"question\": \"Tough inquiry\", \"defense\": \"Bulletproof winning answer with technical justification\"}}\n"
        f"  ]\n"
        f"}}"
    )

    res = await router.complete(
        task="pitch",
        prompt=prompt,
        temperature=0.5,
        byok_openrouter=byok_or,
        byok_gemini=byok_gem,
    )

    pitch_data = parse_json_robustly(res.content)
    if not pitch_data or not isinstance(pitch_data, dict):
        pitch_data = generate_dynamic_pitch_fallback(prob, org, jury_profile)

    telemetry_item = {
        "node": "pitch_strategist",
        "agent": "Pitch Deck & Storyteller",
        "model_used": res.model_used,
        "provider": res.provider,
        "tier": res.tier,
        "latency_ms": res.latency_ms,
        "input_tokens": res.input_tokens,
        "output_tokens": res.output_tokens,
        "cost_usd": res.cost_usd,
        "status": "completed",
        "details": f"Synthesized {len(pitch_data.get('slides', []))}-slide deck and jury defense Q&A.",
    }

    return {
        "final_blueprint": {
            "pitch_outline": pitch_data,
            "jury_defense_qa": pitch_data.get("jury_defense_qa", []),
        },
        "telemetry": [telemetry_item],
    }


async def business_strategist_node(state: HackathonState) -> Dict[str, Any]:
    """Generates Lean Canvas, unit economics, and GTM strategy using Nemotron 3 Super 120B."""
    prob = state.get("problem_statement", "")
    byok_or = state.get("byok_openrouter")
    byok_gem = state.get("byok_gemini")

    prompt = (
        f"You are a Venture Capital & Product Monetization Strategist.\n"
        f"Problem: {prob}\n\n"
        f"TASK: Formulate a clear monetization strategy, TAM/SAM/SOM sizing, and first-100-customers GTM.\n"
        f"Return ONLY valid JSON matching:\n"
        f"{{\n"
        f"  \"lean_canvas\": {{\"unique_value_prop\": \"...\", \"unfair_advantage\": \"...\", \"channels\": [\"...\"]}},\n"
        f"  \"market_size\": {{\"tam\": \"$10B\", \"sam\": \"$1.5B\", \"som\": \"$50M\"}},\n"
        f"  \"monetization_model\": \"B2B SaaS with usage-based compute tiers\",\n"
        f"  \"gtm_first_100_users\": \"Direct outreach to enterprise engineering leads via open-source CLI adoption\"\n"
        f"}}"
    )

    res = await router.complete(
        task="business",
        prompt=prompt,
        temperature=0.4,
        byok_openrouter=byok_or,
        byok_gemini=byok_gem,
    )

    business_data = parse_json_robustly(res.content)
    if not business_data or not isinstance(business_data, dict):
        business_data = {
            "lean_canvas": {
                "unique_value_prop": "Autonomous multi-model architectural intelligence that eliminates scope explosion.",
                "unfair_advantage": "Heterogeneous MoE model routing + deterministic fallback guarantee.",
                "channels": ["GitHub Actions integration", "Hackathon platform partnerships", "Developer communities"],
            },
            "market_size": {"tam": "$12B Developer Tooling", "sam": "$2.4B Enterprise Architecture", "som": "$80M Rapid Prototyping"},
            "monetization_model": "Freemium developer tier with enterprise SSO, private model routing, and security auditing.",
            "gtm_first_100_users": "Seed developer communities with free IDE guardrail generation tools.",
        }

    telemetry_item = {
        "node": "business_strategist",
        "agent": "Business & Monetization Strategist",
        "model_used": res.model_used,
        "provider": res.provider,
        "tier": res.tier,
        "latency_ms": res.latency_ms,
        "input_tokens": res.input_tokens,
        "output_tokens": res.output_tokens,
        "cost_usd": res.cost_usd,
        "status": "completed",
        "details": "Engineered Lean Canvas, TAM/SAM/SOM market sizing, and GTM adoption playbook.",
    }

    return {
        "business_model": business_data,
        "telemetry": [telemetry_item],
    }


async def ux_visionary_node(state: HackathonState) -> Dict[str, Any]:
    """Generates Mermaid user journey map and Tailwind v4 design tokens using Nemotron 3 Nano Omni 30B."""
    prob = state.get("problem_statement", "")
    byok_or = state.get("byok_openrouter")
    byok_gem = state.get("byok_gemini")

    prompt = (
        f"You are a Principal Product Designer & Design Systems Architect.\n"
        f"Problem: {prob}\n\n"
        f"TASK: Generate a user journey flow map in Mermaid syntax and modern Tailwind CSS v4 design tokens.\n"
        f"Return ONLY valid JSON matching:\n"
        f"{{\n"
        f"  \"user_journey_mermaid\": \"flowchart LR\\n  A[Landing / Upload] --> B[Analysis Engine]\\n  B --> C[Interactive Studio]\",\n"
        f"  \"tailwind_tokens\": {{\n"
        f"    \"primary\": \"#00E5FF\",\n"
        f"    \"accent\": \"#FF107A\",\n"
        f"    \"background\": \"#07070B\",\n"
        f"    \"glass\": \"backdrop-blur-xl bg-white/[0.03] border border-white/10\"\n"
        f"  }},\n"
        f"  \"key_micro_interactions\": [\"Instant Mermaid SVG zoom/pan\", \"Aurora gradient button glow on execution\"]\n"
        f"}}"
    )

    res = await router.complete(
        task="ux_visionary",
        prompt=prompt,
        temperature=0.4,
        byok_openrouter=byok_or,
        byok_gemini=byok_gem,
    )

    ux_data = parse_json_robustly(res.content)
    if not ux_data or not isinstance(ux_data, dict):
        ux_data = {
            "user_journey_mermaid": "flowchart LR\n  A[Builder Uploads Problem] --> B[Multi-Model Council Evaluates]\n  B --> C[Interactive Architecture Studio]\n  C --> D[One-Click IDE Launch]",
            "tailwind_tokens": {
                "primary": "#00E5FF",
                "accent": "#FF107A",
                "background": "#07070B",
                "surface": "rgba(255, 255, 255, 0.03)",
            },
            "key_micro_interactions": ["Whiteboard sketch to Mermaid compilation", "Real-time model attribution badges"],
        }

    telemetry_item = {
        "node": "ux_visionary",
        "agent": "UX Visionary & Design Architect",
        "model_used": res.model_used,
        "provider": res.provider,
        "tier": res.tier,
        "latency_ms": res.latency_ms,
        "input_tokens": res.input_tokens,
        "output_tokens": res.output_tokens,
        "cost_usd": res.cost_usd,
        "status": "completed",
        "details": "Constructed user journey Mermaid flow map and Tailwind v4 design tokens.",
    }

    return {
        "ux_design_system": ux_data,
        "telemetry": [telemetry_item],
    }


# =============================================================================
# BUILD THE 4-PHASE LANGGRAPH DAG
# =============================================================================

def build_heterogeneous_graph():
    """Compiles the 4-Phase LangGraph StateGraph."""
    builder = StateGraph(HackathonState)

    # 1. Register Nodes
    builder.add_node("safety_gate", safety_gate_node)
    builder.add_node("recon_and_scout", recon_and_scout_node)
    builder.add_node("multimodal_rag", multimodal_rag_node)
    builder.add_node("jury_profiler", jury_profiler_node)
    builder.add_node("principal_architect", principal_architect_node)
    builder.add_node("feasibility", feasibility_node)
    builder.add_node("devils_advocate", devils_advocate_node)
    builder.add_node("scrum_master", scrum_master_node)
    builder.add_node("pitch_strategist", pitch_strategist_node)
    builder.add_node("business_strategist", business_strategist_node)
    builder.add_node("ux_visionary", ux_visionary_node)

    # 2. Phase 1 Edges: START -> Safety Gate -> Fan-out to Recon, RAG, Profiler
    builder.add_edge(START, "safety_gate")
    def research_nodes(state: HackathonState):
        if not state.get("safety_status", {}).get("safe"):
            return END
        return ["recon_and_scout", "multimodal_rag", "jury_profiler"]

    builder.add_conditional_edges("safety_gate", research_nodes)
    builder.add_edge("recon_and_scout", "principal_architect")
    builder.add_edge("multimodal_rag", "principal_architect")
    builder.add_edge("jury_profiler", "principal_architect")

    # 4. Phase 3 Edges: Principal Architect fans out -> Devils Advocate & Feasibility
    builder.add_edge("principal_architect", "devils_advocate")
    builder.add_edge("principal_architect", "feasibility")

    # 5. Phase 4 Edges: Devils Advocate & Feasibility fan out -> Delivery & Storytelling
    builder.add_edge("feasibility", "scrum_master")
    builder.add_edge("feasibility", "pitch_strategist")
    builder.add_edge("feasibility", "business_strategist")
    builder.add_edge("feasibility", "ux_visionary")

    builder.add_edge("devils_advocate", "scrum_master")
    builder.add_edge("devils_advocate", "pitch_strategist")
    builder.add_edge("devils_advocate", "business_strategist")
    builder.add_edge("devils_advocate", "ux_visionary")

    # 6. Phase 4 to END
    builder.add_edge("scrum_master", END)
    builder.add_edge("pitch_strategist", END)
    builder.add_edge("business_strategist", END)
    builder.add_edge("ux_visionary", END)

    return builder.compile()


heterogeneous_graph = build_heterogeneous_graph()
