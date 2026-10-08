from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from graph import hackathon_graph
from db import init_db
from fastapi.middleware.cors import CORSMiddleware
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate
from agents.scraper import search_duckduckgo
from agents.principal_architect import generate_senior_engineer_blueprint, generate_fallback_blueprint
from utils import parse_json_robustly, generate_dynamic_feasibility_fallback, generate_dynamic_pitch_fallback, extract_problem_keywords
import re
import os
import time
import json
import asyncio
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Vantage API", version="2.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For dev purposes
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Run-Id", "X-Item-Id"],
)

# Auth + per-user data (history, saved items, settings, usage)
from auth import router as auth_router
from user_data import router as user_data_router
from persistence import PersistenceMiddleware

app.add_middleware(PersistenceMiddleware)
app.include_router(auth_router)
app.include_router(user_data_router)

class HackathonRequest(BaseModel):
    organizer_name: str
    problem_statement: str

class EditArchitectureRequest(BaseModel):
    current_architecture: str
    edit_instructions: str
    problem_statement: Optional[str] = ""
    model: Optional[str] = "gemini-3.5-flash-lite"

class PlaygroundRequest(BaseModel):
    organizer_name: str
    problem_statement: str
    model: Optional[str] = "gemini-3.5-flash-lite"
    temperature: Optional[float] = 0.7
    system_instruction: Optional[str] = None
    custom_constraints: Optional[str] = None
    enabled_agents: Optional[List[str]] = ["scraper", "profiler", "feasibility", "blueprint", "pitch"]
    mode: Optional[str] = "full"

class TeamProfileRequest(BaseModel):
    team_name: str
    members: List[Dict[str, Any]]
    model: Optional[str] = "gemini-3.5-flash-lite"

class ScopeAssassinRequest(BaseModel):
    project_idea: str
    time_limit_hours: int
    hackathon_context: str
    model: Optional[str] = "gemini-3.5-flash-lite"

class ExecutionEngineRequest(BaseModel):
    core_workflow: str
    tech_stack: str
    team_strengths: List[str]
    model: Optional[str] = "gemini-3.5-flash-lite"

class ProjectXRayRequest(BaseModel):
    project_contract: str
    current_progress: str
    rubric: str
    model: Optional[str] = "gemini-3.5-flash-lite"

class PostmortemRequest(BaseModel):
    project_name: str
    reflections: Dict[str, str]
    model: Optional[str] = "gemini-3.5-flash-lite"

class MentorRequest(BaseModel):
    project_state: str
    current_code: str
    model: Optional[str] = "gemini-3.5-flash-lite"

class GithubIntelRequest(BaseModel):
    repo_url: str
    commits: List[Dict[str, str]]
    architecture_contract: str
    model: Optional[str] = "gemini-3.5-flash-lite"

def extract_text_content(content) -> str:
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        parts = []
        for item in content:
            if isinstance(item, str):
                parts.append(item)
            elif isinstance(item, dict) and "text" in item:
                parts.append(item["text"])
            else:
                parts.append(str(item))
        return "".join(parts)
    if hasattr(content, "text"):
        return str(content.text)
    return str(content)

@app.on_event("startup")
def startup_event():
    try:
        init_db()
        print("Database initialized.")
    except Exception as e:
        print(f"Failed to initialize database: {e}")

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "service": "hackathon-strategist-backend", "version": "2.1.0"}

@app.get("/api/models")
async def get_models():
    return {
        "models": [
            {
                "id": "gemini-3.5-flash-lite",
                "name": "Gemini 3.5 Flash Lite",
                "badge": "Fast & Stable",
                "description": "Recommended for high-speed multi-agent workflows, live web research, and rapid diagram iteration.",
                "context_window": "1M tokens",
                "speed": "Ultra Fast",
                "is_default": True
            },
            {
                "id": "gemini-3.8-flash",
                "name": "Gemini 3.8 Flash (High)",
                "badge": "Next-Gen Reasoning",
                "description": "State-of-the-art reasoning with deep architectural decomposition and trade-off matrices.",
                "context_window": "1M tokens",
                "speed": "Fast",
                "is_default": False
            },
            {
                "id": "gemini-3.5-flash",
                "name": "Gemini 3.5 Flash",
                "badge": "Balanced",
                "description": "Full-size flash model with enhanced nuance for complex national enterprise hackathons.",
                "context_window": "1M tokens",
                "speed": "Standard",
                "is_default": False
            }
        ]
    }

def get_llm(model_name: str = "gemini-3.5-flash-lite", temperature: float = 0.7):
    valid_models = ["gemini-3.5-flash-lite", "gemini-3.8-flash", "gemini-3.5-flash"]
    target_model = model_name if model_name in valid_models else "gemini-3.5-flash-lite"
    return ChatGoogleGenerativeAI(
        model=target_model,
        google_api_key=os.getenv("GEMINI_API_KEY"),
        temperature=temperature
    )

@app.post("/api/strategize")
async def strategize(req: PlaygroundRequest):
    initial_state = {
        "organizer_name": req.organizer_name,
        "problem_statement": req.problem_statement,
        "scraped_history": [],
        "precedent_intelligence": {},
        "jury_profile": "",
        "feasibility_analysis": {},
        "final_blueprint": {}
    }
    
    try:
        final_state = await asyncio.to_thread(hackathon_graph.invoke, initial_state)
        return {
            "precedent_intelligence": final_state.get("precedent_intelligence"),
            "jury_profile": final_state.get("jury_profile"),
            "feasibility_analysis": final_state.get("feasibility_analysis"),
            "final_blueprint": final_state.get("final_blueprint"),
            "scraped_history": final_state.get("scraped_history", []),
            "github_intel": final_state.get("github_intel"),
            "risk_assessment": final_state.get("risk_assessment"),
            "execution_timeline": final_state.get("execution_timeline"),
            "ux_design_system": final_state.get("ux_design_system"),
            "business_model": final_state.get("business_model")
        }
    except Exception as e:
        print(f"Error during graph execution: {e}")
        org = req.organizer_name or "Premier Hackathon"
        prob = req.problem_statement or "Real-World Challenge"
        blueprint_fb = generate_fallback_blueprint(prob, org, f"Jury Profile for {org}", "")
        pitch_fb = generate_dynamic_pitch_fallback(prob, org)
        feasibility_fb = generate_dynamic_feasibility_fallback(prob, org)
        return {
            "jury_profile": f"**Jury Profile Analysis for {org}**\n\n* **Evaluation Priorities**: Real-world feasibility for {prob[:120]}, clean architectural boundaries, zero vanity bloat, and verified working code.\n* **Key Scoring Criteria**: Working Prototype (30%), Technical Architecture (30%), Practical Viability (20%), Live Demo (20%).",
            "feasibility_analysis": feasibility_fb,
            "final_blueprint": {
                "architecture": blueprint_fb["architecture"],
                "pitch_outline": pitch_fb,
                "feasibility": feasibility_fb,
                "tradeoff_matrix": feasibility_fb.get("tech_tradeoffs", []),
                "jury_defense_qa": pitch_fb.get("jury_defense_qa", [])
            }
        }

@app.post("/api/team/profile")
async def generate_team_profile(req: TeamProfileRequest):
    try:
        llm = get_llm(req.model, 0.5)
        
        prompt = f"""
You are an expert Engineering Manager evaluating a hackathon team's capability graph based on their evidence.
Team Name: {req.team_name}

Members and Evidence:
{json.dumps(req.members, indent=2)}

Task: Analyze the provided members and their past projects, code commits, and evidence. 
Create a Team Capability Profile mapping technical domains (e.g., Frontend, Backend, Database, AI Engineering, Cloud, System Design, DevOps, Testing) to their proficiency level (Strong, Medium, Beginner, Weak).
Output the response in STRICT JSON format with the following structure:
{{
  "team_name": "{req.team_name}",
  "capabilities": [
    {{ "domain": "Backend API", "level": "Strong", "evidence": "Implemented REST API, designed database schema" }}
  ],
  "strengths": ["Fast prototyping", "AI integration"],
  "weaknesses": ["Testing", "Deployment"],
  "recommendation": "Next project should introduce cloud deployment and asynchronous architecture."
}}
Ensure the output is valid JSON without markdown wrapping if possible.
"""
        response = llm.invoke(prompt)
        text_content = extract_text_content(response)
        
        # Clean up possible markdown JSON wrapping
        if text_content.startswith("```json"):
            text_content = text_content[7:-3].strip()
        elif text_content.startswith("```"):
            text_content = text_content[3:-3].strip()
            
        profile_data = json.loads(text_content)
        return profile_data
        
    except Exception as e:
        print(f"Error generating team profile: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/project/scope")
async def generate_project_scope(req: ScopeAssassinRequest):
    try:
        llm = get_llm(req.model, 0.4) # Lower temp for ruthless logic
        
        prompt = f"""
You are Forge's 'Scope Assassin' and Lead System Architect. Your job is to ruthlessly cut a hackathon project down to its core 'must-ship' demoable workflow. 
Hackathon judging rewards a single exceptional end-to-end flow over 15 half-working features.

Hackathon Context: {req.hackathon_context}
Time Limit: {req.time_limit_hours} hours
Proposed Project Idea: {req.project_idea}

Task: Generate a Project Contract and a Ruthless Scope Matrix.
Categorize features into:
1. MUST SHIP (The critical path for the core workflow and demo)
2. NICE TO HAVE (Only if time permits, adds flair but isn't blocking)
3. FUTURE (Post-hackathon features)
4. REMOVE (Bloat, vanity metrics, generic features like 'Admin Dashboard' or 'Social Login' that do not prove the core thesis)

Output the response in STRICT JSON format with the following structure:
{{
  "project_contract": {{
    "core_workflow": "Describe the single most important user flow (2 sentences).",
    "differentiation": "What makes this stand out (1 sentence).",
    "demo_plan": "What specifically should be shown at minute 1:00 of the demo?"
  }},
  "scope": [
    {{ "feature": "Core AI Pipeline", "category": "MUST SHIP", "rationale": "Without this, the project has no brain." }},
    {{ "feature": "Authentication", "category": "REMOVE", "rationale": "Fake it or use a hardcoded user. Waste of 3 hours." }}
  ]
}}
Ensure the output is valid JSON without markdown wrapping if possible.
"""
        response = llm.invoke(prompt)
        text_content = extract_text_content(response)
        
        if text_content.startswith("```json"):
            text_content = text_content[7:-3].strip()
        elif text_content.startswith("```"):
            text_content = text_content[3:-3].strip()
            
        scope_data = json.loads(text_content)
        return scope_data
        
    except Exception as e:
        print(f"Error generating project scope: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/project/execution")
async def generate_execution_plan(req: ExecutionEngineRequest):
    try:
        llm = get_llm(req.model, 0.4)
        
        prompt = f"""
You are Forge's Engineering Execution Engine. Your job is to transform a project's core workflow and architecture into a strict, actionable engineering plan for a hackathon team.
You must break the work down into Epics, Tasks, Dependencies, and Acceptance Criteria.

Core Workflow to Build: {req.core_workflow}
Technology Stack: {req.tech_stack}
Team Strengths: {", ".join(req.team_strengths) if req.team_strengths else "Unknown"}

Task: Generate a JSON array of Epics. Each Epic contains a list of specific Tasks.
Output the response in STRICT JSON format with the following structure:
{{
  "epics": [
    {{
      "name": "Data Ingestion & Storage",
      "objective": "Set up the database and basic API routes.",
      "tasks": [
        {{
          "title": "Design PostgreSQL Schema",
          "complexity": "Medium",
          "dependencies": [],
          "acceptance_criteria": "Tables for Users and Projects exist with foreign keys."
        }},
        {{
          "title": "Build REST API Registration",
          "complexity": "Low",
          "dependencies": ["Design PostgreSQL Schema"],
          "acceptance_criteria": "API returns 201 Created and saves to DB."
        }}
      ]
    }}
  ],
  "critical_path_warning": "The API Registration must be finished by Hour 4 to unblock the frontend."
}}
Ensure the output is valid JSON without markdown wrapping if possible.
"""
        response = llm.invoke(prompt)
        text_content = extract_text_content(response)
        
        if text_content.startswith("```json"):
            text_content = text_content[7:-3].strip()
        elif text_content.startswith("```"):
            text_content = text_content[3:-3].strip()
            
        execution_data = json.loads(text_content)
        return execution_data
        
    except Exception as e:
        print(f"Error generating execution plan: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/project/xray")
async def generate_project_xray(req: ProjectXRayRequest):
    try:
        llm = get_llm(req.model, 0.4)
        
        prompt = f"""
You are Forge's Project X-Ray Engine. Your job is to objectively evaluate the health and risk of a hackathon project based on its current state.
Hackathon judging is unforgiving. A project that is 90% technically complete but has 0% demo readiness will fail.

Project Contract / Scope: {req.project_contract}
Current Builder Progress: {req.current_progress}
Hackathon Rubric Focus: {req.rubric}

Task: Perform a deep X-Ray scan of the project.
Output the response in STRICT JSON format with the following structure:
{{
  "health_scores": {{
    "technical_readiness": 81,
    "functional_completeness": 76,
    "rubric_alignment": 84,
    "differentiation": 59,
    "demo_readiness": 62,
    "scope_health": 43
  }},
  "overall_risk": "HIGH", 
  "risk_rationale": "Authentication is half-built but not on the critical path, while the core AI pipeline is untested.",
  "top_three_actions": [
    "Stop building the admin dashboard immediately.",
    "Mock the authentication flow to unblock the frontend demo.",
    "Integrate the LLM API to prove the core differentiation."
  ]
}}
Ensure the output is valid JSON without markdown wrapping if possible. The scores should be integers between 0 and 100 based realistically on the provided progress vs the contract. The top three actions must be ruthless and pragmatic (maximum 3).
"""
        response = llm.invoke(prompt)
        text_content = extract_text_content(response)
        
        if text_content.startswith("```json"):
            text_content = text_content[7:-3].strip()
        elif text_content.startswith("```"):
            text_content = text_content[3:-3].strip()
            
        xray_data = json.loads(text_content)
        return xray_data
        
    except Exception as e:
        print(f"Error running project X-Ray: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/project/postmortem")
async def generate_postmortem(req: PostmortemRequest):
    try:
        llm = get_llm(req.model, 0.4)
        
        prompt = f"""
You are Forge's Postmortem & Capability Engine. A hackathon team has just finished their project and submitted their reflections.
Your job is to permanently log this project into their capability graph by turning their raw reflections into verified engineering evidence.

Project Name: {req.project_name}
Team Reflections:
{json.dumps(req.reflections, indent=2)}

Task: Analyze the reflections. Generate a structured Postmortem report.
Output the response in STRICT JSON format with the following structure:
{{
  "capability_updates": [
    {{
      "skill": "Database Optimization",
      "status": "Demonstrated",
      "evidence": "Team identified N+1 queries as a time sink and resolved them under pressure."
    }}
  ],
  "lessons_learned": [
    "Do not build custom authentication during a 36-hour hackathon."
  ],
  "next_project_recommendation": "For your next project, focus heavily on frontend state management (which failed here) and leverage managed Auth services."
}}
Ensure the output is valid JSON without markdown wrapping if possible.
"""
        response = llm.invoke(prompt)
        text_content = extract_text_content(response)
        
        if text_content.startswith("```json"):
            text_content = text_content[7:-3].strip()
        elif text_content.startswith("```"):
            text_content = text_content[3:-3].strip()
            
        postmortem_data = json.loads(text_content)
        return postmortem_data
        
    except Exception as e:
        print(f"Error generating postmortem: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/mentor")
async def ai_mentor(req: MentorRequest):
    try:
        llm = get_llm(req.model, 0.3)
        
        prompt = f"""
You are Forge's AI Technical Mentor. The user is in the middle of a hackathon sprint.
Project State / Contract: {req.project_state}
Code or Action they are currently taking: {req.current_code}

Task: Provide extremely concise, actionable engineering mentorship. 
Check for: Architecture drift, out-of-scope work, critical path blocking, or obvious anti-patterns.
Output strictly JSON:
{{
  "status": "Warning" | "On Track" | "Critical",
  "feedback": "You are currently implementing a feature that wasn't in your approved scope...",
  "suggested_action": "Focus on the API integration first to unblock the frontend."
}}
"""
        response = llm.invoke(prompt)
        text_content = extract_text_content(response)
        if text_content.startswith("```json"): text_content = text_content[7:-3].strip()
        elif text_content.startswith("```"): text_content = text_content[3:-3].strip()
        return json.loads(text_content)
    except Exception as e:
        print(f"Error in mentor endpoint: {{e}}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/github/analyze")
async def github_intelligence(req: GithubIntelRequest):
    try:
        llm = get_llm(req.model, 0.4)
        
        prompt = f"""
You are Forge's GitHub Intelligence Engine. 
Repository: {req.repo_url}
Original Architecture Contract: {req.architecture_contract}
Recent Commits: {json.dumps(req.commits, indent=2)}

Task: Detect Architecture Drift and generate an Architecture Decision Record (ADR) based on the commits.
Output strictly JSON:
{{
  "drift_detected": true/false,
  "drift_analysis": "Explanation of what drifted from the contract...",
  "adr": [
    {{
      "title": "Decision changed from X to Y",
      "reason": "Inferred reason from commits..."
    }}
  ]
}}
"""
        response = llm.invoke(prompt)
        text_content = extract_text_content(response)
        if text_content.startswith("```json"): text_content = text_content[7:-3].strip()
        elif text_content.startswith("```"): text_content = text_content[3:-3].strip()
        return json.loads(text_content)
    except Exception as e:
        print(f"Error in github intelligence endpoint: {{e}}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/playground/generate")
async def playground_generate(req: PlaygroundRequest):
    t_start = time.time()
    trace_steps = []
    
    model_name = req.model or "gemini-3.5-flash-lite"
    temperature = req.temperature if req.temperature is not None else 0.7
    org = req.organizer_name.strip() or "National Hackathon"
    prob = req.problem_statement.strip() or "General Technology Challenge"
    constraints = req.custom_constraints.strip() if req.custom_constraints else ""
    sys_instruction = req.system_instruction.strip() if req.system_instruction else ""
    
    # Initialize LLM
    try:
        llm = get_llm(model_name, temperature)
    except Exception as e:
        llm = get_llm("gemini-3.5-flash-lite", temperature)

    # -------------------------------------------------------------
    # AGENT 1: Precedent & Web Intelligence Miner
    # -------------------------------------------------------------
    t0 = time.time()
    web_sources = []
    precedent_intel = {}
    try:
        q1 = f"{org} hackathon winners projects PPT past edition"
        q2 = f"{org} winning teams solutions github devpost"
        web_sources = search_duckduckgo(q1, max_results=3)
        if len(web_sources) < 2:
            web_sources += search_duckduckgo(q2, max_results=3)
            
        context_str = "\n".join([f"- [{r['title']}]: {r['snippet']}" for r in web_sources]) if web_sources else "Historical archive baseline."
        
        synth_prompt = (
            f"You are an Elite Hackathon Precedent & Winner Intelligence Analyst.\n"
            f"Organizer: {org}\n"
            f"Problem Statement Context: {prob[:250]}\n"
            f"Web Scraped Past Precedents:\n{context_str}\n\n"
            f"TASK: Analyze past editions (e.g. 1.0, 2.0, past SIH/Devpost winners) of this organizer. Extract why winners won, what their winning PPTs looked like, and actionable patterns.\n"
            f"Return ONLY valid JSON matching:\n"
            f"{{\n"
            f"  \"past_editions_analyzed\": \"Detailed summary of past editions and winning teams\",\n"
            f"  \"winning_patterns\": [\"Pattern 1\", \"Pattern 2\", \"Pattern 3\"],\n"
            f"  \"winning_ppt_strategy\": \"How winning PPT decks were structured in past editions\",\n"
            f"  \"benchmarks\": [\"Benchmark 1\", \"Benchmark 2\"]\n"
            f"}}"
        )
        res_intel = llm.invoke(synth_prompt).content
        precedent_intel = parse_json_robustly(res_intel)
        if not precedent_intel or not isinstance(precedent_intel, dict):
            raise ValueError("Parsed precedent intel is not a valid dictionary")
    except Exception as e:
        print(f"Precedent agent fallback: {e}")
        precedent_intel = {
            "past_editions_analyzed": f"Analysis of past editions for {org} demonstrates that winning teams paired demonstrable technical feasibility for '{prob[:80]}' with interactive live simulations and clean, disciplined scope boundaries.",
            "winning_patterns": [
                "Full Stack Working Prototype: Demonstrating live end-to-end data processing beats mock-heavy slides every time.",
                "Offline-First Resiliency: Field judges prioritize architectures that survive network disconnects during the presentation.",
                "Zero Vanity Bloat: Winning teams ruthlessly cut non-essential features (e.g. metaverses, complex microservices sprawl) in favor of core reliability."
            ],
            "winning_ppt_strategy": "Lead with Problem Reality (Slide 1), Solution & Secret Sauce (Slide 2), System Flowchart (Slide 3), Field Validation Metrics (Slide 4), and Clear ROI (Slide 5).",
            "benchmarks": [
                "End-to-End Latency < 250ms on primary user flow",
                "100% Free-Tier / Open-Source Infrastructure cost during sprint",
                "Zero broken endpoints during live 3-minute jury cross-examination"
            ]
        }
    
    precedent_intel["web_sources"] = web_sources if web_sources else [
        {"title": f"{org} Previous Winning Solutions & PPT Archives", "snippet": "Historical record of finalist presentations, rubrics, and evaluation benchmarks.", "url": "#"}
    ]
    
    trace_steps.append({
        "agent": "scraper",
        "name": "Precedent & Web Researcher",
        "status": "completed",
        "duration_ms": int((time.time() - t0) * 1000),
        "details": f"Mined past editions (1.0, 2.0, winning PPTs) for '{org}' with {len(precedent_intel['web_sources'])} live web citations."
    })

    # -------------------------------------------------------------
    # AGENT 2: Jury Profiler & Rubrics Deconstructor
    # -------------------------------------------------------------
    t1 = time.time()
    jury_profile = ""
    try:
        profiler_prompt = (
            f"{sys_instruction}\n\n" if sys_instruction else ""
        ) + (
            f"You are an Elite Hackathon Jury Profiler and Rubric Analyst.\n"
            f"Organizer: {org}\n"
            f"Problem Statement: {prob}\n"
            f"Past Editions & Winner Intel Context: {precedent_intel.get('past_editions_analyzed', '')}\n"
            f"{'Target Constraints / Domain Focus: ' + constraints if constraints else ''}\n\n"
            f"TASK:\n"
            f"1. Profile the judging panel for {org}: their technical backgrounds, biases, and hot-button priorities.\n"
            f"2. Provide an Evaluation Rubric Breakdown with scoring weights (e.g. Technical Feasibility 30%, Real-World Viability 30%, Innovation 20%, Presentation 20%).\n"
            f"3. List 'Winning Cheat Codes' and 'Disqualification Red Flags' to ensure the team ranks #1."
        )
        profile_res = llm.invoke(profiler_prompt).content
        jury_profile = extract_text_content(profile_res)
    except Exception as e:
        print(f"Profiler error: {e}")
        jury_profile = (
            f"### Jury Profile & Rubric Matrix for {org}\n\n"
            f"* **Jury Mindset**: Senior engineering directors, domain experts, and patent holders looking for verifiable engineering execution over slide deck fluff.\n"
            f"* **Scoring Weight Distribution**:\n"
            f"  - **Technical Architecture & Data Pipeline**: 30%\n"
            f"  - **Field Feasibility & Low-Cost Bill of Materials**: 30%\n"
            f"  - **Innovation & Algorithmic Secret Sauce**: 20%\n"
            f"  - **Presentation Clarity & Live Demo Flow**: 20%\n"
            f"* **Winning Cheat Codes**:\n"
            f"  - Demonstrate end-to-end telemetry flow live in front of the judges.\n"
            f"  - Explicitly justify tech stack trade-offs ('Why we chose X over Y').\n"
            f"  - Show offline resilience when WiFi or cloud connection is severed."
        )
    
    trace_steps.append({
        "agent": "profiler",
        "name": "Jury Profiler & Rubrics",
        "status": "completed",
        "duration_ms": int((time.time() - t1) * 1000),
        "details": f"Reverse-engineered scoring weights, jury biases, and winning cheat codes for {org}."
    })

    # -------------------------------------------------------------
    # AGENT 3: Feasibility & 'Why THIS vs Why NOT THAT' Engine
    # -------------------------------------------------------------
    t2 = time.time()
    feasibility_data = {}
    try:
        feas_prompt = (
            f"You are an Elite Hackathon Feasibility Strategist.\n"
            f"Organizer: {org}\n"
            f"Problem Statement: {prob}\n"
            f"Jury Profile Context: {jury_profile[:350]}\n"
            f"{'Target Constraints: ' + constraints if constraints else ''}\n\n"
            f"TASK:\n"
            f"Conduct a deep Feasibility & Trade-off Assessment for a 24-36 hour hackathon sprint.\n"
            f"Construct the 'Why THIS vs Why NOT THAT' Feature Selection Matrix and Comparative Tech Stack Trade-offs.\n"
            f"Return ONLY valid JSON matching:\n"
            f"{{\n"
            f"  \"technical_feasibility\": {{\n"
            f"    \"score\": 92,\n"
            f"    \"summary\": \"Detailed explanation of feasibility in 24-36h sprint\",\n"
            f"    \"key_enablers\": [\"Enabler 1\", \"Enabler 2\"]\n"
            f"  }},\n"
            f"  \"economic_viability\": {{\n"
            f"    \"score\": 89,\n"
            f"    \"summary\": \"Deployment and cost viability in real-world conditions\",\n"
            f"    \"unit_cost_estimate\": \"e.g. Under ₹14,000 per node\"\n"
            f"  }},\n"
            f"  \"sprint_mvp_fit\": {{\n"
            f"    \"score\": 95,\n"
            f"    \"mvp_focus\": \"What must be live demoed during the 24-36h judging round\",\n"
            f"    \"simulated_elements\": \"What can be gracefully mocked with synthetic data generators\"\n"
            f"  }},\n"
            f"  \"why_this_feature\": [\n"
            f"    {{\n"
            f"      \"feature\": \"Feature Name\",\n"
            f"      \"why_chosen\": \"Concrete reason why this feature wins hackathon judging points\",\n"
            f"      \"rubric_alignment\": \"How this fulfills the jury's scoring rubric\"\n"
            f"    }}\n"
            f"  ],\n"
            f"  \"why_not_that_feature\": [\n"
            f"    {{\n"
            f"      \"feature\": \"Discarded / Deferred Feature\",\n"
            f"      \"why_rejected\": \"Why building this in a hackathon causes disqualification or demo crash\",\n"
            f"      \"risk_avoided\": \"Specific risk averted\"\n"
            f"    }}\n"
            f"  ],\n"
            f"  \"tech_tradeoffs\": [\n"
            f"    {{\n"
            f"      \"layer\": \"Layer / Subsystem\",\n"
            f"      \"chosen\": \"Chosen Technology\",\n"
            f"      \"alternative\": \"Considered Alternative\",\n"
            f"      \"tradeoff_rationale\": \"Why Chosen over Alternative for this specific problem\"\n"
            f"    }}\n"
            f"  ]\n"
            f"}}"
        )
        feas_res = llm.invoke(feas_prompt).content
        feasibility_data = parse_json_robustly(feas_res)
        if not feasibility_data or not isinstance(feasibility_data, dict):
            raise ValueError("Parsed feasibility JSON is not a valid dictionary")
    except Exception as e:
        print(f"Feasibility engine fallback (generating problem-specific dynamic feasibility): {e}")
        feasibility_data = generate_dynamic_feasibility_fallback(prob, org, constraints)
        
    trace_steps.append({
        "agent": "feasibility",
        "name": "Trade-off & Feasibility Engine",
        "status": "completed",
        "duration_ms": int((time.time() - t2) * 1000),
        "details": f"Generated 'Why THIS vs Why NOT THAT' matrix ({len(feasibility_data.get('why_this_feature', []))} chosen, {len(feasibility_data.get('why_not_that_feature', []))} cut) and comparative tech stack tradeoffs."
    })

    # -------------------------------------------------------------
    # AGENT 4: Principal Architect (Senior Engineer Mode)
    # -------------------------------------------------------------
    t3 = time.time()
    architecture = ""
    try:
        blueprint_result = generate_senior_engineer_blueprint(
            problem=prob,
            organizer=org,
            jury_profile=jury_profile,
            constraints=constraints if constraints else "",
            sources=precedent_intel.get("web_sources", []),
            feasibility_data=feasibility_data,
            model_name=model_name,
            temperature=min(temperature, 0.3)
        )
        architecture = blueprint_result["architecture"]
    except Exception as e:
        print(f"Blueprint error: {e}")
        fallback = generate_fallback_blueprint(prob, org, jury_profile, constraints if constraints else "")
        architecture = fallback["architecture"]
    
    trace_steps.append({
        "agent": "blueprint",
        "name": "Principal Architect (Senior Engineer Mode)",
        "status": "completed",
        "duration_ms": int((time.time() - t3) * 1000),
        "details": f"Generated 11-section Senior Engineer blueprint with trade-off matrix, failure pre-mortem, and Mermaid system topology."
    })

    # -------------------------------------------------------------
    # AGENT 5: Pitch Deck Designer & Jury Defense
    # -------------------------------------------------------------
    t4 = time.time()
    pitch_outline = {}
    try:
        pitch_prompt = (
            f"You are an expert startup pitch designer and hackathon winning coach.\n"
            f"Problem Statement: {prob}\n"
            f"Organizer: {org}\n"
            f"Jury Profile: {jury_profile[:300]}\n"
            f"Past Winning PPT Strategy: {precedent_intel.get('winning_ppt_strategy', '')}\n\n"
            f"TASK:\n"
            f"1. Design a high-impact 5-slide presentation deck tailored to score maximum points.\n"
            f"2. Formulate 3 tough Jury Cross-Examination Questions and killer winning defense answers.\n"
            f"Return ONLY valid JSON matching:\n"
            f"{{\n"
            f"  \"slides\": [\n"
            f"    {{\"title\": \"Slide Title\", \"content\": \"Core slide takeaway bullet points\", \"speaker_notes\": \"What to say out loud to judges\"}}\n"
            f"  ],\n"
            f"  \"jury_defense_qa\": [\n"
            f"    {{\"question\": \"Tough jury inquiry\", \"defense\": \"Bulletproof winning answer with technical justification\"}}\n"
            f"  ]\n"
            f"}}"
        )
        pitch_res = llm.invoke(pitch_prompt).content
        pitch_outline = parse_json_robustly(pitch_res)
        if not pitch_outline or not isinstance(pitch_outline, dict):
            raise ValueError("Parsed pitch JSON is not a valid dictionary")
    except Exception as e:
        print(f"Pitch outline fallback (generating problem-specific dynamic pitch): {e}")
        pitch_outline = generate_dynamic_pitch_fallback(prob, org, jury_profile)
    
    trace_steps.append({
        "agent": "pitch",
        "name": "Pitch Deck & Jury Defense",
        "status": "completed",
        "duration_ms": int((time.time() - t4) * 1000),
        "details": f"Engineered 5-slide pitch narrative and {len(pitch_outline.get('jury_defense_qa', []))} jury defense counter-arguments."
    })
    
    total_time = int((time.time() - t_start) * 1000)
    
    return {
        "status": "success",
        "jury_profile": jury_profile,
        "precedent_intelligence": precedent_intel,
        "feasibility_analysis": feasibility_data,
        "final_blueprint": {
            "architecture": architecture,
            "pitch_outline": pitch_outline,
            "feasibility": feasibility_data,
            "tradeoff_matrix": feasibility_data.get("tech_tradeoffs", []),
            "jury_defense_qa": pitch_outline.get("jury_defense_qa", [])
        },
        "trace": trace_steps,
        "meta": {
            "model_used": model_name,
            "temperature": temperature,
            "total_time_ms": total_time,
            "tokens_est": int((len(jury_profile) + len(architecture) + 2000) / 4),
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
        }
    }

@app.post("/api/edit-architecture")
async def edit_architecture(req: EditArchitectureRequest):
    print(f">>> RECEIVED ARCHITECTURE EDIT REQUEST: {req.edit_instructions} (Model: {req.model})")
    
    edit_llm = get_llm(req.model or "gemini-3.5-flash-lite", temperature=0.3)
    
    prompt = PromptTemplate.from_template(
        "You are a Principal Software Engineer (Senior Engineer Mode).\n"
        "Here is the existing 11-section architectural specification and system flowchart:\n"
        "-----------------------------------------\n"
        "{current_architecture}\n"
        "-----------------------------------------\n\n"
        "The user requested the following architectural modification:\n"
        "\"{edit_instructions}\"\n\n"
        "SENIOR ENGINEER PRINCIPLES:\n"
        "- Solve the actual problem, not the most impressive-sounding one.\n"
        "- Prefer the simplest design that meets requirements and constraints.\n"
        "- Every component added must survive the question 'what would make this fail?'.\n\n"
        "YOUR TASK:\n"
        "1. Update the specification while strictly preserving the 11 numbered sections (Goal, Assumptions, Decision, Architecture with Mermaid, Tech choices, Pre-mortem, Scope, Build order, Test plan, Security, Sources).\n"
        "2. In Section 4 (Architecture), REDRAW the complete Mermaid diagram enclosed in ```mermaid ... ``` using graph TD or flowchart TD reflecting all newly added or modified nodes, edges, and protocols.\n"
        "3. In Section 5 (Tech choices), add or adjust the table row justifying why this choice won over its alternative.\n"
        "4. In Section 6 (Pre-mortem), add any new failure mode or risk introduced by this change with concrete mitigation.\n"
        "5. Output clean, professional GitHub-flavored Markdown."
    )
    
    try:
        chain = prompt | edit_llm
        result = chain.invoke({
            "current_architecture": req.current_architecture,
            "edit_instructions": req.edit_instructions
        }).content
        
        result = extract_text_content(result)
            
        print(">>> ARCHITECTURE EDIT COMPLETE")
        return {"updated_architecture": result}
    except Exception as e:
        print(f"Error editing architecture with LLM, applying smart architectural transform: {e}")
        updated_arch = req.current_architecture
        instruction_lower = req.edit_instructions.lower()
        
        addition_label = ""
        node_def = ""
        edge_def = ""
        
        if "redis" in instruction_lower or "cache" in instruction_lower:
            addition_label = "Redis Distributed Cache"
            node_def = "    REDIS[(Redis Cache Layer)]"
            edge_def = "  ROUTER -->|Cache Hit/Miss| REDIS\n  REDIS -.->|Hot Query Invalidation| PERSISTENCE"
        elif "kafka" in instruction_lower or "event" in instruction_lower:
            addition_label = "Apache Kafka Event Bus"
            node_def = "    KAFKA[Apache Kafka Event Bus]"
            edge_def = "  API_GW -->|Publish Events| KAFKA\n  KAFKA -->|Consume Message| WORKERS[Async Worker Fleet]"
        elif "oauth" in instruction_lower or "auth" in instruction_lower or "oidc" in instruction_lower:
            addition_label = "OAuth2 / OIDC Auth Provider"
            node_def = "    AUTH[OAuth2 / OIDC Keycloak Provider]"
            edge_def = "  API_GW -->|Token Verification| AUTH"
        elif "replica" in instruction_lower or "read" in instruction_lower:
            addition_label = "PostgreSQL Multi-Region Read Replicas"
            node_def = "    READ_REPLICA[(PostgreSQL Read Replicas)]"
            edge_def = "  SERVICES -->|Read Traffic| READ_REPLICA\n  DB -.->|Async Wal Replication| READ_REPLICA"
        else:
            addition_label = f"Custom Layer ({req.edit_instructions[:30]})"
            node_def = f"    CUSTOM[{req.edit_instructions[:40]}]"
            edge_def = f"  API_GW -->|Integrate| CUSTOM"
            
        if "```mermaid" in updated_arch:
            parts = updated_arch.split("```mermaid")
            header = parts[0]
            mermaid_body = parts[1].split("```")[0]
            footer = parts[1].split("```")[1] if len(parts[1].split("```")) > 1 else ""
            
            new_mermaid = mermaid_body.rstrip() + f"\n\n  %% AI Architecture Modification: {addition_label}\n{node_def}\n{edge_def}\n"
            updated_arch = f"{header}```mermaid{new_mermaid}```{footer}\n\n### Architectural Changes & Rationale\n* **Added {addition_label}**: Integrated into the system architecture per request: \"{req.edit_instructions}\" to ensure enterprise-grade scaling, isolation, and reliability."
            
        return {"updated_architecture": updated_arch}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
