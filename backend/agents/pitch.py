from state import HackathonState
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate
import os
import json
from dotenv import load_dotenv

load_dotenv()

llm = ChatGoogleGenerativeAI(model="gemini-3.5-flash-lite", google_api_key=os.getenv("GEMINI_API_KEY"))

def pitch_node(state: HackathonState) -> dict:
    print(">>> ENTERING PITCH NODE")
    problem = state.get('problem_statement', '')
    profile = state.get('jury_profile', '')
    print("Pitch node starting LLM call...")
    
    prompt = PromptTemplate.from_template(
        "You are an expert startup pitch designer.\n"
        "Problem Statement: {problem}\n"
        "Jury Profile: {profile}\n\n"
        "Design a JSON outline for a slide deck. The JSON should have a 'slides' array with 'title' and 'content' for each slide. "
        "Ensure it appeals to the jury profile.\n"
        "Return ONLY the JSON."
    )
    
    try:
        chain = prompt | llm
        response = chain.invoke({"problem": problem, "profile": profile}).content
    except Exception as e:
        print(f"LLM Error in pitch: {e}")
        response = json.dumps({"slides": [
            {"title": "The Problem", "content": problem},
            {"title": "Our Solution", "content": "An AI-powered intelligence platform."},
            {"title": "Key Features", "content": "Smart routing, predictive analytics, and seamless accessibility."},
            {"title": "Why Us?", "content": "Highly aligned with the jury's focus on scalability and social impact."}
        ]})

    if isinstance(response, list):
        response = response[0] if isinstance(response[0], str) else response[0].get("text", "")
    if not isinstance(response, str):
        response = str(response)
        
    # Strip markdown if present
    response = response.strip()
    if response.startswith("```json"):
        response = response[7:-3].strip()
    elif response.startswith("```"):
        response = response[3:-3].strip()
    
    try:
        pitch_outline = json.loads(response)
    except:
        pitch_outline = {"slides": [{"title": "Error", "content": "Could not parse pitch JSON."}]}
    
    final_bp = state.get("final_blueprint", {})
    if not final_bp:
        final_bp = {}
    final_bp["pitch_outline"] = pitch_outline
    
    return {"final_blueprint": final_bp}
