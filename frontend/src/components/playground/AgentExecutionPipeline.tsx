"use client";

import React from "react";
import { Check, Clock, AlertCircle, Loader2 } from "lucide-react";
import { Logo } from "@/components/Logo";

export interface TraceStep {
  agent: string;
  name: string;
  status: "idle" | "running" | "completed" | "error";
  duration_ms?: number;
  details?: string;
}

interface AgentExecutionPipelineProps {
  trace: TraceStep[];
  loading: boolean;
  totalTimeMs?: number;
}

export default function AgentExecutionPipeline({
  trace,
  loading,
  totalTimeMs,
}: AgentExecutionPipelineProps) {
  const defaultSteps: TraceStep[] = [
    {
      agent: "scraper",
      name: "Precedent & Web Miner",
      status: loading ? "running" : "idle",
      details: "Mining past editions (1.0, 2.0, winning PPTs)",
    },
    {
      agent: "profiler",
      name: "Jury Profiler & Rubrics",
      status: "idle",
      details: "Profiling judging rubric & scoring criteria",
    },
    {
      agent: "feasibility",
      name: "Trade-off & Feasibility",
      status: "idle",
      details: "Analyzing 'Why THIS vs Why NOT THAT' & MVP fit",
    },
    {
      agent: "blueprint",
      name: "Enterprise Architect",
      status: "idle",
      details: "Synthesizing Mermaid flowchart & tech stack",
    },
    {
      agent: "pitch",
      name: "Pitch & Jury Defense",
      status: "idle",
      details: "Engineering slide deck & jury cross-examination Q&A",
    },
  ];

  const stepsToDisplay = trace.length > 0 ? trace : defaultSteps;

  return (
    <div className="w-full bg-[#0D0D14]/90 border border-white/10 rounded-2xl p-4 sm:p-5 shadow-lg backdrop-blur-md">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-accent-pink shadow-[0_0_10px_rgba(255,92,147,0.7)]"></span>
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
            5-Agent Specialized Swarm Trace
          </h3>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/5 text-white/60 border border-white/10">
            LangGraph + Live Web Intelligence
          </span>
        </div>

        {totalTimeMs && !loading && (
          <div className="flex items-center gap-1.5 text-xs font-mono text-emerald-400">
            <Check className="w-3.5 h-3.5" />
            <span>Completed in {(totalTimeMs / 1000).toFixed(2)}s</span>
          </div>
        )}

        {loading && (
          <div className="flex items-center gap-1.5 text-xs font-mono text-accent-pink">
            <Logo size={20} className="w-5 h-5" loading={true} />
            <span className="animate-pulse">Swarm Active...</span>
          </div>
        )}
      </div>

      {/* Pipeline Grid (5 columns on desktop) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 relative">
        {stepsToDisplay.map((step, idx) => {
          const isCompleted = step.status === "completed";
          const isRunning = step.status === "running";
          const isError = step.status === "error";

          return (
            <div
              key={step.agent || idx}
              className={`relative p-3.5 rounded-xl border transition-all duration-300 flex flex-col justify-between ${
                isRunning
                  ? "bg-accent-pink/10 border-accent-pink shadow-[0_0_15px_rgba(255,92,147,0.2)] animate-pulse"
                  : isCompleted
                  ? "bg-[#141420] border-emerald-500/30"
                  : isError
                  ? "bg-red-500/10 border-red-500/30"
                  : "bg-[#101018] border-white/5 opacity-60"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-white/50">
                    Agent 0{idx + 1}
                  </span>
                  {isCompleted && (
                    <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                      <Check className="w-3 h-3" />
                      {step.duration_ms ? `${step.duration_ms}ms` : "Done"}
                    </span>
                  )}
                  {isRunning && (
                    <span className="flex items-center gap-1 text-[10px] font-mono text-accent-pink bg-accent-pink/10 px-1.5 py-0.5 rounded border border-accent-pink/20 animate-pulse">
                      <Clock className="w-3 h-3 animate-spin" />
                      Active
                    </span>
                  )}
                  {isError && (
                    <span className="flex items-center gap-1 text-[10px] font-mono text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/20">
                      <AlertCircle className="w-3 h-3" />
                      Fail
                    </span>
                  )}
                  {step.status === "idle" && (
                    <span className="text-[10px] font-mono text-white/30">
                      Standby
                    </span>
                  )}
                </div>

                <h4 className="text-xs font-bold text-white mb-1 tracking-tight">
                  {step.name}
                </h4>

                <p className="text-[11px] text-muted-on-dark leading-relaxed line-clamp-2">
                  {step.details || "Awaiting task dispatch..."}
                </p>
              </div>

              {/* Progress Bar Line */}
              <div className="mt-3 w-full bg-white/5 h-1 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    isCompleted
                      ? "w-full bg-emerald-400"
                      : isRunning
                      ? "w-1/2 bg-accent-pink animate-pulse"
                      : "w-0"
                  }`}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
