"use client";

import React, { useState } from "react";
import LenisProvider from "@/components/LenisProvider";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Hammer, Zap, GitCommit, CheckSquare, Server, Link2, AlertCircle } from "lucide-react";

interface Task {
  title: string;
  complexity: string;
  dependencies: string[];
  acceptance_criteria: string;
}

interface Epic {
  name: string;
  objective: string;
  tasks: Task[];
}

interface ExecutionResponse {
  epics: Epic[];
  critical_path_warning: string;
}

export default function ExecutionEnginePage() {
  const [coreWorkflow, setCoreWorkflow] = useState("Users upload a PDF resume, the backend parses text, sends it to an LLM for ranking against a hardcoded Job Description, and displays the top 5 candidates in a Next.js dashboard.");
  const [techStack, setTechStack] = useState("Next.js, Tailwind CSS, FastAPI, PostgreSQL, Gemini API");
  const [teamStrengths, setTeamStrengths] = useState("Frontend, AI Integration");
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ExecutionResponse | null>(null);
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch("http://localhost:8000/api/project/execution", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          core_workflow: coreWorkflow,
          tech_stack: techStack,
          team_strengths: teamStrengths.split(",").map((s) => s.trim())
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate execution plan");
      }

      const data = await response.json();
      setResult(data);
    } catch (err: unknown) {
      console.error(err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity.toLowerCase()) {
      case "low": return "text-emerald-400 bg-emerald-400/10 border-emerald-400/20";
      case "medium": return "text-blue-400 bg-blue-400/10 border-blue-400/20";
      case "high": return "text-amber-400 bg-amber-400/10 border-amber-400/20";
      case "critical": return "text-red-400 bg-red-400/10 border-red-400/20";
      default: return "text-gray-400 bg-gray-400/10 border-gray-400/20";
    }
  };

  return (
    <LenisProvider>
      <main className="flex flex-col min-h-screen bg-[#0B0B10] text-white selection:bg-accent-magenta/30 font-sans">
        <Navbar />
        
        <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-24 md:py-32 flex flex-col xl:flex-row gap-8">
          
          {/* Left Column: Input Form */}
          <div className="w-full xl:w-[350px] shrink-0 flex flex-col gap-6">
            <div className="bg-[#12121A]/80 border border-white/10 rounded-2xl p-6 shadow-xl backdrop-blur-md sticky top-24">
              <div className="flex items-center gap-2 mb-6 text-blue-400">
                <Hammer className="w-5 h-5" />
                <h1 className="text-xl font-bold font-mono tracking-tight uppercase">Execution Engine</h1>
              </div>
              <p className="text-xs text-muted-on-dark mb-6 leading-relaxed">
                Transform architecture and scope into Epics, Tasks, and Acceptance Criteria.
              </p>

              <div className="flex flex-col gap-5">
                <div>
                  <label className="text-xs font-mono text-muted-on-dark mb-1.5 block">Core Workflow</label>
                  <textarea
                    value={coreWorkflow}
                    onChange={(e) => setCoreWorkflow(e.target.value)}
                    className="w-full h-24 bg-[#0A0A10] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-400 transition-colors resize-none leading-relaxed"
                  />
                </div>

                <div>
                  <label className="text-xs font-mono text-muted-on-dark mb-1.5 block">Tech Stack</label>
                  <input
                    type="text"
                    value={techStack}
                    onChange={(e) => setTechStack(e.target.value)}
                    className="w-full bg-[#0A0A10] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-400 transition-colors"
                  />
                </div>

                <div>
                  <label className="text-xs font-mono text-muted-on-dark mb-1.5 block">Team Strengths (comma separated)</label>
                  <input
                    type="text"
                    value={teamStrengths}
                    onChange={(e) => setTeamStrengths(e.target.value)}
                    className="w-full bg-[#0A0A10] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-400 transition-colors"
                  />
                </div>

                <button
                  onClick={handleGenerate}
                  disabled={loading || !coreWorkflow.trim()}
                  className="mt-2 w-full bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-50 font-mono font-bold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                >
                  {loading ? (
                    <Zap className="w-5 h-5 animate-pulse" />
                  ) : (
                    <Server className="w-5 h-5" />
                  )}
                  {loading ? "Generating Plan..." : "Generate Execution Plan"}
                </button>
                
                {error && (
                  <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs font-mono mt-2">
                    {error}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Execution Output */}
          <div className="w-full flex-1 flex flex-col gap-6">
            {!result && !loading && (
              <div className="h-full min-h-[400px] border border-white/5 rounded-2xl flex flex-col items-center justify-center text-center p-8 bg-[#12121A]/30">
                <GitCommit className="w-12 h-12 text-white/20 mb-4" />
                <h3 className="text-lg font-bold text-white mb-2 font-mono">No Execution Plan Generated</h3>
                <p className="text-sm text-muted-on-dark max-w-md">
                  Enter your core workflow and tech stack. Forge will break it down into actionable Epics and Tasks for your team to build immediately.
                </p>
              </div>
            )}

            {loading && (
              <div className="h-full min-h-[400px] border border-white/5 rounded-2xl flex flex-col items-center justify-center text-center p-8 bg-[#12121A]/30">
                <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-4" />
                <p className="text-sm text-blue-400 font-mono animate-pulse">Compiling Epics and Acceptance Criteria...</p>
              </div>
            )}

            {result && !loading && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col gap-6">
                
                {/* Critical Path Warning */}
                <div className="bg-gradient-to-r from-red-500/10 to-amber-500/10 border border-red-500/20 rounded-2xl p-6 shadow-xl backdrop-blur-md relative overflow-hidden flex items-start gap-4">
                  <AlertCircle className="w-6 h-6 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-red-400 mb-1">Critical Path Warning</h3>
                    <p className="text-sm text-white/90 leading-relaxed font-medium">
                      {result.critical_path_warning}
                    </p>
                  </div>
                </div>

                {/* Epics List */}
                <div className="flex flex-col gap-8">
                  {result.epics.map((epic, eIdx) => (
                    <div key={eIdx} className="bg-[#12121A]/80 border border-white/10 rounded-2xl p-6 shadow-xl backdrop-blur-md flex flex-col gap-4">
                      
                      {/* Epic Header */}
                      <div className="border-b border-white/10 pb-4">
                        <div className="flex items-center gap-2 mb-2 text-white">
                          <span className="text-blue-400 font-mono text-sm font-bold bg-blue-400/10 px-2 py-0.5 rounded">EPIC {eIdx + 1}</span>
                          <h2 className="text-lg font-bold">{epic.name}</h2>
                        </div>
                        <p className="text-sm text-muted-on-dark">{epic.objective}</p>
                      </div>

                      {/* Task List */}
                      <div className="flex flex-col gap-3">
                        {epic.tasks.map((task, tIdx) => (
                          <div key={tIdx} className="bg-[#0A0A10] border border-white/5 rounded-xl p-4 flex flex-col sm:flex-row gap-4 relative group hover:border-blue-500/30 transition-colors">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <GitCommit className="w-4 h-4 text-white/40" />
                                <h4 className="font-bold text-white text-sm">{task.title}</h4>
                                <span className={`ml-auto sm:ml-2 text-[10px] font-mono px-2 py-0.5 rounded border uppercase ${getComplexityColor(task.complexity)}`}>
                                  {task.complexity}
                                </span>
                              </div>
                              
                              <div className="ml-6 flex flex-col gap-2">
                                {task.dependencies.length > 0 && (
                                  <div className="flex items-start gap-1.5 text-xs text-white/50">
                                    <Link2 className="w-3.5 h-3.5 mt-0.5 text-amber-500/70 shrink-0" />
                                    <span>
                                      <strong className="text-white/40 uppercase font-mono text-[10px]">Blocks on: </strong>
                                      {task.dependencies.join(", ")}
                                    </span>
                                  </div>
                                )}
                                <div className="flex items-start gap-1.5 text-xs text-emerald-400/80 bg-emerald-400/5 p-2 rounded-lg border border-emerald-400/10">
                                  <CheckSquare className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                                  <span>{task.acceptance_criteria}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                    </div>
                  ))}
                </div>

              </div>
            )}
          </div>
        </div>
        
        <Footer />
      </main>
    </LenisProvider>
  );
}
