from state import HackathonState
from db import get_db_connection
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from langchain_core.prompts import PromptTemplate
import os
from dotenv import load_dotenv

load_dotenv()

llm = ChatGoogleGenerativeAI(model="gemini-3.5-flash-lite", google_api_key=os.getenv("GEMINI_API_KEY"))
embeddings = GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-2", google_api_key=os.getenv("GEMINI_API_KEY"))

def profiler_node(state: HackathonState) -> dict:
    print(">>> ENTERING PROFILER NODE")
    organizer = state.get('organizer_name', 'Unknown')
    problem = state.get('problem_statement', '')
    print(f"Profiling organizer: {organizer} for problem: {problem}")
    
    context = "No specific past projects found."
    try:
        problem_embedding = embeddings.embed_query(problem)
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("""
            SELECT project_name, description 
            FROM projects 
            WHERE organizer = %s 
            ORDER BY embedding <-> %s::vector 
            LIMIT 5
        """, (organizer, problem_embedding))
        
        results = cur.fetchall()
        cur.close()
        conn.close()
        if results:
            context = "\n".join([f"Project: {r[0]} - Description: {r[1]}" for r in results])
    except Exception as e:
        print(f"DB Error in Profiler: {e}")
    
    prompt = PromptTemplate.from_template(
        "Analyze the following past winning projects for the organizer {organizer}.\n"
        "Projects:\n{context}\n\n"
        "Based on these, generate a jury profile detailing their preferences (e.g., preferred architectures, values like social impact). "
        "Keep it concise but informative."
    )
    
    try:
        chain = prompt | llm
        jury_profile = chain.invoke({"organizer": organizer, "context": context}).content
    except Exception as e:
        print(f"LLM Error in profiler: {e}")
        jury_profile = "**Mock Jury Profile (API Offline)**\n\nThe jury prefers highly scalable, socially impactful solutions with clear value propositions and modern tech stacks."

    if isinstance(jury_profile, list):
        jury_profile = jury_profile[0] if isinstance(jury_profile[0], str) else jury_profile[0].get("text", "")
    if not isinstance(jury_profile, str):
        jury_profile = str(jury_profile)
    
    return {"jury_profile": jury_profile}
