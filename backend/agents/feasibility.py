import os
import json
from state import HackathonState
from langchain_google_genai import ChatGoogleGenerativeAI
from dotenv import load_dotenv
from utils import parse_json_robustly, generate_dynamic_feasibility_fallback

load_dotenv()

def get_llm():
    return ChatGoogleGenerativeAI(
        model="gemini-3.5-flash-lite",
        google_api_key=os.getenv("GEMINI_API_KEY"),
        temperature=0.3
    )

def feasibility_node(state: HackathonState) -> dict:
    print(">>> ENTERING FEASIBILITY & TRADE-OFF MATRIX NODE")
    organizer = state.get("organizer_name", "Hackathon Organizer")
    problem = state.get("problem_statement", "")
    jury_profile = state.get("jury_profile", "")
    precedents = state.get("precedent_intelligence", {})
    
    prompt = (
        f"You are an Elite Hackathon Feasibility Analyst and Technology Strategist.\n"
        f"Organizer: {organizer}\n"
        f"Problem Statement: {problem}\n"
        f"Jury Profile & Biases: {jury_profile[:400]}\n"
        f"Past Edition Insights: {precedents.get('past_editions_analyzed', '')[:300]}\n\n"
        f"TASK:\n"
        f"1. Conduct a rigorous Feasibility & Viability Assessment for this problem in a high-stakes hackathon (24-36 hour sprint).\n"
        f"2. Build the 'Why THIS vs Why NOT THAT' Feature Selection Matrix:\n"
        f"   - Features to INCLUDE (high demo impact, feasible in 24h, high rubric score)\n"
        f"   - Features to CUT / DEFER (vanity features, high risk of demo failure, excessive API dependencies)\n"
        f"3. Build the Comparative Tech Stack Trade-off Matrix (Why chosen technology X over alternative Y).\n\n"
        f"Return ONLY valid JSON matching this schema:\n"
        f"```json\n"
        f"{{\n"
        f"  \"technical_feasibility\": {{\n"
        f"    \"score\": 92,\n"
        f"    \"summary\": \"Detailed explanation of technical feasibility for hackathon build\",\n"
        f"    \"key_enablers\": [\"Enabler 1\", \"Enabler 2\"]\n"
        f"  }},\n"
        f"  \"economic_viability\": {{\n"
        f"    \"score\": 89,\n"
        f"    \"summary\": \"Deployment and cost viability in real-world conditions\",\n"
        f"    \"unit_cost_estimate\": \"e.g. Under ₹12,000 per sensor node\"\n"
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
        f"      \"risk_avoided\": \"Specific risk averted (e.g. latency, external API quota, complexity)\"\n"
        f"    }}\n"
        f"  ],\n"
        f"  \"tech_tradeoffs\": [\n"
        f"    {{\n"
        f"      \"layer\": \"Layer / Subsystem (e.g. Frontend, Ingestion, Database)\",\n"
        f"      \"chosen\": \"Chosen Technology\",\n"
        f"      \"alternative\": \"Considered Alternative\",\n"
        f"      \"tradeoff_rationale\": \"Why Chosen over Alternative for this specific problem statement\"\n"
        f"    }}\n"
        f"  ]\n"
        f"}}\n"
        f"```"
    )
    
    feasibility_data = {}
    try:
        llm = get_llm()
        res = llm.invoke(prompt).content
        feasibility_data = parse_json_robustly(res)
        if not feasibility_data or not isinstance(feasibility_data, dict):
            raise ValueError("Parsed JSON is not a valid dictionary")
    except Exception as e:
        print(f"Feasibility engine fallback (generating problem-specific dynamic feasibility): {e}")
        feasibility_data = generate_dynamic_feasibility_fallback(problem, organizer)
    
    final_bp = state.get("final_blueprint", {})
    if not final_bp:
        final_bp = {}
    final_bp["feasibility"] = feasibility_data
    final_bp["tradeoff_matrix"] = feasibility_data.get("tech_tradeoffs", [])
    
    return {
        "feasibility_analysis": feasibility_data,
        "final_blueprint": final_bp
    }
