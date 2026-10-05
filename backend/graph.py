from langgraph.graph import StateGraph, START, END
from state import HackathonState
from agents.scraper import scraper_node
from agents.profiler import profiler_node
from agents.feasibility import feasibility_node
from agents.blueprint import blueprint_node
from agents.pitch import pitch_node

def build_graph():
    builder = StateGraph(HackathonState)
    
    builder.add_node("scraper", scraper_node)
    builder.add_node("profiler", profiler_node)
    builder.add_node("feasibility", feasibility_node)
    builder.add_node("blueprint", blueprint_node)
    builder.add_node("pitch", pitch_node)
    
    builder.add_edge(START, "scraper")
    builder.add_edge("scraper", "profiler")
    builder.add_edge("profiler", "feasibility")
    
    # Run blueprint and pitch in parallel from feasibility
    builder.add_edge("feasibility", "blueprint")
    builder.add_edge("feasibility", "pitch")
    
    builder.add_edge("blueprint", END)
    builder.add_edge("pitch", END)
    
    return builder.compile()

hackathon_graph = build_graph()
