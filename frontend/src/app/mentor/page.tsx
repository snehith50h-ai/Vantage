"use client";

import React, { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Bot, AlertTriangle, ShieldCheck, Zap } from "lucide-react";

export default function MentorPage() {
  const [projectState, setProjectState] = useState(
    "Core workflow: AI-powered early warning subsidence system for coal mines. Stack: Next.js, FastAPI, Kafka, TimescaleDB."
  );
  const [currentCode, setCurrentCode] = useState(
    "I'm currently trying to build a custom OAuth2 authorization server from scratch using Node.js instead of working on the FastAPI edge ingestion."
  );
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  const handleAnalyze = async () => {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const response = await fetch("http://localhost:8000/api/mentor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_state: projectState,
          current_code: currentCode,
        }),
      });
      if (!response.ok) throw new Error("API failed");
      const data = await response.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || "Failed to fetch");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07070B] text-white selection:bg-accent-magenta/30 font-sans flex flex-col">
      <Navbar />
      
      <main className="flex-1 pt-32 pb-24 px-6 md:px-12 max-w-5xl mx-auto w-full">
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 flex items-center gap-4">
            <Bot className="w-10 h-10 text-amber-400" />
            AI Technical Mentor
          </h1>
          <p className="text-xl text-white/60 font-light max-w-2xl">
            Real-time, ruthless engineering mentorship. Identifies architecture drift, out-of-scope tasks, and critical path blockers before you waste hours.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="bg-[#12121A] border border-white/10 rounded-xl p-6">
              <label className="block text-sm font-bold text-white/80 mb-2 uppercase tracking-wider font-mono">
                Project Contract State
              </label>
              <textarea
                value={projectState}
                onChange={(e) => setProjectState(e.target.value)}
                className="w-full h-32 bg-black/50 border border-white/10 rounded-lg p-4 text-sm font-mono text-white/90 placeholder-white/30 focus:outline-none focus:border-amber-500"
              />
            </div>
            
            <div className="bg-[#12121A] border border-white/10 rounded-xl p-6">
              <label className="block text-sm font-bold text-white/80 mb-2 uppercase tracking-wider font-mono">
                Current Activity / Code
              </label>
              <textarea
                value={currentCode}
                onChange={(e) => setCurrentCode(e.target.value)}
                className="w-full h-32 bg-black/50 border border-white/10 rounded-lg p-4 text-sm font-mono text-white/90 placeholder-white/30 focus:outline-none focus:border-amber-500"
              />
            </div>

            <button
              onClick={handleAnalyze}
              disabled={loading}
              className="w-full py-4 rounded-xl bg-amber-500 text-black font-bold tracking-wider hover:bg-amber-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
            >
              {loading ? "ANALYZING..." : "GET MENTORSHIP"}
            </button>
            {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
          </div>

          <div className="bg-[#12121A] border border-white/10 rounded-xl p-6 flex flex-col">
            <h2 className="text-lg font-bold mb-4 font-mono uppercase tracking-wider text-white/80 border-b border-white/10 pb-4">
              Mentorship Feedback
            </h2>
            
            {!result && !loading && (
              <div className="flex-1 flex flex-col items-center justify-center text-white/20">
                <Bot className="w-16 h-16 mb-4 opacity-50" />
                <p>Waiting for context...</p>
              </div>
            )}
            
            {loading && (
              <div className="flex-1 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
              </div>
            )}

            {result && !loading && (
              <div className="flex-1 flex flex-col gap-6">
                <div className={`p-4 rounded-lg flex items-start gap-3 ${{
                  'Warning': 'bg-amber-500/10 border border-amber-500/30 text-amber-300',
                  'Critical': 'bg-red-500/10 border border-red-500/30 text-red-300',
                  'On Track': 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                }[result.status as string] || 'bg-white/5 border border-white/10 text-white'}}`}>
                  {result.status === 'Critical' && <AlertTriangle className="w-6 h-6 shrink-0" />}
                  {result.status === 'Warning' && <Zap className="w-6 h-6 shrink-0" />}
                  {result.status === 'On Track' && <ShieldCheck className="w-6 h-6 shrink-0" />}
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider opacity-70 block mb-1">
                      Status: {result.status}
                    </span>
                    <span className="font-medium">
                      {result.feedback}
                    </span>
                  </div>
                </div>

                <div className="bg-black/50 p-4 rounded-lg border border-white/10">
                  <span className="text-xs font-bold text-white/50 uppercase tracking-wider block mb-2 font-mono">
                    Suggested Action
                  </span>
                  <p className="text-white/90">
                    {result.suggested_action}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
