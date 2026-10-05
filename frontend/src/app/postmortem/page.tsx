"use client";

import React, { useState } from "react";
import LenisProvider from "@/components/LenisProvider";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { BookOpen, Zap, Target, History, Trophy, BrainCircuit, AlertCircle } from "lucide-react";

interface CapabilityUpdate {
  skill: string;
  status: string;
  evidence: string;
}

interface PostmortemResponse {
  capability_updates: CapabilityUpdate[];
  lessons_learned: string[];
  next_project_recommendation: string;
}

export default function PostmortemPage() {
  const [projectName, setProjectName] = useState("AI Resume Screener");
  
  const [reflections, setReflections] = useState({
    worked: "The core PDF parsing and LLM integration worked perfectly.",
    failed: "We tried to build custom JWT auth from scratch and it broke an hour before the deadline.",
    time_sink: "Debugging CORS issues and the custom authentication.",
    ai_generated: "AI generated the entire Tailwind frontend and the boilerplate for FastAPI.",
    judge_critique: "The judges loved the tech but said we had no clear business model."
  });
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PostmortemResponse | null>(null);
  const [error, setError] = useState("");

  const handleRunPostmortem = async () => {
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch("http://localhost:8000/api/project/postmortem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_name: projectName,
          reflections: reflections
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to process Postmortem");
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

  const handleReflectionChange = (key: keyof typeof reflections, value: string) => {
    setReflections(prev => ({ ...prev, [key]: value }));
  };

  return (
    <LenisProvider>
      <main className="flex flex-col min-h-screen bg-[#0B0B10] text-white selection:bg-accent-magenta/30 font-sans">
        <Navbar />
        
        <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-24 md:py-32 flex flex-col xl:flex-row gap-8">
          
          {/* Left Column: Input Form (The Interrogation) */}
          <div className="w-full xl:w-[450px] shrink-0 flex flex-col gap-6">
            <div className="bg-[#12121A]/80 border border-white/10 rounded-2xl p-6 shadow-xl backdrop-blur-md sticky top-24">
              <div className="flex items-center gap-2 mb-6 text-emerald-400">
                <BookOpen className="w-5 h-5" />
                <h1 className="text-xl font-bold font-mono tracking-tight uppercase">Postmortem Log</h1>
              </div>
              <p className="text-xs text-muted-on-dark mb-6 leading-relaxed">
                What happened? Honest answers become permanent capability evidence. This closes the loop.
              </p>

              <div className="flex flex-col gap-4">
                <div>
                  <label className="text-[10px] font-mono text-muted-on-dark uppercase mb-1 block">Project Name</label>
                  <input
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    className="w-full bg-[#0A0A10] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-400 transition-colors"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono text-emerald-400/80 uppercase mb-1 block">What worked?</label>
                  <textarea
                    value={reflections.worked}
                    onChange={(e) => handleReflectionChange("worked", e.target.value)}
                    className="w-full h-16 bg-[#0A0A10] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-400 transition-colors resize-none leading-relaxed"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono text-red-400/80 uppercase mb-1 block">What failed?</label>
                  <textarea
                    value={reflections.failed}
                    onChange={(e) => handleReflectionChange("failed", e.target.value)}
                    className="w-full h-16 bg-[#0A0A10] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-red-400 transition-colors resize-none leading-relaxed"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono text-amber-400/80 uppercase mb-1 block">What consumed time?</label>
                  <textarea
                    value={reflections.time_sink}
                    onChange={(e) => handleReflectionChange("time_sink", e.target.value)}
                    className="w-full h-16 bg-[#0A0A10] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400 transition-colors resize-none leading-relaxed"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono text-purple-400/80 uppercase mb-1 block">What did AI generate?</label>
                  <textarea
                    value={reflections.ai_generated}
                    onChange={(e) => handleReflectionChange("ai_generated", e.target.value)}
                    className="w-full h-16 bg-[#0A0A10] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-400 transition-colors resize-none leading-relaxed"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono text-blue-400/80 uppercase mb-1 block">What did judges criticize?</label>
                  <textarea
                    value={reflections.judge_critique}
                    onChange={(e) => handleReflectionChange("judge_critique", e.target.value)}
                    className="w-full h-16 bg-[#0A0A10] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-400 transition-colors resize-none leading-relaxed"
                  />
                </div>

                <button
                  onClick={handleRunPostmortem}
                  disabled={loading || !projectName.trim()}
                  className="mt-2 w-full bg-emerald-500 hover:bg-emerald-600 text-black disabled:opacity-50 font-mono font-bold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                >
                  {loading ? (
                    <Zap className="w-5 h-5 animate-pulse" />
                  ) : (
                    <History className="w-5 h-5" />
                  )}
                  {loading ? "Logging Evidence..." : "SUBMIT POSTMORTEM"}
                </button>
                
                {error && (
                  <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs font-mono mt-2">
                    {error}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Evidence & Growth */}
          <div className="w-full flex-1 flex flex-col gap-6">
            {!result && !loading && (
              <div className="h-full min-h-[400px] border border-white/5 rounded-2xl flex flex-col items-center justify-center text-center p-8 bg-[#12121A]/30">
                <Trophy className="w-12 h-12 text-white/20 mb-4" />
                <h3 className="text-lg font-bold text-white mb-2 font-mono">Archive Empty</h3>
                <p className="text-sm text-muted-on-dark max-w-md">
                  Complete the postmortem interrogation. We will distill your pain points into verified engineering capability updates for your Builder Profile.
                </p>
              </div>
            )}

            {loading && (
              <div className="h-full min-h-[400px] border border-white/5 rounded-2xl flex flex-col items-center justify-center text-center p-8 bg-[#12121A]/30">
                <div className="w-10 h-10 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mb-4" />
                <p className="text-sm text-emerald-400 font-mono animate-pulse">Extracting capabilities from reflections...</p>
              </div>
            )}

            {result && !loading && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col gap-6">
                
                {/* Capability Updates */}
                <div className="bg-[#12121A]/80 border border-white/10 rounded-2xl p-6 shadow-xl backdrop-blur-md">
                  <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-emerald-400 mb-6 flex items-center gap-2">
                    <Trophy className="w-4 h-4" />
                    Verified Capability Updates
                  </h3>
                  
                  <div className="flex flex-col gap-4">
                    {result.capability_updates.map((update, idx) => (
                      <div key={idx} className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-white">{update.skill}</h4>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-emerald-500/50 text-emerald-400 uppercase bg-emerald-500/10">
                            {update.status}
                          </span>
                        </div>
                        <p className="text-xs text-emerald-100/70 leading-relaxed">
                          <strong className="text-emerald-400/50 uppercase font-mono text-[10px] mr-1">Evidence: </strong>
                          {update.evidence}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Lessons Learned */}
                <div className="bg-[#12121A]/80 border border-white/10 rounded-2xl p-6 shadow-xl backdrop-blur-md">
                  <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-amber-400 mb-4 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Hard-Won Lessons
                  </h3>
                  <ul className="flex flex-col gap-2">
                    {result.lessons_learned.map((lesson, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-white/80">
                        <div className="mt-1 w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                        <span className="leading-relaxed">{lesson}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Next Project Recommendation */}
                <div className="bg-gradient-to-r from-accent-magenta/10 to-blue-500/10 border border-accent-magenta/30 rounded-2xl p-6 shadow-xl backdrop-blur-md relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <BrainCircuit className="w-24 h-24" />
                  </div>
                  <h3 className="text-[10px] font-mono font-bold uppercase tracking-wider text-accent-magenta mb-2 flex items-center gap-2 relative z-10">
                    <Target className="w-4 h-4" />
                    Level 101: The Next Challenge
                  </h3>
                  <p className="text-base md:text-lg text-white font-medium relative z-10 leading-relaxed">
                    {result.next_project_recommendation}
                  </p>
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
