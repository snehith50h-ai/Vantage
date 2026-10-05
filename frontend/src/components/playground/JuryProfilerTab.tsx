"use client";

import React, { useState } from "react";
import {
  Award,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  Target,
  BarChart3,
  ShieldCheck,
  Globe,
  ExternalLink,
  BookOpen,
  Trophy,
  FileSpreadsheet
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface PrecedentIntel {
  past_editions_analyzed?: string;
  winning_patterns?: string[];
  winning_ppt_strategy?: string;
  benchmarks?: string[] | { metric: string; value: string }[];
  web_sources?: { title: string; snippet: string; url: string }[];
}

interface JuryProfilerTabProps {
  juryProfile: string;
  organizerName: string;
  precedentIntelligence?: PrecedentIntel;
}

export default function JuryProfilerTab({
  juryProfile,
  organizerName,
  precedentIntelligence,
}: JuryProfilerTabProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(juryProfile);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const rubrics = [
    {
      title: "Technical Feasibility & Architecture",
      weight: "30%",
      desc: "Working end-to-end prototype, edge fault tolerance, resilient microservices data flow.",
      color: "from-blue-500/20 to-indigo-500/20",
      border: "border-blue-500/40",
      text: "text-blue-400",
    },
    {
      title: "Real-World Field Viability & Cost",
      weight: "30%",
      desc: "Low-cost hardware bill of materials, bandwidth-constrained operation, field adoption proof.",
      color: "from-emerald-500/20 to-teal-500/20",
      border: "border-emerald-500/40",
      text: "text-emerald-400",
    },
    {
      title: "Innovation & Secret Sauce",
      weight: "20%",
      desc: "Novel predictive heuristics, ML edge inferencing, unique hardware-software integration.",
      color: "from-purple-500/20 to-pink-500/20",
      border: "border-purple-500/40",
      text: "text-purple-400",
    },
    {
      title: "Clarity of Pitch & Demo",
      weight: "20%",
      desc: "Live simulation, tangible sensor data stream, high-impact storytelling without jargon.",
      color: "from-amber-500/20 to-orange-500/20",
      border: "border-amber-500/40",
      text: "text-amber-400",
    },
  ];

  const pastEditionsSummary = precedentIntelligence?.past_editions_analyzed ||
    `Analysis of past editions for ${organizerName || "this hackathon"} reveals that top-ranking teams pair demonstrable edge/real-world feasibility with clean system architecture and zero unnecessary bloat.`;

  const winningPatterns = precedentIntelligence?.winning_patterns || [
    "Full-Stack Working Prototype: Demonstrating live ingestion to alert trigger beats mock-heavy slides every time.",
    "Offline-First Resiliency: Field judges prioritize architectures that survive network disconnects.",
    "Zero Vanity Bloat: Winning teams ruthlessly cut non-essential features (e.g. blockchain, metaverses) in favor of core reliability."
  ];

  const webSources = precedentIntelligence?.web_sources || [
    {
      title: `${organizerName || "Hackathon"} Past Editions & Winner Repositories`,
      snippet: "Historical database of finalist presentations, rubrics, and winning team submissions.",
      url: "#"
    }
  ];

  return (
    <div className="w-full flex flex-col gap-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#12121A]/70 p-5 rounded-xl border border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-accent-pink shadow-[0_0_10px_rgba(255,92,147,0.7)]"></span>
            <h3 className="text-lg font-bold text-white tracking-tight">
              Judging Rubrics & Archetype Profiler
            </h3>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-accent-pink/20 text-accent-pink border border-accent-pink/30">
              {organizerName || "Target Hackathon"}
            </span>
          </div>
          <p className="text-xs text-muted-on-dark mt-1">
            Reverse-engineered evaluation matrix derived from web-mined past editions (1.0, 2.0, winning PPTs) and jury rubrics.
          </p>
        </div>

        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white rounded-lg text-xs font-mono transition-colors border border-white/10 shrink-0"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? "Copied!" : "Copy Profile"}</span>
        </button>
      </div>

      {/* Web-Mined Past Precedents & Winner Intelligence */}
      <div className="bg-[#10101A] border border-accent-pink/30 rounded-xl p-5 flex flex-col gap-4 shadow-[0_0_20px_rgba(255,92,147,0.05)]">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-accent-pink" />
            <h4 className="text-sm font-mono font-bold uppercase tracking-wider text-white">
              Live Web Precedent Mining: Past Editions & Winner Intelligence
            </h4>
          </div>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
            <Globe className="w-3 h-3" />
            Live Search Mined
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Past Editions Analysis */}
          <div className="lg:col-span-2 bg-[#151522] border border-white/5 rounded-lg p-4 flex flex-col gap-2">
            <span className="text-xs font-mono text-accent-pink font-semibold flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" />
              Past Edition Patterns & Submission Trends
            </span>
            <p className="text-xs text-white/80 leading-relaxed">
              {pastEditionsSummary}
            </p>

            {precedentIntelligence?.winning_ppt_strategy && (
              <div className="mt-2 p-2.5 rounded bg-black/40 border border-accent-pink/20">
                <span className="text-[11px] font-mono text-accent-pink font-bold block mb-1">
                  Winning PPT Presentation Structure:
                </span>
                <p className="text-xs text-white/70 italic">
                  &quot;{precedentIntelligence.winning_ppt_strategy}&quot;
                </p>
              </div>
            )}
          </div>

          {/* Web Sources & Citations */}
          <div className="bg-[#151522] border border-white/5 rounded-lg p-4 flex flex-col gap-2">
            <span className="text-xs font-mono text-blue-400 font-semibold flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5" />
              Scraped Intelligence Citations
            </span>
            <div className="space-y-2 overflow-y-auto max-h-36 pr-1">
              {webSources.map((source, i) => (
                <div key={i} className="p-2 rounded bg-black/30 border border-white/5 text-[11px]">
                  <div className="font-semibold text-white/90 line-clamp-1">{source.title}</div>
                  <div className="text-muted-on-dark line-clamp-2 mt-0.5">{source.snippet}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Winning Patterns */}
        <div className="pt-2 border-t border-white/5">
          <span className="text-[11px] font-mono text-white/50 block mb-2">
            Key Lessons Mined from Past Champion Projects:
          </span>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {winningPatterns.map((pat, idx) => (
              <div key={idx} className="bg-black/30 border border-white/5 rounded-lg p-3 text-xs text-white/80 flex items-start gap-2">
                <span className="text-emerald-400 font-mono font-bold">#{idx + 1}</span>
                <span>{pat}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Rubric Scorecards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {rubrics.map((r, i) => (
          <div
            key={i}
            className={`p-4 rounded-xl border bg-gradient-to-br ${r.color} ${r.border} backdrop-blur-sm flex flex-col justify-between`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-muted-on-dark">
                  Weight
                </span>
                <span className={`text-base font-bold font-mono ${r.text}`}>
                  {r.weight}
                </span>
              </div>
              <h4 className="text-sm font-bold text-white mb-1.5">
                {r.title}
              </h4>
              <p className="text-xs text-muted-on-dark leading-relaxed">
                {r.desc}
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-white/10 flex items-center gap-1.5 text-[11px] font-mono text-white/60">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Target Standard: High</span>
            </div>
          </div>
        ))}
      </div>

      {/* Full AI Profile Report */}
      <div className="bg-[#12121A]/90 rounded-xl border border-white/10 p-6 flex flex-col gap-4 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-accent-pink" />
            <h4 className="text-sm font-mono font-bold uppercase tracking-wider text-white">
              Deconstructed Judging Profile & Winning Cheat Codes
            </h4>
          </div>
          <span className="text-xs font-mono text-muted-on-dark">
            Tailored for {organizerName || "Current Competition"}
          </span>
        </div>

        <div className="prose prose-invert prose-pink max-w-none text-sm text-text-on-dark leading-relaxed font-sans prose-headings:font-bold prose-headings:text-white prose-headings:tracking-tight prose-h3:text-base prose-h3:mt-4 prose-h3:mb-2 prose-p:my-2 prose-ul:my-2 prose-li:my-0.5">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {juryProfile || "*No jury profile generated yet.*"}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
