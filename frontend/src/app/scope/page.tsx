"use client";

import React, { useState } from "react";
import LenisProvider from "@/components/LenisProvider";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Scissors, Zap, AlertTriangle, Crosshair, Sparkles, CheckCircle2, Clock, Ban } from "lucide-react";
import { apiFetch } from "@/lib/api";

interface ProjectContract {
  core_workflow: string;
  differentiation: string;
  demo_plan: string;
}

interface ScopeItem {
  feature: string;
  category: "MUST SHIP" | "NICE TO HAVE" | "FUTURE" | "REMOVE";
  rationale: string;
}

interface ScopeResponse {
  project_contract: ProjectContract;
  scope: ScopeItem[];
}

export default function ScopeAssassinPage() {
  const [projectIdea, setProjectIdea] = useState("AI-powered resume screener that reads PDF resumes and automatically ranks them for recruiters based on a job description.");
  const [timeLimit, setTimeLimit] = useState(36);
  const [hackathonContext, setHackathonContext] = useState("TechCrunch Disrupt Hackathon - 36 Hours. High focus on working product and clear business model.");
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScopeResponse | null>(null);
  const [error, setError] = useState("");

  const handleAssassinate = async () => {
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await apiFetch("/api/project/scope", {
        method: "POST",
        body: JSON.stringify({
          project_idea: projectIdea,
          time_limit_hours: timeLimit,
          hackathon_context: hackathonContext
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate scope contract");
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

  const getCategoryStyles = (category: string) => {
    switch (category) {
      case "MUST SHIP": 
        return { wrapper: "border-emerald-500/30 bg-emerald-500/10", badge: "bg-emerald-500 text-black", icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" /> };
      case "NICE TO HAVE": 
        return { wrapper: "border-blue-500/30 bg-blue-500/10", badge: "bg-blue-500/20 text-blue-400 border border-blue-500/50", icon: <Sparkles className="w-4 h-4 text-blue-400" /> };
      case "FUTURE": 
        return { wrapper: "border-gray-500/30 bg-gray-500/10", badge: "bg-gray-500/20 text-gray-400 border border-gray-500/50", icon: <Clock className="w-4 h-4 text-gray-400" /> };
      case "REMOVE": 
        return { wrapper: "border-red-500/30 bg-red-500/10", badge: "bg-red-500 text-white font-bold", icon: <Ban className="w-4 h-4 text-red-400" /> };
      default: 
        return { wrapper: "border-white/10 bg-white/5", badge: "bg-white/10 text-white", icon: <AlertTriangle className="w-4 h-4 text-white" /> };
    }
  };

  return (
    <LenisProvider>
      <main className="flex flex-col min-h-screen bg-[#0B0B10] text-white selection:bg-accent-magenta/30 font-sans">
        <Navbar />
        
        <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-24 md:py-32 flex flex-col lg:flex-row gap-8">
          
          {/* Left Column: Input Form */}
          <div className="w-full lg:w-1/3 flex flex-col gap-6">
            <div className="bg-[#12121A]/80 border border-white/10 rounded-2xl p-6 shadow-xl backdrop-blur-md sticky top-24">
              <div className="flex items-center gap-2 mb-6 text-red-400">
                <Scissors className="w-5 h-5" />
                <h1 className="text-xl font-bold font-mono tracking-tight uppercase">Scope Assassin</h1>
              </div>
              <p className="text-xs text-muted-on-dark mb-6 leading-relaxed">
                A team with 15 half-working features is worse positioned than a team with one exceptional end-to-end flow. Ruthlessly cut scope.
              </p>

              <div className="flex flex-col gap-5">
                <div>
                  <label className="text-xs font-mono text-muted-on-dark mb-1.5 block">Hackathon Context</label>
                  <input
                    type="text"
                    value={hackathonContext}
                    onChange={(e) => setHackathonContext(e.target.value)}
                    className="w-full bg-[#0A0A10] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-red-400 transition-colors"
                  />
                </div>

                <div>
                  <label className="text-xs font-mono text-muted-on-dark mb-1.5 block flex justify-between">
                    <span>Time Limit (Hours)</span>
                    <span className="text-red-400 font-bold">{timeLimit}h</span>
                  </label>
                  <input
                    type="range"
                    min="12"
                    max="72"
                    step="12"
                    value={timeLimit}
                    onChange={(e) => setTimeLimit(Number(e.target.value))}
                    className="w-full accent-red-400"
                  />
                </div>

                <div>
                  <label className="text-xs font-mono text-muted-on-dark mb-1.5 block">Proposed Project Idea</label>
                  <textarea
                    value={projectIdea}
                    onChange={(e) => setProjectIdea(e.target.value)}
                    className="w-full h-32 bg-[#0A0A10] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-red-400 transition-colors resize-none leading-relaxed"
                  />
                </div>

                <button
                  onClick={handleAssassinate}
                  disabled={loading || !projectIdea.trim()}
                  className="mt-2 w-full bg-red-500 hover:bg-red-600 text-white disabled:opacity-50 font-mono font-bold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(239,68,68,0.3)]"
                >
                  {loading ? (
                    <Zap className="w-5 h-5 animate-pulse" />
                  ) : (
                    <Scissors className="w-5 h-5" />
                  )}
                  {loading ? "Assassinating Scope..." : "Execute Scope Cut"}
                </button>
                
                {error && (
                  <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs font-mono mt-2">
                    {error}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Output Contract & Matrix */}
          <div className="w-full lg:w-2/3 flex flex-col gap-6">
            {!result && !loading && (
              <div className="h-full min-h-[400px] border border-white/5 rounded-2xl flex flex-col items-center justify-center text-center p-8 bg-[#12121A]/30">
                <Crosshair className="w-12 h-12 text-white/20 mb-4" />
                <h3 className="text-lg font-bold text-white mb-2 font-mono">Scope Matrix Empty</h3>
                <p className="text-sm text-muted-on-dark max-w-md">
                  Submit your ambitious project idea. We will generate the Project Contract and brutally eliminate vanity features that will waste your execution time.
                </p>
              </div>
            )}

            {loading && (
              <div className="h-full min-h-[400px] border border-white/5 rounded-2xl flex flex-col items-center justify-center text-center p-8 bg-[#12121A]/30">
                <div className="w-10 h-10 border-4 border-red-500/30 border-t-red-500 rounded-full animate-spin mb-4" />
                <p className="text-sm text-red-400 font-mono animate-pulse">Cutting scope and finalizing contract...</p>
              </div>
            )}

            {result && !loading && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col gap-6">
                
                {/* Project Contract */}
                <div className="bg-[#12121A]/80 border border-white/10 rounded-2xl p-6 shadow-xl backdrop-blur-md">
                  <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-white mb-6 flex items-center gap-2">
                    <Crosshair className="w-4 h-4 text-emerald-400" />
                    The Project Contract
                  </h2>
                  
                  <div className="flex flex-col gap-5">
                    <div className="border-l-2 border-emerald-400 pl-4">
                      <h4 className="text-[10px] font-mono text-muted-on-dark uppercase mb-1">Core Workflow (The Golden Path)</h4>
                      <p className="text-sm text-white/90 leading-relaxed">{result.project_contract.core_workflow}</p>
                    </div>
                    
                    <div className="border-l-2 border-accent-magenta pl-4">
                      <h4 className="text-[10px] font-mono text-muted-on-dark uppercase mb-1">Differentiation (Why You Win)</h4>
                      <p className="text-sm text-white/90 leading-relaxed">{result.project_contract.differentiation}</p>
                    </div>

                    <div className="border-l-2 border-accent-pink pl-4 bg-accent-pink/5 -ml-4 pl-8 py-3 rounded-r-xl">
                      <h4 className="text-[10px] font-mono text-accent-pink uppercase mb-1">Minute 1:00 Demo Plan</h4>
                      <p className="text-sm text-white font-medium leading-relaxed">{result.project_contract.demo_plan}</p>
                    </div>
                  </div>
                </div>

                {/* Scope Matrix */}
                <div className="bg-[#12121A]/80 border border-white/10 rounded-2xl p-6 shadow-xl backdrop-blur-md">
                  <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-white mb-6 flex items-center gap-2">
                    <Scissors className="w-4 h-4 text-red-400" />
                    Scope Assassin Matrix
                  </h3>
                  
                  <div className="flex flex-col gap-3">
                    {result.scope.map((item, idx) => {
                      const styles = getCategoryStyles(item.category);
                      return (
                        <div key={idx} className={`border rounded-xl p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center ${styles.wrapper}`}>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              {styles.icon}
                              <h4 className="font-bold text-white text-sm">{item.feature}</h4>
                            </div>
                            <p className="text-xs text-white/70 leading-relaxed mt-2 sm:mt-0">
                              <span className="opacity-50 font-mono uppercase text-[10px] mr-2">Rationale:</span>
                              {item.rationale}
                            </p>
                          </div>
                          <div className={`px-3 py-1 rounded text-[10px] font-mono uppercase shrink-0 ${styles.badge}`}>
                            {item.category}
                          </div>
                        </div>
                      );
                    })}
                  </div>
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
