"use client";

import React, { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { GitBranch, GitCommit, Search, GitPullRequest, AlertTriangle, ShieldCheck } from "lucide-react";
import { apiFetch } from "@/lib/api";

export default function GithubIntelPage() {
  const [repoUrl, setRepoUrl] = useState("https://github.com/team/hackathon-project");
  const [archContract, setArchContract] = useState(
    "Backend: FastAPI (Python 3.12). Database: PostgreSQL. Event Bus: Kafka."
  );
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  const handleAnalyze = async () => {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const response = await apiFetch("/api/github/analyze", {
        method: "POST",
        body: JSON.stringify({
          repo_url: repoUrl,
          architecture_contract: archContract,
          commits: [
            { hash: "f3a29b1", message: "Initial commit", author: "Dev" },
            { hash: "8d9f11a", message: "Setup express server and mongodb mongoose schemas", author: "Dev" },
            { hash: "9f32ac2", message: "Remove kafka producer, use raw REST webhooks instead", author: "Dev" }
          ]
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
            <GitBranch className="w-10 h-10 text-slate-400" />
            GitHub Intelligence
          </h1>
          <p className="text-xl text-white/60 font-light max-w-2xl">
            Detect architecture drift automatically. Generates Architecture Decision Records (ADRs) based on repository activity to track engineering history.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-[#12121A] border border-white/10 rounded-xl p-6">
              <label className="block text-sm font-bold text-white/80 mb-2 uppercase tracking-wider font-mono">
                Repository URL
              </label>
              <input
                type="text"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-sm font-mono text-white/90 focus:outline-none focus:border-slate-500 mb-4"
              />
              
              <label className="block text-sm font-bold text-white/80 mb-2 uppercase tracking-wider font-mono">
                Original Architecture
              </label>
              <textarea
                value={archContract}
                onChange={(e) => setArchContract(e.target.value)}
                className="w-full h-32 bg-black/50 border border-white/10 rounded-lg p-3 text-sm font-mono text-white/90 placeholder-white/30 focus:outline-none focus:border-slate-500"
              />
            </div>
            
            <button
              onClick={handleAnalyze}
              disabled={loading}
              className="w-full py-4 rounded-xl bg-slate-200 text-black font-bold tracking-wider hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
            >
              {loading ? "SCANNING..." : "SCAN REPOSITORY"}
            </button>
            {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
          </div>

          <div className="lg:col-span-2 bg-[#12121A] border border-white/10 rounded-xl p-6 flex flex-col">
            <h2 className="text-lg font-bold mb-6 font-mono uppercase tracking-wider text-white/80 border-b border-white/10 pb-4 flex items-center gap-2">
              <Search className="w-5 h-5 text-slate-400" />
              Intelligence Report
            </h2>
            
            {!result && !loading && (
              <div className="flex-1 flex flex-col items-center justify-center text-white/20">
                <GitPullRequest className="w-16 h-16 mb-4 opacity-50" />
                <p>Run scan to detect drift and generate ADRs...</p>
              </div>
            )}
            
            {loading && (
              <div className="flex-1 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-500"></div>
              </div>
            )}

            {result && !loading && (
              <div className="flex flex-col gap-6">
                
                <div className={`p-5 rounded-lg border ${
                  result.drift_detected
                    ? 'bg-red-500/10 border-red-500/30 text-red-100'
                    : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-100'
                }`}>
                  <div className="flex items-center gap-3 mb-2">
                    {result.drift_detected ? <AlertTriangle className="w-6 h-6 text-red-400" /> : <ShieldCheck className="w-6 h-6 text-emerald-400" />}
                    <h3 className="text-lg font-bold">
                      {result.drift_detected ? 'Architecture Drift Detected' : 'Architecture Aligned'}
                    </h3>
                  </div>
                  <p className="opacity-90 leading-relaxed">
                    {result.drift_analysis}
                  </p>
                </div>
                
                {result.adr && result.adr.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold text-white/50 uppercase tracking-wider mb-4 font-mono">
                      Generated Architecture Decision Records (ADR)
                    </h3>
                    <div className="space-y-4">
                      {result.adr.map((item: any, i: number) => (
                        <div key={i} className="bg-black/50 p-5 rounded-lg border border-white/10">
                          <div className="flex items-center gap-2 mb-3">
                            <GitCommit className="w-4 h-4 text-slate-500" />
                            <h4 className="font-bold text-slate-300">{item.title}</h4>
                          </div>
                          <p className="text-sm text-white/70 pl-6 border-l-2 border-white/10">
                            <span className="font-mono text-xs opacity-50 block mb-1">REASON</span>
                            {item.reason}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
              </div>
            )}
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
