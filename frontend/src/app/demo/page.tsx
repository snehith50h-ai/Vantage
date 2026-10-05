"use client";

import { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import LenisProvider from "@/components/LenisProvider";
import Footer from "@/components/Footer";

import ArchitectureSection from "@/components/ArchitectureSection";

export default function DemoPage() {
  const [organizerName, setOrganizerName] = useState("");
  const [problemStatement, setProblemStatement] = useState("");
  const [loading, setLoading] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch("http://localhost:8000/api/strategize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          organizer_name: organizerName,
          problem_statement: problemStatement,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to fetch");
      }

      const data = await response.json();
      setResult(data);
      setTimeout(() => {
        const diagramEl = document.getElementById("architecture-diagram-section");
        if (diagramEl) {
          diagramEl.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 200);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to fetch");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <LenisProvider>
      <main className="flex flex-col min-h-screen bg-black text-text-on-dark font-sans relative">
        <Navbar />
        
        {/* Background effects */}
        <div className="absolute inset-0 bg-dotted-dark pointer-events-none opacity-50 z-0"></div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96 bg-accent-magenta/20 blur-[120px] pointer-events-none z-0 rounded-full"></div>

        <div className="flex-grow flex items-center justify-center pt-32 pb-20 px-6 relative z-10">
          <div className={`${result ? "max-w-5xl" : "max-w-3xl"} w-full bg-[#0B0B10]/80 backdrop-blur-xl p-8 rounded-2xl border border-white/10 shadow-[0_0_40px_rgba(192,43,214,0.15)] transition-all duration-500`}>
            {/* Pro Studio Playground Banner */}
            <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-accent-magenta/20 via-accent-pink/15 to-transparent border border-accent-pink/30 flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-accent-pink animate-ping"></span>
                <span className="text-xs font-mono text-white">
                  <strong>PRO PLAYGROUND:</strong> Google AI Studio Multi-Agent Playground is now live!
                </span>
              </div>
              <Link
                href="/playground"
                className="px-3.5 py-1.5 rounded-lg bg-accent-pink text-black font-mono font-bold text-xs uppercase tracking-wider hover:bg-white transition-all shadow-[0_0_12px_rgba(255,92,147,0.3)] inline-flex items-center gap-1.5"
              >
                <span>Launch Playground ➔</span>
              </Link>
            </div>

            <h1 className="text-4xl font-bold mb-2 tracking-tight">Strategize Your Hackathon</h1>
            <p className="text-muted-on-dark mb-8">Enter your hackathon details and our AI agents will profile the ideal jury and generate a final blueprint for execution.</p>
            
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              <div>
                <label className="block text-sm font-medium mb-2 text-text-on-dark">Organizer Name</label>
                <input
                  type="text"
                  required
                  value={organizerName}
                  onChange={(e) => setOrganizerName(e.target.value)}
                  className="w-full bg-[#1A1520] border border-white/10 rounded-lg p-4 text-white focus:outline-none focus:border-accent-pink transition-colors"
                  placeholder="e.g. Major League Hacking"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-text-on-dark">Problem Statement</label>
                <textarea
                  required
                  value={problemStatement}
                  onChange={(e) => setProblemStatement(e.target.value)}
                  className="w-full bg-[#1A1520] border border-white/10 rounded-lg p-4 text-white h-32 focus:outline-none focus:border-accent-pink transition-colors resize-none"
                  placeholder="Describe the main problem or theme for the hackathon..."
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 mt-2 rounded-lg bg-accent-pink text-black font-mono font-bold uppercase tracking-wider hover:bg-white transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-1 shadow-[0_0_20px_rgba(255,92,147,0.3)]"
              >
                {loading ? "Generating Strategy..." : "Generate Strategy"}
              </button>
            </form>

            {error && (
              <div className="mt-8 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
                {error}
              </div>
            )}

            {result && (
              <div className="mt-12 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="pt-8 border-t border-white/10">
                  <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-accent-pink"></span>
                    Jury Profile
                  </h2>
                  <div className="p-6 bg-[#1A1520] rounded-xl border border-white/5 whitespace-pre-wrap text-[15px] leading-relaxed text-muted-on-dark">
                    {result.jury_profile}
                  </div>
                </div>

                {/* AI-DRAWN ARCHITECTURE DIAGRAM & EDIT SUITE */}
                <ArchitectureSection
                  architecture={result.final_blueprint?.architecture || ""}
                  onUpdateArchitecture={(updated) => {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    setResult((prev: any) => ({
                      ...prev,
                      final_blueprint: {
                        ...prev.final_blueprint,
                        architecture: updated,
                      },
                    }));
                  }}
                  problemStatement={problemStatement}
                />

                {result.final_blueprint?.pitch_outline && (
                  <div>
                    <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-accent-pink"></span>
                      Pitch Outline
                    </h2>
                    <div className="p-6 bg-[#1A1520] rounded-xl border border-white/5 text-[15px] leading-relaxed text-muted-on-dark overflow-x-auto">
                      <pre className="font-mono text-sm whitespace-pre-wrap">
                        {JSON.stringify(result.final_blueprint.pitch_outline, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        <Footer />
      </main>
    </LenisProvider>
  );
}
