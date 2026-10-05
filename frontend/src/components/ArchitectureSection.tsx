"use client";

import React, { useState } from "react";
import { Sparkles, Send, Code, RefreshCw, Check, ExternalLink, ChevronDown, ChevronUp, Layers, Wand2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Mermaid from "@/components/Mermaid";
import { extractMermaidCode } from "@/utils/mermaidToXml";
import DrawioEditor from "@/components/DrawioEditor";

interface ArchitectureSectionProps {
  architecture: string;
  onUpdateArchitecture: (updated: string) => void;
  problemStatement?: string;
}

const QUICK_EDITS = [
  "Add Redis caching layer between API Gateway & DB",
  "Add Apache Kafka event bus for async workers",
  "Add OAuth2 / OIDC Auth service with rate limiting",
  "Add multi-region read replicas for PostgreSQL",
];

export default function ArchitectureSection({
  architecture,
  onUpdateArchitecture,
  problemStatement = "",
}: ArchitectureSectionProps) {
  const [instructions, setInstructions] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showCodeEditor, setShowCodeEditor] = useState(false);
  const [showDrawio, setShowDrawio] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // Extract Mermaid code
  const currentMermaid = extractMermaidCode(architecture);
  const [manualCode, setManualCode] = useState(currentMermaid);

  // Keep manual code in sync if external architecture changes
  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setManualCode(extractMermaidCode(architecture));
  }, [architecture]);

  // Handle AI Edit request
  const handleAiEdit = async (customInstruction?: string) => {
    const editPrompt = customInstruction || instructions;
    if (!editPrompt.trim() || loading) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch("http://localhost:8000/api/edit-architecture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          current_architecture: architecture,
          edit_instructions: editPrompt,
          problem_statement: problemStatement,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || "Failed to update architecture diagram.");
      }

      const data = await response.json();
      if (data.updated_architecture) {
        onUpdateArchitecture(data.updated_architecture);
        setInstructions("");
      }
    } catch (err: unknown) {
      console.error("Edit architecture error:", err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to edit architecture.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle manual code apply
  const handleApplyManualCode = () => {
    if (!manualCode.trim()) return;
    
    // Replace old mermaid code block in architecture text with the new manual code
    let updated = architecture;
    const mermaidRegex = /```(?:mermaid)?\s*[\s\S]*?(?:graph|flowchart)[\s\S]*?```/i;
    if (mermaidRegex.test(updated)) {
      updated = updated.replace(mermaidRegex, `\`\`\`mermaid\n${manualCode.trim()}\n\`\`\``);
    } else {
      updated = `\`\`\`mermaid\n${manualCode.trim()}\n\`\`\`\n\n` + updated;
    }

    onUpdateArchitecture(updated);
    setShowCodeEditor(false);
  };

  // Separate non-mermaid markdown content (analysis/tradeoffs)
  const analysisMarkdown = React.useMemo(() => {
    if (!architecture) return "";
    return architecture
      .replace(/```(?:mermaid)?\s*[\s\S]*?(?:graph|flowchart)[\s\S]*?```/i, "")
      .trim();
  }, [architecture]);

  return (
    <div id="architecture-diagram-section" className="w-full flex flex-col gap-6 pt-6 border-t border-white/10 animate-in fade-in duration-500 scroll-mt-24">
      {/* Header with AI Badge */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-accent-magenta shadow-[0_0_10px_rgba(192,43,214,0.8)]"></span>
            <h2 className="text-2xl font-bold tracking-tight text-white">System Architecture Diagram</h2>
            <span className="ml-2 px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-accent-magenta/20 text-accent-magenta border border-accent-magenta/30 flex items-center gap-1 font-semibold">
              <Sparkles className="w-3 h-3" />
              Drawn by AI
            </span>
          </div>
          <p className="text-[14px] text-muted-on-dark">
            Complete technical blueprint automatically drawn and mapped for your problem statement.
          </p>
        </div>

        {/* View toggles */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCodeEditor(!showCodeEditor)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-colors border ${
              showCodeEditor
                ? "bg-accent-pink/20 text-accent-pink border-accent-pink/40"
                : "bg-white/5 text-muted-on-dark hover:text-white border-white/10"
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>{showCodeEditor ? "Close Code" : "Tweak Code"}</span>
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
            <span>{showDrawio ? "Hide Draw.io" : "Draw.io Canvas"}</span>
          </button>
        </div>
      </div>

      {/* Manual Code Editor Drawer */}
      {showCodeEditor && (
        <div className="p-4 bg-[#12121A] rounded-xl border border-accent-pink/30 flex flex-col gap-3 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-accent-pink font-semibold">
              Direct Mermaid Flowchart Editor
            </span>
            <button
              onClick={handleApplyManualCode}
              className="px-3 py-1 bg-accent-pink text-black font-mono font-bold text-xs rounded hover:bg-white transition-colors"
            >
              Apply Changes
            </button>
          </div>
          <textarea
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            className="w-full h-44 bg-black/80 font-mono text-xs text-white/90 p-3 rounded-lg border border-white/10 focus:outline-none focus:border-accent-pink resize-y"
            placeholder="graph TD..."
          />
        </div>
      )}

      {/* THE MAIN ARCHITECTURE DIAGRAM (DRAWN BY AI) */}
      <div className="w-full">
        {currentMermaid ? (
          <Mermaid chart={currentMermaid} />
        ) : (
          <div className="p-12 text-center text-muted-on-dark bg-[#1A1520] rounded-xl border border-white/5">
            Drawing architecture diagram...
          </div>
        )}
      </div>

      {/* AI EDIT & REDRAW CONTROLS */}
      <div className="bg-gradient-to-r from-[#181524] to-[#12121A] p-5 rounded-2xl border border-white/10 shadow-lg flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wand2 className="w-4 h-4 text-accent-pink" />
            <h3 className="text-sm font-semibold text-white">Edit & Redraw Architecture with AI</h3>
          </div>
          <span className="text-[11px] font-mono text-muted-on-dark">
            Type changes $\to$ AI redraws diagram
          </span>
        </div>

        {/* Input Bar */}
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
            disabled={loading}
            placeholder="e.g. Add Redis cache between API Gateway & Postgres, switch message broker to Kafka..."
            className="flex-grow bg-[#0B0B10] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-accent-pink transition-colors disabled:opacity-50"
          />

          <button
            type="submit"
            disabled={loading || !instructions.trim()}
            className="px-6 py-3 bg-accent-pink hover:bg-white text-black font-mono font-bold text-xs uppercase tracking-wider rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shrink-0 shadow-[0_0_15px_rgba(255,92,147,0.3)]"
          >
            {loading ? (
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

        {/* Quick Suggestion Chips */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-mono text-white/40">Suggestions:</span>
          {QUICK_EDITS.map((suggestion, idx) => (
            <button
              key={idx}
              type="button"
              disabled={loading}
              onClick={() => handleAiEdit(suggestion)}
              className="text-[11px] font-mono px-2.5 py-1 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white rounded-lg border border-white/10 transition-colors disabled:opacity-50"
            >
              + {suggestion}
            </button>
          ))}
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs">
            {error}
          </div>
        )}
      </div>

      {/* Optional Draw.io Studio Drawer */}
      {showDrawio && (
        <div className="animate-in fade-in duration-300">
          <DrawioEditor architectureText={architecture} />
        </div>
      )}

      {/* Architecture Blueprint Written Analysis (Collapsible) */}
      {analysisMarkdown && (
        <div className="bg-[#1A1520]/80 rounded-xl border border-white/5 overflow-hidden">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="w-full flex items-center justify-between p-4 text-left font-semibold text-sm text-white/90 hover:text-white hover:bg-white/5 transition-colors"
          >
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-accent-pink"></span>
              Technical Stack & Architectural Analysis
            </span>
            {showDetails ? <ChevronUp className="w-4 h-4 text-white/60" /> : <ChevronDown className="w-4 h-4 text-white/60" />}
          </button>

          {showDetails && (
            <div className="p-6 border-t border-white/5 text-[14px] leading-relaxed text-muted-on-dark markdown-content">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {analysisMarkdown}
              </ReactMarkdown>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
