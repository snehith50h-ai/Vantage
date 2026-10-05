from graph import hackathon_graph
from db import init_db
import sys

# Force utf-8 encoding for Windows console to handle emojis/special chars
sys.stdout.reconfigure(encoding='utf-8')

def test_graph():
    # Initialize DB (needed for scraper and profiler nodes)
    init_db()
    
    print("Testing LangGraph execution flow...")
    initial_state = {
        "organizer_name": "Smart India Hackathon",
        "problem_statement": "Develop a decentralized system for tracking medical supply chains to prevent counterfeit drugs.",
        "scraped_history": [],
        "jury_profile": "",
        "final_blueprint": {}
    }
    
    # Invoke the graph
    final_state = hackathon_graph.invoke(initial_state)
    
    print("\n--- Execution Complete ---")
    print("Jury Profile:")
    print(final_state.get("jury_profile"))
    
    print("\nTechnical Blueprint:")
    print(final_state.get("final_blueprint").get("architecture", "Not generated"))
    
    print("\nPitch Deck:")
    print(final_state.get("final_blueprint").get("pitch_outline", "Not generated"))

if __name__ == "__main__":
    test_graph()
