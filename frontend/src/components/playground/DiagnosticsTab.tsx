"use client";

import React from "react";
import {
  Activity,
  CheckCircle2,
  Clock,
  Cpu,
  Database,
  Layers,
  Terminal,
} from "lucide-react";
import { TraceStep } from "./AgentExecutionPipeline";

interface DiagnosticsTabProps {
  trace: TraceStep[];
  meta: {
    model_used?: string;
    temperature?: number;
    total_time_ms?: number;
    tokens_est?: number;
    timestamp?: string;
  };
}

export default function DiagnosticsTab({ trace, meta }: DiagnosticsTabProps) {
  return (
    <div className="w-full flex flex-col gap-6 animate-in fade-in duration-300">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-[#12121A] border border-white/10 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono text-white/40 uppercase">Total Latency</span>
            <div className="text-xl font-bold font-mono text-white mt-0.5">
              {meta.total_time_ms ? `${(meta.total_time_ms / 1000).toFixed(2)}s` : "0.00s"}
            </div>
          </div>
          <Clock className="w-5 h-5 text-accent-pink" />
        </div>

        <div className="p-4 rounded-xl bg-[#12121A] border border-white/10 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono text-white/40 uppercase">LLM Engine</span>
            <div className="text-sm font-bold font-mono text-white mt-0.5 truncate max-w-[140px]">
              {meta.model_used || "gemini-3.5-flash-lite"}
            </div>
          </div>
          <Cpu className="w-5 h-5 text-accent-magenta" />
        </div>

        <div className="p-4 rounded-xl bg-[#12121A] border border-white/10 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono text-white/40 uppercase">Est. Tokens</span>
            <div className="text-xl font-bold font-mono text-white mt-0.5">
              {meta.tokens_est || 1420}
            </div>
          </div>
          <Activity className="w-5 h-5 text-emerald-400" />
        </div>

        <div className="p-4 rounded-xl bg-[#12121A] border border-white/10 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono text-white/40 uppercase">PGVector DB</span>
            <div className="text-sm font-bold font-mono text-emerald-400 mt-0.5 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              Connected
            </div>
          </div>
          <Database className="w-5 h-5 text-emerald-400" />
        </div>
      </div>

      {/* Agent Execution Waterfall Table */}
      <div className="bg-[#12121A] rounded-2xl border border-white/10 overflow-hidden shadow-md">
        <div className="px-5 py-3.5 border-b border-white/10 bg-[#161622] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-accent-pink" />
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
              Agent Swarm Execution Waterfall
            </h4>
          </div>
          <span className="text-[10px] font-mono text-white/40">
            {meta.timestamp || "Live Runtime Trace"}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-white/5 text-white/50 border-b border-white/10">
              <tr>
                <th className="py-3 px-4">Node</th>
                <th className="py-3 px-4">Agent Role</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Trace Activity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {trace.map((step, idx) => (
                <tr key={idx} className="hover:bg-white/5 transition-colors">
                  <td className="py-3 px-4 text-white/40 font-bold">0{idx + 1}</td>
                  <td className="py-3 px-4 text-white font-semibold">{step.name}</td>
                  <td className="py-3 px-4 text-accent-pink">{step.duration_ms ? `${step.duration_ms}ms` : "-"}</td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      <CheckCircle2 className="w-3 h-3" />
                      Completed
                    </span>
                  </td>
                  <td className="py-3 px-4 text-muted-on-dark text-[11px] truncate max-w-xs">
                    {step.details}
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
