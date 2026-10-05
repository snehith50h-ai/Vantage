"use client";

import React, { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";
import { Copy, Check, Download, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";

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
    fontSize: "13px"
  }
});

function sanitizeMermaid(raw: string): string {
  if (!raw) return "";
  let clean = raw.trim();

  // Ensure it has a diagram definition prefix
  if (!/^(graph|flowchart|sequenceDiagram|classDiagram|stateDiagram|erDiagram|journey|gantt|pie)/i.test(clean)) {
    clean = "graph TD\n" + clean;
  }

  // Auto-quote unquoted labels containing parentheses inside square brackets: A[Text (detail)] -> A["Text (detail)"]
  clean = clean.replace(/\[([^"\]\n]*\([^"\]\n]*\)[^"\]\n]*)\]/g, '["$1"]');

  return clean;
}

export default function Mermaid({ chart }: { chart: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const cleanChart = sanitizeMermaid(chart);

  useEffect(() => {
    let isMounted = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setError(null);

    if (containerRef.current) {
      containerRef.current.innerHTML = "";
      const uniqueId = `mermaid-${Math.random().toString(36).substring(2, 9)}`;

      mermaid
        .render(uniqueId, cleanChart)
        .then(({ svg }) => {
          if (isMounted && containerRef.current) {
            containerRef.current.innerHTML = svg;
            const svgEl = containerRef.current.querySelector("svg");
            if (svgEl) {
              svgEl.style.maxWidth = "100%";
              svgEl.style.height = "auto";
              svgEl.style.display = "block";
              svgEl.style.margin = "0 auto";
            }
          }
        })
        .catch((err) => {
          console.error("Mermaid rendering error:", err);
          if (isMounted) {
            setError(err?.message || "Failed to render chart");
          }
        });
    }

    return () => {
      isMounted = false;
    };
  }, [cleanChart]);

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

  return (
    <div className="w-full flex flex-col my-6 bg-[#0B0B10]/80 rounded-2xl border border-white/10 overflow-hidden shadow-2xl backdrop-blur-md">
      {/* Control bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-[#12121A]/80 text-xs font-mono text-muted-on-dark">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-accent-pink shadow-[0_0_8px_rgba(255,92,147,0.6)]"></span>
          <span className="font-semibold text-white">System Architecture Flowchart</span>
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
            <span>{copied ? "Copied!" : "Copy Code"}</span>
          </button>
        </div>
      </div>

      {/* Diagram Canvas */}
      <div className="p-8 overflow-x-auto min-h-[300px] flex items-center justify-center bg-gradient-to-b from-[#0B0B10] to-[#111118]">
        {error ? (
          <div className="text-center p-6 bg-red-500/10 border border-red-500/30 rounded-xl max-w-md">
            <p className="text-red-400 text-sm font-semibold mb-2">Mermaid Render Warning</p>
            <p className="text-xs text-white/60 mb-3">{error}</p>
            <pre className="text-[11px] font-mono text-left bg-black/60 p-3 rounded text-white/70 overflow-x-auto max-h-48">
              {cleanChart}
            </pre>
          </div>
        ) : (
          <div
            ref={containerRef}
            style={{ transform: `scale(${zoom})`, transformOrigin: "center center", transition: "transform 0.15s ease" }}
            className="w-full flex justify-center"
          />
        )}
      </div>
    </div>
  );
}
