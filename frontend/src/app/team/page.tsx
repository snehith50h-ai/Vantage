"use client";

import React, { useState } from "react";
import LenisProvider from "@/components/LenisProvider";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Users, Activity, Target, ShieldAlert, Sparkles, Plus, Trash2 } from "lucide-react";

interface TeamMember {
  name: string;
  evidence: string;
}

interface Capability {
  domain: string;
  level: "Strong" | "Medium" | "Beginner" | "Weak";
  evidence: string;
}

interface TeamProfile {
  team_name: string;
  capabilities: Capability[];
  strengths: string[];
  weaknesses: string[];
  recommendation: string;
}

export default function TeamProfilePage() {
  const [teamName, setTeamName] = useState("Team Alpha");
  const [members, setMembers] = useState<TeamMember[]>([
    { name: "Alice", evidence: "Built a REST API with FastAPI, designed Postgres schema" },
    { name: "Bob", evidence: "React components, Tailwind CSS styling, integrated REST endpoints" }
  ]);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<TeamProfile | null>(null);
  const [error, setError] = useState("");

  const addMember = () => {
    setMembers([...members, { name: "", evidence: "" }]);
  };

  const removeMember = (index: number) => {
    setMembers(members.filter((_, i) => i !== index));
  };

  const updateMember = (index: number, field: keyof TeamMember, value: string) => {
    const updated = [...members];
    updated[index][field] = value;
    setMembers(updated);
  };

  const handleAnalyze = async () => {
    setLoading(true);
    setError("");
    setProfile(null);

    try {
      const response = await fetch("http://localhost:8000/api/team/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          team_name: teamName,
          members: members.filter(m => m.name.trim() !== ""),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate team profile");
      }

      const data = await response.json();
      setProfile(data);
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

  const getLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case "strong": return "text-emerald-400 bg-emerald-400/10 border-emerald-400/20";
      case "medium": return "text-blue-400 bg-blue-400/10 border-blue-400/20";
      case "beginner": return "text-amber-400 bg-amber-400/10 border-amber-400/20";
      case "weak": return "text-red-400 bg-red-400/10 border-red-400/20";
      default: return "text-gray-400 bg-gray-400/10 border-gray-400/20";
    }
  };

  return (
    <LenisProvider>
      <main className="flex flex-col min-h-screen bg-[#0B0B10] text-white selection:bg-accent-magenta/30 font-sans">
        <Navbar />
        
        <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-24 md:py-32 flex flex-col lg:flex-row gap-8">
          
          {/* Left Column: Input Form */}
          <div className="w-full lg:w-1/3 flex flex-col gap-6">
            <div className="bg-[#12121A]/80 border border-white/10 rounded-2xl p-6 shadow-xl backdrop-blur-md">
              <div className="flex items-center gap-2 mb-6">
                <Users className="w-5 h-5 text-accent-pink" />
                <h1 className="text-xl font-bold font-mono tracking-tight">Team Intelligence</h1>
              </div>

              <div className="flex flex-col gap-4">
                <div>
                  <label className="text-xs font-mono text-muted-on-dark mb-1.5 block">Team Name</label>
                  <input
                    type="text"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    className="w-full bg-[#0A0A10] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-accent-pink transition-colors"
                  />
                </div>

                <div className="space-y-4 mt-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-mono text-muted-on-dark block">Members & Evidence</label>
                    <button onClick={addMember} className="text-xs text-accent-pink hover:underline flex items-center gap-1">
                      <Plus className="w-3 h-3" /> Add Member
                    </button>
                  </div>
                  
                  {members.map((member, idx) => (
                    <div key={idx} className="bg-[#0A0A10]/50 p-4 rounded-xl border border-white/5 flex flex-col gap-3 relative group">
                      {members.length > 1 && (
                        <button 
                          onClick={() => removeMember(idx)}
                          className="absolute top-2 right-2 text-white/30 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                      <input
                        type="text"
                        placeholder="Name (e.g. Jahwanth)"
                        value={member.name}
                        onChange={(e) => updateMember(idx, "name", e.target.value)}
                        className="w-full bg-[#0A0A10] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-pink transition-colors"
                      />
                      <textarea
                        placeholder="Evidence (e.g. 12 repositories, 87 PRs, implemented Auth via JWT...)"
                        value={member.evidence}
                        onChange={(e) => updateMember(idx, "evidence", e.target.value)}
                        className="w-full h-24 bg-[#0A0A10] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-pink transition-colors resize-none"
                      />
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleAnalyze}
                  disabled={loading || members.length === 0}
                  className="mt-4 w-full bg-white text-ink-dark hover:bg-gray-200 disabled:opacity-50 font-mono font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <Sparkles className="w-5 h-5 animate-pulse" />
                  ) : (
                    <Activity className="w-5 h-5" />
                  )}
                  {loading ? "Analyzing..." : "Generate Capability Graph"}
                </button>
                
                {error && (
                  <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs font-mono mt-2">
                    {error}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Output / Capability Graph */}
          <div className="w-full lg:w-2/3 flex flex-col gap-6">
            {!profile && !loading && (
              <div className="h-full min-h-[400px] border border-white/5 rounded-2xl flex flex-col items-center justify-center text-center p-8 bg-[#12121A]/30">
                <Target className="w-12 h-12 text-white/20 mb-4" />
                <h3 className="text-lg font-bold text-white mb-2 font-mono">No Profile Generated</h3>
                <p className="text-sm text-muted-on-dark max-w-md">
                  Input your team members and their demonstrated evidence (past projects, PRs, specific technical feats). The Engine will reconstruct your actual technical capability graph.
                </p>
              </div>
            )}

            {loading && (
              <div className="h-full min-h-[400px] border border-white/5 rounded-2xl flex flex-col items-center justify-center text-center p-8 bg-[#12121A]/30">
                <div className="w-10 h-10 border-4 border-accent-pink/30 border-t-accent-pink rounded-full animate-spin mb-4" />
                <p className="text-sm text-muted-on-dark font-mono animate-pulse">Mapping evidence to capabilities...</p>
              </div>
            )}

            {profile && !loading && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col gap-6">
                
                {/* Header Stats */}
                <div className="bg-[#12121A]/80 border border-white/10 rounded-2xl p-6 shadow-xl backdrop-blur-md">
                  <h2 className="text-2xl font-bold mb-1">{profile.team_name}</h2>
                  <p className="text-sm text-muted-on-dark font-mono mb-6">Capability Baseline Reconstructed from Evidence</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                      <h4 className="text-xs font-mono text-emerald-400 mb-2 uppercase tracking-wider">Demonstrated Strengths</h4>
                      <ul className="list-disc list-inside text-sm text-white/80 space-y-1">
                        {profile.strengths.map((s, i) => <li key={i}>{s}</li>)}
                      </ul>
                    </div>
                    <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/20">
                      <h4 className="text-xs font-mono text-red-400 mb-2 uppercase tracking-wider">Critical Gaps / Weaknesses</h4>
                      <ul className="list-disc list-inside text-sm text-white/80 space-y-1">
                        {profile.weaknesses.map((s, i) => <li key={i}>{s}</li>)}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Capability Matrix */}
                <div className="bg-[#12121A]/80 border border-white/10 rounded-2xl p-6 shadow-xl backdrop-blur-md">
                  <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-white mb-6 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-accent-magenta" />
                    Technical Capability Matrix
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {profile.capabilities.map((cap, idx) => (
                      <div key={idx} className="bg-[#0A0A10] border border-white/5 rounded-xl p-4 flex flex-col gap-2 relative overflow-hidden group">
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-bold text-white">{cap.domain}</span>
                          <span className={`text-xs font-mono px-2 py-1 rounded border ${getLevelColor(cap.level)}`}>
                            {cap.level}
                          </span>
                        </div>
                        <p className="text-xs text-white/60 leading-relaxed">
                          <strong className="text-white/40 font-mono text-[10px] uppercase">Evidence: </strong>
                          {cap.evidence}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Adaptive Next Project Recommendation */}
                <div className="bg-gradient-to-r from-accent-magenta/10 to-accent-pink/10 border border-accent-pink/20 rounded-2xl p-6 shadow-xl backdrop-blur-md relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Target className="w-24 h-24" />
                  </div>
                  <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-accent-pink mb-3 flex items-center gap-2 relative z-10">
                    <ShieldAlert className="w-4 h-4" />
                    Level-Up Recommendation
                  </h3>
                  <p className="text-base md:text-lg text-white font-medium relative z-10 leading-relaxed">
                    {profile.recommendation}
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
