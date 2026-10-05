import json
import os
from langchain_google_genai import ChatGoogleGenerativeAI
from state import HackathonState

def ux_visionary_node(state: HackathonState) -> dict:
    print(">>> ENTERING UX VISIONARY NODE")
    
    problem = state.get("problem_statement", "")
    blueprint = state.get("final_blueprint", {})
    
    try:
        llm = ChatGoogleGenerativeAI(
            model="gemini-3.5-flash-lite",
            google_api_key=os.getenv("GEMINI_API_KEY"),
            temperature=0.7
        )
        
        prompt = (
            f"You are the Lead UX/UI Designer for a hackathon.\n"
            f"Problem: {problem}\n"
            f"Blueprint: {json.dumps(blueprint)}\n\n"
            f"Define the design system and user flow to maximize the 'wow' factor.\n"
            f"Return ONLY valid JSON:\n"
            f"{{\n"
            f"  \"color_palette\": [\"#FFFFFF\", \"#000000\"],\n"
            f"  \"typography\": \"Inter & Roboto Mono\",\n"
            f"  \"user_flow_mermaid\": \"graph TD; A-->B;\",\n"
            f"  \"midjourney_prompts\": [\"A futuristic dashboard...\"]\n"
            f"}}\n"
        )
        
        res = llm.invoke(prompt).content
        if res.startswith("```json"):
            res = res[7:-3].strip()
        elif res.startswith("```"):
            res = res[3:-3].strip()
            
        ux_design_system = json.loads(res)
    except Exception as e:
        print(f"UX Visionary error: {e}")
        ux_design_system = {
            "color_palette": ["#000", "#FFF"],
            "typography": "Sans-Serif",
            "user_flow_mermaid": "graph TD; Home-->Dashboard;",
            "midjourney_prompts": []
        }
        
    return {"ux_design_system": ux_design_system}
