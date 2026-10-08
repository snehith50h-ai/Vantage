from langgraph.graph import StateGraph, START, END
from state import HackathonState
from agents.scraper import scraper_node
from agents.github_scraper import github_scraper_node
from agents.profiler import profiler_node
from agents.feasibility import feasibility_node
from agents.blueprint import blueprint_node
from agents.devils_advocate import devils_advocate_node
from agents.pitch import pitch_node
from agents.scrum_master import scrum_master_node
from agents.ux_visionary import ux_visionary_node
from agents.business import business_node

def build_graph():
    builder = StateGraph(HackathonState)
    
    # Add all nodes
    builder.add_node("scraper", scraper_node)
    builder.add_node("github_scraper", github_scraper_node)
    builder.add_node("profiler", profiler_node)
    builder.add_node("feasibility", feasibility_node)
    builder.add_node("blueprint", blueprint_node)
    builder.add_node("devils_advocate", devils_advocate_node)
    builder.add_node("pitch", pitch_node)
    builder.add_node("scrum_master", scrum_master_node)
    builder.add_node("ux_visionary", ux_visionary_node)
    builder.add_node("business", business_node)
    
    # Define edges (The Workflow)
    builder.add_edge(START, "scraper")
    builder.add_edge("scraper", "github_scraper")
    builder.add_edge("github_scraper", "profiler")
    builder.add_edge("profiler", "feasibility")
    builder.add_edge("feasibility", "blueprint")
    
    # Run the risk evaluation (devil's advocate) and polish agents in parallel from blueprint
    builder.add_edge("blueprint", "devils_advocate")
    builder.add_edge("blueprint", "pitch")
    builder.add_edge("blueprint", "scrum_master")
    builder.add_edge("blueprint", "ux_visionary")
    builder.add_edge("blueprint", "business")
    
    # All parallel branches end
    builder.add_edge("devils_advocate", END)
    builder.add_edge("pitch", END)
    builder.add_edge("scrum_master", END)
    builder.add_edge("ux_visionary", END)
    builder.add_edge("business", END)
    
    return builder.compile()

hackathon_graph = build_graph()
