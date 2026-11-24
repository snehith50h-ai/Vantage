"""Graph compatibility bridge.

Re-exports heterogeneous_graph as hackathon_graph for backward compatibility.
"""

from app.graph.workflow import heterogeneous_graph, build_heterogeneous_graph

hackathon_graph = heterogeneous_graph
build_graph = build_heterogeneous_graph

__all__ = ["hackathon_graph", "build_graph", "heterogeneous_graph", "build_heterogeneous_graph"]
