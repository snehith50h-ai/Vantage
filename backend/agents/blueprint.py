from state import HackathonState
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate
import os
from dotenv import load_dotenv

load_dotenv()

llm = ChatGoogleGenerativeAI(model="gemini-3.5-flash-lite", google_api_key=os.getenv("GEMINI_API_KEY"))

def blueprint_node(state: HackathonState) -> dict:
    print(">>> ENTERING BLUEPRINT NODE")
    problem = state.get('problem_statement', '')
    profile = state.get('jury_profile', '')
    print("Blueprint node starting LLM call...")
    
    prompt = PromptTemplate.from_template(
        "You are an expert technical architect.\n"
        "Problem Statement: {problem}\n"
        "Jury Profile: {profile}\n\n"
        "Design a technical architecture blueprint that perfectly aligns with the jury's preferences and solves the problem.\n"
        "CRITICAL REQUIREMENTS FOR YOUR OUTPUT FORMAT:\n"
        "1. Use incredibly clean, well-structured Markdown with proper headings (##, ###).\n"
        "2. Do NOT use ASCII art for the architecture diagram. You MUST use a Mermaid flowchart (graph TD or LR) for the system architecture. Example format:\n"
        "```mermaid\n"
        "graph TD\n"
        "  A[Client] --> B[API Gateway]\n"
        "  B --> C[Database]\n"
        "```\n"
        "Make sure the flowchart diagram is neat, uses arrows, and represents the end-to-end data flow similar to popular Github repos.\n"
        "3. In the Technology Stack section, you MUST provide a comparative analysis for each choice. For example: 'We chose X over Y because...'\n"
        "4. Make the output look highly professional, avoiding clumsy formatting."
    )
    
    try:
        chain = prompt | llm
        architecture = chain.invoke({"problem": problem, "profile": profile}).content
    except Exception as e:
        print(f"LLM Error in blueprint: {e}")
        architecture = "### Technical Architecture (Mock)\n\n* **Frontend**: Next.js, Tailwind CSS\n* **Backend**: FastAPI, PostgreSQL\n* **AI**: LangChain & Gemini API\n\n*(Note: This is a fallback response as the API is currently unavailable)*"

    if isinstance(architecture, list):
        architecture = architecture[0] if isinstance(architecture[0], str) else architecture[0].get("text", "")
    if not isinstance(architecture, str):
        architecture = str(architecture)
    
    final_bp = state.get("final_blueprint", {})
    if not final_bp:
        final_bp = {}
    final_bp["architecture"] = architecture
    
    return {"final_blueprint": final_bp}
