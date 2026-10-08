"use client";

import React, { useState } from "react";
import LenisProvider from "@/components/LenisProvider";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Activity, ShieldAlert, Crosshair, AlertTriangle, Zap, CheckCircle2 } from "lucide-react";
import { apiFetch } from "@/lib/api";

interface HealthScores {
  technical_readiness: number;
  functional_completeness: number;
  rubric_alignment: number;
  differentiation: number;
  demo_readiness: number;
  scope_health: number;
}

interface XRayResponse {
  health_scores: HealthScores;
  overall_risk: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  risk_rationale: string;
  top_three_actions: string[];
}

export default function XRayPage() {
  const [projectContract, setProjectContract] = useState("AI Resume Screener. Core workflow: Upload PDF -> LLM parses & ranks against Job Description -> Display top 5 on a Next.js dashboard. Demo at 1:00 showing the ranking output.");
  const [currentProgress, setCurrentProgress] = useState("We spent 8 hours setting up Next.js Auth.js and a Postgres DB. The PDF upload UI is done, but the actual LLM integration (the core logic) is untouched. The demo currently just shows a login screen.");
  const [rubric, setRubric] = useState("Innovation (30%), Technical Execution (40%), Impact/Business Model (20%), Pitch (10%).");
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<XRayResponse | null>(null);
  const [error, setError] = useState("");

  const handleRunXRay = async () => {
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await apiFetch("/api/project/xray", {
        method: "POST",
        body: JSON.stringify({
          project_contract: projectContract,
          current_progress: currentProgress,
          rubric: rubric
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to run Project X-Ray");
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

  const getScoreColor = (score: number) => {
    if (score >= 80) return "bg-emerald-400";
    if (score >= 50) return "bg-amber-400";
    return "bg-red-500";
  };

  const getRiskStyles = (risk: string) => {
    switch (risk.toUpperCase()) {
      case "LOW": return "bg-emerald-500/10 border-emerald-500/30 text-emerald-400";
      case "MEDIUM": return "bg-amber-500/10 border-amber-500/30 text-amber-400";
      case "HIGH": return "bg-red-500/10 border-red-500/30 text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.2)]";
      case "CRITICAL": return "bg-red-600/20 border-red-500/50 text-red-500 font-bold shadow-[0_0_30px_rgba(220,38,38,0.4)] animate-pulse";
      default: return "bg-white/5 border-white/10 text-white";
    }
  };

  return (
    <LenisProvider>
      <main className="flex flex-col min-h-screen bg-[#0B0B10] text-white selection:bg-accent-magenta/30 font-sans">
        <Navbar />
        
        <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-24 md:py-32 flex flex-col xl:flex-row gap-8">
          
          {/* Left Column: Input Form (The Machine) */}
          <div className="w-full xl:w-[350px] shrink-0 flex flex-col gap-6">
            <div className="bg-[#12121A]/80 border border-white/10 rounded-2xl p-6 shadow-xl backdrop-blur-md sticky top-24">
              <div className="flex items-center gap-2 mb-6 text-purple-400">
                <Activity className="w-5 h-5" />
                <h1 className="text-xl font-bold font-mono tracking-tight uppercase">Project X-Ray</h1>
              </div>
              <p className="text-xs text-muted-on-dark mb-6 leading-relaxed">
                A ruthless, objective scan of your project&apos;s true health. A project 90% technically complete with 0% demo readiness will fail.
              </p>

              <div className="flex flex-col gap-5">
                <div>
                  <label className="text-xs font-mono text-muted-on-dark mb-1.5 block">Project Contract & Scope</label>
                  <textarea
                    value={projectContract}
                    onChange={(e) => setProjectContract(e.target.value)}
                    className="w-full h-20 bg-[#0A0A10] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-400 transition-colors resize-none leading-relaxed"
                  />
                </div>

                <div>
                  <label className="text-xs font-mono text-muted-on-dark mb-1.5 block">Hackathon Rubric</label>
                  <input
                    type="text"
                    value={rubric}
                    onChange={(e) => setRubric(e.target.value)}
                    className="w-full bg-[#0A0A10] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-400 transition-colors"
                  />
                </div>

                <div>
                  <label className="text-xs font-mono text-muted-on-dark mb-1.5 block flex items-center gap-1.5 text-amber-400">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Brutally Honest Progress State
                  </label>
                  <textarea
                    value={currentProgress}
                    onChange={(e) => setCurrentProgress(e.target.value)}
                    placeholder="e.g. We spent 6 hours on auth. The main feature is broken."
                    className="w-full h-32 bg-[#0A0A10] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-400 transition-colors resize-none leading-relaxed"
                  />
                </div>

                <button
                  onClick={handleRunXRay}
                  disabled={loading || !currentProgress.trim()}
                  className="mt-2 w-full bg-purple-500 hover:bg-purple-600 text-white disabled:opacity-50 font-mono font-bold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(168,85,247,0.3)]"
                >
                  {loading ? (
                    <Zap className="w-5 h-5 animate-pulse" />
                  ) : (
                    <Crosshair className="w-5 h-5" />
                  )}
                  {loading ? "Scanning Code & Scope..." : "RUN PROJECT X-RAY"}
                </button>
                
                {error && (
                  <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs font-mono mt-2">
                    {error}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: The Command Center Output */}
          <div className="w-full flex-1 flex flex-col gap-6">
            {!result && !loading && (
              <div className="h-full min-h-[400px] border border-white/5 rounded-2xl flex flex-col items-center justify-center text-center p-8 bg-[#12121A]/30">
                <ShieldAlert className="w-12 h-12 text-white/20 mb-4" />
                <h3 className="text-lg font-bold text-white mb-2 font-mono">System Offline</h3>
                <p className="text-sm text-muted-on-dark max-w-md">
                  Awaiting project state input to perform deep diagnostic X-Ray.
                </p>
              </div>
            )}

            {loading && (
              <div className="h-full min-h-[400px] border border-white/5 rounded-2xl flex flex-col items-center justify-center text-center p-8 bg-[#12121A]/30">
                <div className="w-10 h-10 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mb-4" />
                <p className="text-sm text-purple-400 font-mono animate-pulse">Running diagnostics and rubric alignment...</p>
              </div>
            )}

            {result && !loading && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col gap-6">
                
                {/* Top Row: Overall Risk & Actions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Overall Risk Card */}
                  <div className={`col-span-1 rounded-2xl p-6 border flex flex-col justify-center items-center text-center ${getRiskStyles(result.overall_risk)}`}>
                    <ShieldAlert className="w-10 h-10 mb-2 opacity-80" />
                    <div className="text-[10px] font-mono uppercase tracking-widest opacity-70 mb-1">Overall Risk Level</div>
                    <div className="text-3xl font-bold font-mono tracking-tight">{result.overall_risk}</div>
                  </div>

                  {/* Next Actions */}
                  <div className="col-span-1 md:col-span-2 bg-[#12121A]/80 border border-white/10 rounded-2xl p-6 shadow-xl backdrop-blur-md">
                    <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-white mb-4 flex items-center gap-2">
                      <Zap className="w-4 h-4 text-purple-400" />
                      Highest-Value Actions
                    </h3>
                    <div className="flex flex-col gap-3">
                      {result.top_three_actions.map((action, idx) => (
                        <div key={idx} className="flex items-start gap-3 bg-white/5 p-3 rounded-xl border border-white/5">
                          <div className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-[10px] font-bold font-mono shrink-0 mt-0.5">
                            {idx + 1}
                          </div>
                          <p className="text-sm text-white/90 leading-relaxed font-medium">{action}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Risk Rationale */}
                <div className="bg-[#12121A]/80 border border-white/10 rounded-2xl p-6 shadow-xl backdrop-blur-md">
                  <h3 className="text-[10px] font-mono text-muted-on-dark uppercase mb-2">Diagnostic Rationale</h3>
                  <p className="text-sm text-white/80 leading-relaxed">
                    {result.risk_rationale}
                  </p>
                </div>

                {/* Health Score Matrix */}
                <div className="bg-[#12121A]/80 border border-white/10 rounded-2xl p-6 shadow-xl backdrop-blur-md">
                  <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-white mb-6 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-blue-400" />
                    Project Health Telemetry
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    {Object.entries(result.health_scores).map(([key, score]) => {
                      const formattedKey = key.replace(/_/g, " ").toUpperCase();
                      return (
                        <div key={key} className="flex flex-col gap-2">
                          <div className="flex justify-between items-center text-xs font-mono">
                            <span className="text-white/70">{formattedKey}</span>
                            <span className={`font-bold ${score >= 80 ? 'text-emerald-400' : score >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                              {score}%
                            </span>
                          </div>
                          <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-1000 ${getScoreColor(score)}`}
                              style={{ width: `${score}%` }}
                            />
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
