"use client";

import React, { useState } from "react";
import {
  Scale,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  Zap,
  DollarSign,
  Clock,
  Layers,
  Sparkles,
  ArrowRight,
  HelpCircle,
  Copy,
  Check
} from "lucide-react";

interface FeatureIncluded {
  feature: string;
  why_chosen: string;
  rubric_alignment: string;
}

interface FeatureExcluded {
  feature: string;
  why_rejected: string;
  risk_avoided: string;
}

interface TechTradeoff {
  layer: string;
  chosen: string;
  alternative: string;
  tradeoff_rationale: string;
}

interface FeasibilityData {
  technical_feasibility?: {
    score: number;
    summary: string;
    key_enablers: string[];
  };
  economic_viability?: {
    score: number;
    summary: string;
    unit_cost_estimate?: string;
  };
  sprint_mvp_fit?: {
    score: number;
    mvp_focus: string;
    simulated_elements: string;
  };
  why_this_feature?: FeatureIncluded[];
  why_not_that_feature?: FeatureExcluded[];
  tech_tradeoffs?: TechTradeoff[];
}

interface TradeoffsFeasibilityTabProps {
  feasibilityData?: FeasibilityData;
  organizerName: string;
}

export default function TradeoffsFeasibilityTab({
  feasibilityData,
  organizerName,
}: TradeoffsFeasibilityTabProps) {
  const [copied, setCopied] = useState(false);

  // Fallbacks if data is not populated yet
  const techScore = feasibilityData?.technical_feasibility?.score ?? 93;
  const econScore = feasibilityData?.economic_viability?.score ?? 90;
  const sprintScore = feasibilityData?.sprint_mvp_fit?.score ?? 95;

  const whyThisList = feasibilityData?.why_this_feature || [
    {
      feature: "Sub-Second Emergency Early Warning Trigger",
      why_chosen: "Judges prioritize verifiable real-time safety alarms over theoretical analytics.",
      rubric_alignment: "Fulfills 30% weighting on Real-World Impact & Reliability."
    },
    {
      feature: "Offline Mesh Protocol Synchronization",
      why_chosen: "Prevents embarrassing demo crashes when hackathon venue WiFi drops.",
      rubric_alignment: "Meets strict Fault-Tolerance and Field Usability criteria."
    },
    {
      feature: "Interactive Geospatial Hazard Heatmap",
      why_chosen: "Hooks the jury in the first 15 seconds of the demo with immediate visual proof.",
      rubric_alignment: "Maximizes Innovation & Presentation Clarity scoring."
    }
  ];

  const whyNotThatList = feasibilityData?.why_not_that_feature || [
    {
      feature: "Proprietary Satellite Radar SAR Ingestion",
      why_rejected: "48-hour API data lag and paid enterprise auth tokens ruin live hackathon demo credibility.",
      risk_avoided: "Third-party network timeout and API rate limit failure during live judging."
    },
    {
      feature: "Blockchain / Web3 Ledger for Sensor Records",
      why_rejected: "Adds massive transaction latency and gas fee overhead without solving the physical safety problem.",
      risk_avoided: "Severe jury penalties for vanity technology bloat."
    },
    {
      feature: "Separate Native iOS & Android Apps from Scratch",
      why_rejected: "Diverts limited 36-hour hackathon coding bandwidth into compilation and simulator debugging.",
      risk_avoided: "Incomplete codebases and mobile simulator crashes during presentation."
    }
  ];

  const tradeoffsList = feasibilityData?.tech_tradeoffs || [
    {
      layer: "Frontend & Dashboard",
      chosen: "Next.js 15 + WebGL Canvas",
      alternative: "Create React App / Plain React",
      tradeoff_rationale: "Next.js provides instant server-side rendering while WebGL smoothly renders 10,000+ spatial data vectors without frame drops."
    },
    {
      layer: "Backend API & Processing",
      chosen: "FastAPI (Python 3.12)",
      alternative: "Node.js / Express.js",
      tradeoff_rationale: "FastAPI provides native asynchronous I/O and zero-overhead interop with scientific Python/PyTorch inference engines."
    },
    {
      layer: "Event Buffer & Streaming",
      chosen: "Apache Kafka / Redis Streams",
      alternative: "Direct REST HTTP Webhooks",
      tradeoff_rationale: "Guarantees zero telemetry packet loss by spooling events locally during underground or network disconnects."
    },
    {
      layer: "Persistence Layer",
      chosen: "PostgreSQL + TimescaleDB",
      alternative: "MongoDB / Document DB",
      tradeoff_rationale: "90% hypertable time-series data compression with native spatial SQL queries outclasses unindexed document lookups."
    },
    {
      layer: "Edge Telemetry Protocol",
      chosen: "MQTT / gRPC over TLS",
      alternative: "JSON over HTTP/1.1",
      tradeoff_rationale: "2-byte MQTT packet header vs 800-byte HTTP header saves 95% bandwidth in low-connectivity environments."
    }
  ];

  const handleCopy = () => {
    const text = `## Trade-off Matrix & Feasibility for ${organizerName}\n\n### Why THIS Feature:\n${whyThisList.map(f => `- ${f.feature}: ${f.why_chosen}`).join('\n')}\n\n### Why NOT THAT Feature:\n${whyNotThatList.map(f => `- Cut ${f.feature}: ${f.why_rejected}`).join('\n')}\n\n### Tech Stack Tradeoffs:\n${tradeoffsList.map(t => `- ${t.layer}: Chose ${t.chosen} over ${t.alternative} (${t.tradeoff_rationale})`).join('\n')}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full flex flex-col gap-6 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#12121A]/70 p-5 rounded-xl border border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-accent-pink shadow-[0_0_10px_rgba(255,92,147,0.7)]"></span>
            <h3 className="text-lg font-bold text-white tracking-tight">
              Trade-off Matrix & Feasibility Intelligence
            </h3>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-accent-pink/20 text-accent-pink border border-accent-pink/30">
              Why THIS vs Why NOT THAT
            </span>
          </div>
          <p className="text-xs text-muted-on-dark mt-1">
            Judges penalize generic choices. Here is the explicit mathematical and strategic justification for why each feature and technology was selected over alternatives.
          </p>
        </div>

        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white rounded-lg text-xs font-mono transition-colors border border-white/10 shrink-0"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? "Copied!" : "Copy Matrix"}</span>
        </button>
      </div>

      {/* 3 Feasibility & Viability Scorecards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Technical Feasibility */}
        <div className="bg-[#141420] border border-blue-500/30 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono text-blue-400 flex items-center gap-1.5 font-bold uppercase tracking-wider">
                <Zap className="w-4 h-4 text-blue-400" />
                Technical Feasibility
              </span>
              <span className="text-sm font-mono font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                {techScore}%
              </span>
            </div>
            <p className="text-xs text-white/80 leading-relaxed mb-3">
              {feasibilityData?.technical_feasibility?.summary || "Decoupled edge-to-cloud architecture allows offline execution with sub-second alert triggers."}
            </p>
          </div>
          <div className="pt-2 border-t border-white/5">
            <span className="text-[11px] font-mono text-white/50 block mb-1">Key Enablers:</span>
            <ul className="text-[11px] text-white/70 space-y-1">
              {(feasibilityData?.technical_feasibility?.key_enablers || [
                "Local sensor flash buffer prevents packet drops",
                "Lightweight pre-compiled edge tensor inference"
              ]).map((e, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="text-blue-400 mt-0.5">•</span>
                  <span>{e}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Economic & Field Viability */}
        <div className="bg-[#141420] border border-emerald-500/30 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono text-emerald-400 flex items-center gap-1.5 font-bold uppercase tracking-wider">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                Economic Viability
              </span>
              <span className="text-sm font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {econScore}%
              </span>
            </div>
            <p className="text-xs text-white/80 leading-relaxed mb-3">
              {feasibilityData?.economic_viability?.summary || "Drives down installation and operational expenditure by >85% compared to industrial laser radars."}
            </p>
          </div>
          <div className="pt-2 border-t border-white/5">
            <span className="text-[11px] font-mono text-white/50 block mb-1">Target Bill of Materials:</span>
            <span className="inline-block text-xs font-mono font-bold px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              {feasibilityData?.economic_viability?.unit_cost_estimate || "Under ₹14,500 / autonomous node"}
            </span>
          </div>
        </div>

        {/* 24-36h Sprint MVP Fit */}
        <div className="bg-[#141420] border border-purple-500/30 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono text-purple-400 flex items-center gap-1.5 font-bold uppercase tracking-wider">
                <Clock className="w-4 h-4 text-purple-400" />
                24-36h Sprint MVP Fit
              </span>
              <span className="text-sm font-mono font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                {sprintScore}%
              </span>
            </div>
            <p className="text-xs text-white/80 leading-relaxed mb-3">
              <span className="text-white font-semibold">Live Demo Scope: </span>
              {feasibilityData?.sprint_mvp_fit?.mvp_focus || "End-to-end telemetry streaming from sensor node into real-time heatmap alert dashboard."}
            </p>
          </div>
          <div className="pt-2 border-t border-white/5">
            <span className="text-[11px] font-mono text-white/50 block mb-1">Smart Simulated Layer:</span>
            <span className="text-xs text-purple-200/80 italic">
              {feasibilityData?.sprint_mvp_fit?.simulated_elements || "Multi-node hardware sensor mesh simulated via real-time WebSocket script for 0% presentation hardware risk."}
            </span>
          </div>
        </div>
      </div>

      {/* Feature Selection Rationale: Why THIS vs Why NOT THAT */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Scale className="w-4 h-4 text-accent-pink" />
          <h4 className="text-sm font-mono font-bold uppercase tracking-wider text-white">
            Feature Selection Matrix: Why THIS vs Why NOT THAT
          </h4>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Column 1: Features to INCLUDE */}
          <div className="bg-[#0F1018] border border-emerald-500/30 rounded-xl p-4 flex flex-col gap-3">
            <div className="flex items-center gap-2 pb-2 border-b border-emerald-500/20">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <h5 className="text-xs font-mono font-bold uppercase text-emerald-300">
                Features INCLUDED (High Impact, High Rubric Score)
              </h5>
            </div>

            <div className="space-y-3">
              {whyThisList.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-[#141522] border border-emerald-500/20 rounded-lg p-3 hover:border-emerald-500/40 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                      {item.feature}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                      Must Have
                    </span>
                  </div>
                  <p className="text-xs text-white/80 mb-2 leading-relaxed">
                    <strong className="text-emerald-400">Why Chosen:</strong> {item.why_chosen}
                  </p>
                  <div className="text-[11px] font-mono text-white/50 bg-black/30 p-1.5 rounded border border-white/5">
                    <span className="text-emerald-300">Rubric Fit: </span>
                    {item.rubric_alignment}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Column 2: Features to CUT / DEFER */}
          <div className="bg-[#0F1018] border border-rose-500/30 rounded-xl p-4 flex flex-col gap-3">
            <div className="flex items-center gap-2 pb-2 border-b border-rose-500/20">
              <XCircle className="w-4 h-4 text-rose-400" />
              <h5 className="text-xs font-mono font-bold uppercase text-rose-300">
                Features CUT / DEFERRED (Vanity Bloat & Demo Crash Risks)
              </h5>
            </div>

            <div className="space-y-3">
              {whyNotThatList.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-[#141522] border border-rose-500/20 rounded-lg p-3 hover:border-rose-500/40 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5 line-through opacity-80">
                      <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                      {item.feature}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/30">
                      Discarded
                    </span>
                  </div>
                  <p className="text-xs text-white/80 mb-2 leading-relaxed">
                    <strong className="text-rose-400">Why Rejected:</strong> {item.why_rejected}
                  </p>
                  <div className="text-[11px] font-mono text-white/50 bg-black/30 p-1.5 rounded border border-white/5">
                    <span className="text-rose-300">Risk Averted: </span>
                    {item.risk_avoided}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Comparative Technology Stack Matrix ("Why X instead of Y") */}
      <div className="bg-[#12121A]/80 border border-white/10 rounded-xl p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-400" />
            <h4 className="text-sm font-mono font-bold uppercase tracking-wider text-white">
              Comparative Tech Stack Trade-offs: &quot;Why X over Y&quot;
            </h4>
          </div>
          <span className="text-[11px] font-mono text-muted-on-dark">
            Direct Jury Defense Rationale
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-[11px] font-mono uppercase text-muted-on-dark">
                <th className="py-2.5 px-3">System Subsystem</th>
                <th className="py-2.5 px-3">Chosen Technology</th>
                <th className="py-2.5 px-3">Discarded Alternative</th>
                <th className="py-2.5 px-3">Architectural Rationale & Trade-off</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs">
              {tradeoffsList.map((row, idx) => (
                <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3 px-3 font-semibold text-white/90 whitespace-nowrap">
                    {row.layer}
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 font-mono text-[11px]">
                      <Check className="w-3 h-3 text-emerald-400" />
                      {row.chosen}
                    </span>
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-rose-500/10 text-rose-300/80 border border-rose-500/20 font-mono text-[11px] line-through">
                      {row.alternative}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-white/80 leading-relaxed">
                    {row.tradeoff_rationale}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
