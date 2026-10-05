"use client";

import React, { useEffect, useRef, useState } from "react";
import { Copy, Check, ExternalLink, RefreshCw, Eye, Edit3, Code } from "lucide-react";
import { extractMermaidCode, mermaidToDrawioXml } from "@/utils/mermaidToXml";
import Mermaid from "@/components/Mermaid";

interface DrawioEditorProps {
  architectureText?: string;
  chart?: string;
}

export default function DrawioEditor({ architectureText = "", chart = "" }: DrawioEditorProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"drawio" | "native" | "code">("drawio");

  const mermaidCode = (chart || extractMermaidCode(architectureText)).trim();

  // Draw.io XML generated from Mermaid
  const drawioXml = React.useMemo(() => {
    return mermaidToDrawioXml(mermaidCode);
  }, [mermaidCode]);

  const sendDiagramToIframe = React.useCallback(() => {
    if (!iframeRef.current?.contentWindow) return;
    iframeRef.current.contentWindow.postMessage(
      JSON.stringify({
        action: "load",
        xml: drawioXml,
        autosave: 1,
      }),
      "*"
    );
  }, [drawioXml]);

  // Load XML into Draw.io iframe upon 'init' message
  useEffect(() => {
    const handleMessage = (evt: MessageEvent) => {
      if (typeof evt.data !== "string") return;
      try {
        const msg = JSON.parse(evt.data);
        if (msg.event === "init") {
          sendDiagramToIframe();
        }
      } catch (e) {
        // Not a JSON message, ignore
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [sendDiagramToIframe]);

  const handleCopyCode = () => {
    if (!mermaidCode) return;
    navigator.clipboard.writeText(mermaidCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenDrawioNewTab = () => {
    // Open official Draw.io web app in new tab
    window.open("https://app.diagrams.net/", "_blank", "noopener,noreferrer");
  };

  return (
    <div className="w-full flex flex-col gap-5 mt-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#F08705] shadow-[0_0_10px_rgba(240,135,5,0.7)]"></span>
            Draw.io Architecture Studio
          </h2>
          <p className="text-[14px] text-muted-on-dark mt-1">
            Interactive enterprise diagram canvas. Pre-populated from your blueprint, fully editable, and exportable.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {mermaidCode && (
            <button
              onClick={handleCopyCode}
              className="flex items-center gap-1.5 px-3 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-xs font-mono transition-colors border border-white/10"
              title="Copy Mermaid code to paste into Draw.io"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? "Mermaid Copied!" : "Copy Mermaid"}</span>
            </button>
          )}

          <button
            onClick={sendDiagramToIframe}
            className="flex items-center gap-1.5 px-3 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-xs font-mono transition-colors border border-white/10"
            title="Reload blueprint into Draw.io"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Sync to Canvas</span>
          </button>

          <button
            onClick={handleOpenDrawioNewTab}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#F08705] hover:bg-[#ff981a] text-black font-semibold rounded-lg text-xs font-mono transition-all shadow-[0_0_15px_rgba(240,135,5,0.3)]"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Open in Draw.io</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-2">
        <button
          onClick={() => setActiveTab("drawio")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono transition-colors ${
            activeTab === "drawio"
              ? "bg-[#F08705]/20 text-[#F08705] border border-[#F08705]/40 font-semibold"
              : "text-muted-on-dark hover:text-white hover:bg-white/5"
          }`}
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>Draw.io Canvas</span>
        </button>

        <button
          onClick={() => setActiveTab("native")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono transition-colors ${
            activeTab === "native"
              ? "bg-accent-pink/20 text-accent-pink border border-accent-pink/40 font-semibold"
              : "text-muted-on-dark hover:text-white hover:bg-white/5"
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Vector Blueprint</span>
        </button>

        <button
          onClick={() => setActiveTab("code")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono transition-colors ${
            activeTab === "code"
              ? "bg-accent-magenta/20 text-accent-magenta border border-accent-magenta/40 font-semibold"
              : "text-muted-on-dark hover:text-white hover:bg-white/5"
          }`}
        >
          <Code className="w-3.5 h-3.5" />
          <span>Mermaid Syntax</span>
        </button>
      </div>

      {/* Instructions Banner */}
      <div className="p-3.5 bg-gradient-to-r from-[#181524] to-[#12121A] rounded-xl border border-white/5 flex items-center justify-between text-xs text-muted-on-dark">
        <div className="flex items-center gap-2">
          <span className="text-[#F08705] font-bold">Pro-tip:</span>
          <span>In the Draw.io editor, go to <strong className="text-white">Arrange ➔ Insert ➔ Advanced ➔ Mermaid</strong> to import or update diagrams anytime.</span>
        </div>
      </div>

      {/* Tab Panels */}
      {activeTab === "drawio" && (
        <div className="w-full h-[650px] rounded-2xl overflow-hidden border border-white/10 bg-[#0B0B10] relative shadow-2xl">
          <iframe
            ref={iframeRef}
            src="https://embed.diagrams.net/?embed=1&ui=atlas&spin=1&proto=json&noSaveBtn=1"
            className="w-full h-full border-0 bg-white"
            title="Draw.io Architecture Canvas"
            allow="fullscreen"
          />
        </div>
      )}

      {activeTab === "native" && (
        <div className="w-full">
          {mermaidCode ? (
            <Mermaid chart={mermaidCode} />
          ) : (
            <div className="p-12 text-center text-muted-on-dark bg-[#1A1520] rounded-xl border border-white/5">
              No architecture diagram found to display.
            </div>
          )}
        </div>
      )}

      {activeTab === "code" && (
        <div className="w-full bg-[#12121A] rounded-xl border border-white/10 p-5 overflow-x-auto relative">
          <button
            onClick={handleCopyCode}
            className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-md text-xs font-mono transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? "Copied!" : "Copy"}</span>
          </button>
          <pre className="font-mono text-xs text-white/80 leading-relaxed whitespace-pre">
            {mermaidCode || "// No Mermaid diagram detected"}
          </pre>
        </div>
      )}
    </div>
  );
}
