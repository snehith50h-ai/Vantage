import json
import os
from langchain_google_genai import ChatGoogleGenerativeAI
from state import HackathonState

def business_node(state: HackathonState) -> dict:
    print(">>> ENTERING BUSINESS/MONETIZATION NODE")
    
    problem = state.get("problem_statement", "")
    blueprint = state.get("final_blueprint", {})
    
    try:
        llm = ChatGoogleGenerativeAI(
            model="gemini-3.5-flash-lite",
            google_api_key=os.getenv("GEMINI_API_KEY"),
            temperature=0.7
        )
        
        prompt = (
            f"You are the Business/Hustler Agent for a hackathon.\n"
            f"Problem: {problem}\n"
            f"Blueprint: {json.dumps(blueprint)}\n\n"
            f"Judges will ask 'How is this sustainable?' or 'How does it make money?'.\n"
            f"Create a Lean Canvas and GTM strategy.\n"
            f"Return ONLY valid JSON:\n"
            f"{{\n"
            f"  \"revenue_streams\": [\"Subscription\", \"Ads\"],\n"
            f"  \"target_audience\": \"SMBs\",\n"
            f"  \"go_to_market\": \"Cold email campaigns to 100 local businesses\",\n"
            f"  \"tam_sam_som\": \"TAM: $10B, SAM: $1B, SOM: $10M\"\n"
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
            
        business_model = json.loads(res)
    except Exception as e:
        print(f"Business error: {e}")
        business_model = {
            "revenue_streams": [],
            "target_audience": "Unknown",
            "go_to_market": "Launch on ProductHunt",
            "tam_sam_som": "TBD"
        }
        
    return {"business_model": business_model}
