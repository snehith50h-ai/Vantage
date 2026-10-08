"use client";

import React, { useState } from "react";
import {
  Sparkles,
  Wand2,
  Code2,
  Layers,
  RefreshCw,
  Check,
  ChevronDown,
  ChevronUp,
  FileCode,
  ExternalLink,
} from "lucide-react";
import Mermaid from "@/components/Mermaid";
import DrawioEditor from "@/components/DrawioEditor";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { extractMermaidCode } from "@/utils/mermaidToXml";
import { apiFetch } from "@/lib/api";

interface ArchitectureStudioTabProps {
  architecture: string;
  onUpdateArchitecture: (updated: string) => void;
  problemStatement: string;
  selectedModel: string;
}

const QUICK_ACTIONS = [
  "Add Redis Distributed Cache for Hot Queries",
  "Add Apache Kafka Event Bus for Async Processing",
  "Add OAuth2 / OIDC Auth Provider with Rate Limiting",
  "Add PostgreSQL Multi-Region Read Replicas",
  "Add Cloudflare Edge Worker & CDN Ingress",
  "Add Prometheus & Grafana Telemetry Sidecars",
];

export default function ArchitectureStudioTab({
  architecture,
  onUpdateArchitecture,
  problemStatement,
  selectedModel,
}: ArchitectureStudioTabProps) {
  const [instructions, setInstructions] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState("");
  const [showCodeDrawer, setShowCodeDrawer] = useState(false);
  const [showDrawio, setShowDrawio] = useState(false);
  const [showTechDetails, setShowTechDetails] = useState(true);

  const currentMermaid = extractMermaidCode(architecture);
  const [manualCode, setManualCode] = useState(currentMermaid);

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setManualCode(extractMermaidCode(architecture));
  }, [architecture]);

  const handleAiEdit = async (customInstruction?: string) => {
    const promptToUse = customInstruction || instructions;
    if (!promptToUse.trim() || isEditing) return;

    setIsEditing(true);
    setError("");

    try {
      const response = await apiFetch("/api/edit-architecture", {
        method: "POST",
        body: JSON.stringify({
          current_architecture: architecture,
          edit_instructions: promptToUse,
          problem_statement: problemStatement,
          model: selectedModel,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to edit architecture.");
      }

      const data = await response.json();
      if (data.updated_architecture) {
        onUpdateArchitecture(data.updated_architecture);
        setInstructions("");
      }
    } catch (err: unknown) {
      console.error(err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to edit architecture.");
      }
    } finally {
      setIsEditing(false);
    }
  };

  const handleApplyManualCode = () => {
    if (!manualCode.trim()) return;

    let updated = architecture;
    const mermaidRegex = /```(?:mermaid)?\s*[\s\S]*?(?:graph|flowchart)[\s\S]*?```/i;
    if (mermaidRegex.test(updated)) {
      updated = updated.replace(mermaidRegex, `\`\`\`mermaid\n${manualCode.trim()}\n\`\`\``);
    } else {
      updated = `\`\`\`mermaid\n${manualCode.trim()}\n\`\`\`\n\n` + updated;
    }

    onUpdateArchitecture(updated);
    setShowCodeDrawer(false);
  };

  // Separate non-mermaid markdown content
  const nonMermaidContent = React.useMemo(() => {
    if (!architecture) return "";
    return architecture
      .replace(/```(?:mermaid)?\s*[\s\S]*?(?:graph|flowchart)[\s\S]*?```/i, "")
      .trim();
  }, [architecture]);

  return (
    <div className="w-full flex flex-col gap-6 animate-in fade-in duration-300">
      {/* Top Controls & Toggles */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#12121A]/70 p-4 rounded-xl border border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-accent-magenta shadow-[0_0_10px_rgba(192,43,214,0.7)]"></span>
            <h3 className="text-lg font-bold text-white tracking-tight">
              Enterprise System Topology
            </h3>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-accent-magenta/20 text-accent-magenta border border-accent-magenta/30 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              AI Drawn
            </span>
          </div>
          <p className="text-xs text-muted-on-dark mt-0.5">
            Decoupled multi-tier microservices blueprint with data flow directions and network protocols.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCodeDrawer(!showCodeDrawer)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-colors border ${
              showCodeDrawer
                ? "bg-accent-pink/20 text-accent-pink border-accent-pink/40"
                : "bg-white/5 text-muted-on-dark hover:text-white border-white/10"
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>{showCodeDrawer ? "Hide Code" : "Tweak Mermaid"}</span>
          </button>

          <button
            onClick={() => setShowDrawio(!showDrawio)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-colors border ${
              showDrawio
                ? "bg-[#F08705]/20 text-[#F08705] border-[#F08705]/40"
                : "bg-white/5 text-muted-on-dark hover:text-white border-white/10"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{showDrawio ? "Hide Draw.io" : "Draw.io Studio"}</span>
          </button>
        </div>
      </div>

      {/* Manual Mermaid Editor Drawer */}
      {showCodeDrawer && (
        <div className="p-4 bg-[#0A0A10] rounded-xl border border-accent-pink/30 flex flex-col gap-3 shadow-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-accent-pink font-semibold flex items-center gap-1.5">
              <FileCode className="w-3.5 h-3.5" />
              Direct Mermaid Syntax Editor
            </span>
            <button
              onClick={handleApplyManualCode}
              className="px-3 py-1 bg-accent-pink hover:bg-white text-black font-mono font-bold text-xs rounded transition-colors"
            >
              Apply Changes
            </button>
          </div>
          <textarea
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            className="w-full h-48 bg-black font-mono text-xs text-white/90 p-3 rounded-lg border border-white/10 focus:outline-none focus:border-accent-pink resize-y"
            placeholder="graph TD..."
          />
        </div>
      )}

      {/* Mermaid Diagram Viewer */}
      <div className="w-full">
        {currentMermaid ? (
          <Mermaid chart={currentMermaid} />
        ) : (
          <div className="p-16 text-center text-muted-on-dark bg-[#12121A]/50 rounded-2xl border border-white/5 font-mono text-xs">
            No architecture diagram generated yet. Click &quot;Run&quot; above to synthesize blueprint.
          </div>
        )}
      </div>

      {/* AI Architecture Co-Pilot (Edit & Redraw) */}
      <div className="bg-gradient-to-r from-[#181524] to-[#111118] p-5 rounded-2xl border border-white/10 shadow-xl flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wand2 className="w-4 h-4 text-accent-pink" />
            <h4 className="text-sm font-semibold text-white">AI Architecture Co-Pilot</h4>
          </div>
          <span className="text-[11px] font-mono text-muted-on-dark hidden sm:inline">
            Describe edits ➔ AI re-architects & redraws flowchart
          </span>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAiEdit();
          }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <input
            type="text"
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            disabled={isEditing}
            placeholder="e.g. Add Redis cache between API Gateway & Postgres, switch message broker to Kafka..."
            className="flex-grow bg-[#0B0B10] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-accent-pink transition-colors disabled:opacity-50"
          />

          <button
            type="submit"
            disabled={isEditing || !instructions.trim()}
            className="px-6 py-3 bg-accent-pink hover:bg-white text-black font-mono font-bold text-xs uppercase tracking-wider rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shrink-0 shadow-[0_0_15px_rgba(255,92,147,0.3)]"
          >
            {isEditing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Redrawing...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Update Diagram</span>
              </>
            )}
          </button>
        </form>

        {/* Quick Action Chips */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-mono text-white/40">Quick Injections:</span>
          {QUICK_ACTIONS.map((action, idx) => (
            <button
              key={idx}
              type="button"
              disabled={isEditing}
              onClick={() => handleAiEdit(action)}
              className="text-[11px] font-mono px-2.5 py-1 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white rounded-lg border border-white/10 transition-colors disabled:opacity-50"
            >
              + {action}
            </button>
          ))}
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs">
            {error}
          </div>
        )}
      </div>

      {/* Draw.io Canvas (Optional View) */}
      {showDrawio && (
        <div className="animate-in fade-in duration-300">
          <DrawioEditor chart={currentMermaid} />
        </div>
      )}

      {/* Technology Stack & Comparative Tradeoffs */}
      {nonMermaidContent && (
        <div className="bg-[#12121A]/80 rounded-2xl border border-white/10 overflow-hidden shadow-md">
          <button
            onClick={() => setShowTechDetails(!showTechDetails)}
            className="w-full flex items-center justify-between p-4 text-left font-semibold text-sm text-white hover:bg-white/5 transition-colors border-b border-white/5"
          >
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-accent-pink"></span>
              <span>Technology Stack & Comparative Architectural Rationale</span>
            </div>
            {showTechDetails ? (
              <ChevronUp className="w-4 h-4 text-white/60" />
            ) : (
              <ChevronDown className="w-4 h-4 text-white/60" />
            )}
          </button>

          {showTechDetails && (
            <div className="p-6 text-[14px] leading-relaxed text-muted-on-dark markdown-content">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {nonMermaidContent}
              </ReactMarkdown>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
