"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import mermaid from "mermaid";
import { Copy, Check, Download, ZoomIn, ZoomOut, RotateCcw, AlertTriangle, RefreshCw } from "lucide-react";

mermaid.initialize({
  startOnLoad: false,
  theme: "dark",
  securityLevel: "loose",
  themeVariables: {
    darkMode: true,
    background: "#0B0B10",
    primaryColor: "#1E1B2E",
    primaryBorderColor: "#C026D3",
    primaryTextColor: "#FFFFFF",
    lineColor: "#A855F7",
    secondaryColor: "#1E1B2E",
    tertiaryColor: "#151520",
    fontFamily: "var(--font-mono, monospace)",
    fontSize: "13px",
  },
});

/**
 * Intelligent sanitization for Mermaid charts produced by LLMs.
 * Fixes unescaped ampersands, subgraphs with spaces, unquoted labels with parens/brackets,
 * and malformed style statements that would otherwise crash Mermaid parser.
 */
export function sanitizeMermaid(raw: string): string {
  if (!raw) return "";
  let clean = raw.trim();

  // Strip code block backticks if present
  clean = clean.replace(/^```(?:mermaid)?\s*/i, "").replace(/\s*```$/i, "").trim();

  // Ensure it has a diagram definition prefix
  if (
    !/^(graph|flowchart|sequenceDiagram|classDiagram|stateDiagram|erDiagram|journey|gantt|pie|gitGraph|mindmap|timeline)/i.test(
      clean
    )
  ) {
    clean = "graph TD\n" + clean;
  }

  const lines = clean.split("\n");
  const processedLines: string[] = [];
  let subgraphIdx = 0;

  for (let line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Fix 1: subgraphs with spaces or ampersands like "subgraph Security & Ingestion"
    // Convert to valid Mermaid: subgraph sg_1 ["Security & Ingestion"]
    const subMatch = trimmed.match(/^subgraph\s+([^"\[\]\n]+)$/i);
    if (subMatch) {
      const rawTitle = subMatch[1].trim();
      if (/[\s&/\\()-]/.test(rawTitle)) {
        subgraphIdx++;
        const safeId = `sg_${subgraphIdx}_` + rawTitle.toLowerCase().replace(/[^a-z0-9]/g, "_").slice(0, 15);
        processedLines.push(`  subgraph ${safeId} ["${rawTitle.replace(/"/g, "'")}"]`);
        continue;
      }
    }

    // Fix 2: style directives with spaces or ampersands like "style Security & Ingestion fill:#bbf"
    // Mermaid style statement only accepts a single identifier or list of IDs without spaces/ampersands.
    if (/^style\s+/i.test(trimmed)) {
      const parts = trimmed.split(/\s+/);
      const target = parts[1] || "";
      // If target contains '&' or spaces or special punctuation, it is invalid syntax: drop it safely
      if (/[\s&/\\()]/.test(target) || trimmed.includes(" & ")) {
        continue; // drop broken style statement
      }
    }

    // Fix 3: Labels inside square brackets with unquoted parens, brackets, or ampersands: A[Text (detail)] -> A["Text (detail)"]
    line = line.replace(/\[([^"\]\n]*[\(\)&/][^"\]\n]*)\]/g, '["$1"]');

    // Fix 4: Edge labels with special characters: -->|Text with & or ()| -> -->|"Text with & or ()"|
    line = line.replace(/-->\|([^"\|\n]*[\(\)&/][^"\|\n]*)\|/g, '-->|"$1"|');

    processedLines.push(line);
  }

  return processedLines.join("\n");
}

/**
 * Aggressive fallback sanitizer for diagrams that still fail the first pass.
 * Strips all style, class, classDef directives and simplifies labels.
 */
function emergencySanitizeMermaid(raw: string): string {
  let clean = sanitizeMermaid(raw);
  const lines = clean.split("\n");
  const fallbackLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    // Drop all styling/theming lines that often cause parse errors
    if (/^(style|classDef|class|linkStyle|click)\s+/i.test(trimmed)) {
      continue;
    }
    // Simplify edge labels
    const simplifiedLine = line.replace(/-->\|.*?\|/g, "-->");
    fallbackLines.push(simplifiedLine);
  }

  return fallbackLines.join("\n");
}

export default function Mermaid({ chart }: { chart: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  const renderChart = useCallback(async (chartCode: string, isFallback = false) => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = "";
    setError(null);

    const uniqueId = `mermaid-${Math.random().toString(36).substring(2, 9)}`;

    try {
      const { svg } = await mermaid.render(uniqueId, chartCode);
      if (containerRef.current) {
        containerRef.current.innerHTML = svg;
        const svgEl = containerRef.current.querySelector("svg");
        if (svgEl) {
          svgEl.style.maxWidth = "100%";
          svgEl.style.height = "auto";
          svgEl.style.display = "block";
          svgEl.style.margin = "0 auto";
        }
      }
      setError(null);
    } catch (err: unknown) {
      console.warn("Mermaid primary render failed:", err);
      if (!isFallback) {
        // Attempt recovery pass
        const emergencyCode = emergencySanitizeMermaid(chartCode);
        try {
          const fallbackId = `mermaid-fb-${Math.random().toString(36).substring(2, 9)}`;
          const { svg } = await mermaid.render(fallbackId, emergencyCode);
          if (containerRef.current) {
            containerRef.current.innerHTML = svg;
            const svgEl = containerRef.current.querySelector("svg");
            if (svgEl) {
              svgEl.style.maxWidth = "100%";
              svgEl.style.height = "auto";
              svgEl.style.display = "block";
              svgEl.style.margin = "0 auto";
            }
          }
          setError(null);
          return;
        } catch (fallbackErr: unknown) {
          console.error("Mermaid fallback render also failed:", fallbackErr);
        }
      }

      const msg = err instanceof Error ? err.message : "Mermaid syntax error";
      setError(msg);
    }
  }, []);

  const cleanChart = sanitizeMermaid(chart);

  useEffect(() => {
    if (!cleanChart) return;
    renderChart(cleanChart);
  }, [cleanChart, renderChart]);

  const handleCopy = () => {
    navigator.clipboard.writeText(cleanChart);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadSvg = () => {
    if (!containerRef.current) return;
    const svgEl = containerRef.current.querySelector("svg");
    if (!svgEl) return;

    const svgData = new XMLSerializer().serializeToString(svgEl);
    const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `architecture-diagram-${Date.now()}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleManualRetry = () => {
    setIsRetrying(true);
    renderChart(emergencySanitizeMermaid(chart), true).finally(() => setIsRetrying(false));
  };

  return (
    <div className="w-full flex flex-col my-6 bg-[#0B0B10]/90 rounded-2xl border border-white/10 overflow-hidden shadow-2xl backdrop-blur-md">
      {/* Control bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-[#12121A]/80 text-xs font-mono text-muted-on-dark">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-accent-pink shadow-[0_0_8px_rgba(255,92,147,0.6)]"></span>
          <span className="font-semibold text-white tracking-wide">System Topology Flowchart</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setZoom((z) => Math.max(0.5, z - 0.15))}
            className="p-1.5 hover:bg-white/10 rounded-md transition-colors text-white/70 hover:text-white"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="px-1 text-[11px] text-white/50">{Math.round(zoom * 100)}%</span>
          <button
            onClick={() => setZoom((z) => Math.min(2, z + 0.15))}
            className="p-1.5 hover:bg-white/10 rounded-md transition-colors text-white/70 hover:text-white"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setZoom(1)}
            className="p-1.5 hover:bg-white/10 rounded-md transition-colors text-white/70 hover:text-white"
            title="Reset Zoom"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <div className="w-px h-4 bg-white/10 mx-1" />
          <button
            onClick={handleDownloadSvg}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-white/5 hover:bg-white/10 rounded-md transition-colors text-white/80 hover:text-white"
            title="Download SVG"
          >
            <Download className="w-3.5 h-3.5" />
            <span>SVG</span>
          </button>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-accent-pink/20 hover:bg-accent-pink/30 text-accent-pink rounded-md transition-colors font-medium border border-accent-pink/30"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? "Copied" : "Copy Code"}</span>
          </button>
        </div>
      </div>

      {/* Diagram Canvas */}
      <div className="p-8 overflow-x-auto min-h-[320px] flex items-center justify-center bg-gradient-to-b from-[#07070B] to-[#0E0E16]">
        {error ? (
          <div className="flex flex-col items-center justify-center text-center p-6 bg-[#12121A] border border-amber-500/30 rounded-2xl max-w-lg shadow-xl">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-3">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h4 className="text-white text-sm font-semibold mb-1">Diagram Syntax Optimization Needed</h4>
            <p className="text-xs text-white/60 mb-4 max-w-sm">
              The generated flowchart contained custom tokens. You can auto-repair it or edit the Mermaid code directly.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={handleManualRetry}
                disabled={isRetrying}
                className="flex items-center gap-2 px-3.5 py-1.5 bg-accent-pink hover:bg-white text-black font-mono font-bold text-xs rounded-lg transition-colors shadow-sm"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRetrying ? "animate-spin" : ""}`} />
                <span>Auto-Repair & Render</span>
              </button>
              <button
                onClick={handleCopy}
                className="px-3.5 py-1.5 bg-white/5 hover:bg-white/10 text-white font-mono text-xs rounded-lg border border-white/10 transition-colors"
              >
                Copy Raw Mermaid
              </button>
            </div>
          </div>
        ) : (
          <div
            ref={containerRef}
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: "center center",
              transition: "transform 0.15s ease",
            }}
            className="w-full flex justify-center"
          />
        )}
      </div>
    </div>
  );
}
