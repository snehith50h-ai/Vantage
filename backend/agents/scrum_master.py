import json
import os
from langchain_google_genai import ChatGoogleGenerativeAI
from state import HackathonState

def scrum_master_node(state: HackathonState) -> dict:
    print(">>> ENTERING SCRUM MASTER NODE")
    
    blueprint = state.get("final_blueprint", {})
    scope_cut = state.get("scope_cut_analysis", {})
    
    try:
        llm = ChatGoogleGenerativeAI(
            model="gemini-3.5-flash-lite",
            google_api_key=os.getenv("GEMINI_API_KEY"),
            temperature=0.3
        )
        
        prompt = (
            f"You are the Scrum Master for a 24-hour hackathon.\n"
            f"Blueprint: {json.dumps(blueprint)}\n"
            f"Scope Cuts (Do NOT build these): {json.dumps(scope_cut)}\n\n"
            f"Create a strict execution timeline for the 24 hours, parallelizing frontend and backend tasks.\n"
            f"Return ONLY valid JSON:\n"
            f"{{\n"
            f"  \"timeline\": [\n"
            f"    {{\"hour\": \"0-4\", \"frontend_task\": \"Setup & Auth UI\", \"backend_task\": \"DB Schema & Auth API\"}}\n"
            f"  ],\n"
            f"  \"critical_path\": [\"must finish DB by hour 4\"]\n"
            f"}}\n"
        )
        
        res = llm.invoke(prompt).content
        if res.startswith("```json"):
            res = res[7:-3].strip()
        elif res.startswith("```"):
            res = res[3:-3].strip()
            
        execution_timeline = json.loads(res)
    except Exception as e:
        print(f"Scrum Master error: {e}")
        execution_timeline = {
            "timeline": [{"hour": "0-24", "frontend_task": "Build MVP", "backend_task": "Build MVP"}],
            "critical_path": ["Finish before deadline"]
        }
        
    return {"execution_timeline": execution_timeline}
