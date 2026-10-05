import json
import os
from langchain_google_genai import ChatGoogleGenerativeAI
from state import HackathonState

def devils_advocate_node(state: HackathonState) -> dict:
    print(">>> ENTERING DEVIL'S ADVOCATE NODE")
    
    problem = state.get("problem_statement", "")
    blueprint = state.get("final_blueprint", {})
    architecture = state.get("architecture_diagrams", "")
    jury_profile = state.get("jury_profile", "General Technical Jury")
    
    try:
        llm = ChatGoogleGenerativeAI(
            model="gemini-3.5-flash-lite",
            google_api_key=os.getenv("GEMINI_API_KEY"),
            temperature=0.7
        )
        
        prompt = (
            f"You are the Devil's Advocate for a hackathon team.\n"
            f"Problem: {problem}\n"
            f"Proposed Blueprint: {json.dumps(blueprint)}\n"
            f"Architecture: {architecture}\n"
            f"Jury Profile: {jury_profile}\n\n"
            f"Your job is to poke holes in this idea, identify single points of failure in the architecture, "
            f"and list the 3 hardest questions the jury will ask.\n"
            f"Return ONLY valid JSON:\n"
            f"{{\n"
            f"  \"critical_flaws\": [\"flaw 1\", \"flaw 2\"],\n"
            f"  \"unproven_assumptions\": [\"assumption 1\"],\n"
            f"  \"jury_hard_questions\": [\"Q1\", \"Q2\", \"Q3\"]\n"
            f"}}\n"
        )
        
        res = llm.invoke(prompt).content
        if isinstance(res, list):
            res = res[0] if isinstance(res[0], str) else res[0].get("text", "")
        res = str(res).strip()
        
        if res.startswith("```json"):
            res = res[7:-3].strip()
        elif res.startswith("```"):
            res = res[3:-3].strip()
            
        risk_assessment = json.loads(res)
    except Exception as e:
        print(f"Devil's Advocate error: {e}")
        risk_assessment = {
            "critical_flaws": ["Could not assess due to API error"],
            "unproven_assumptions": [],
            "jury_hard_questions": ["What is your fallback plan?"]
        }
        
    return {"risk_assessment": risk_assessment}
