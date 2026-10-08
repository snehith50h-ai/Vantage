"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Sparkles,
  Play,
  RotateCcw,
  Code2,
  Download,
  ChevronDown,
  ArrowLeft,
} from "lucide-react";
import UserMenu from "@/components/auth/UserMenu";

interface PlaygroundHeaderProps {
  title: string;
  onTitleChange: (title: string) => void;
  selectedModel?: string;
  onSelectModel?: (model: string) => void;
  loading: boolean;
  onRun: () => void;
  onReset: () => void;
  onOpenGetCode: () => void;
  onExport: (format: "markdown" | "json" | "mermaid") => void;
  lastExecutionTime?: number;
}

export default function PlaygroundHeader({
  title,
  onTitleChange,
  loading,
  onRun,
  onReset,
  onOpenGetCode,
  onExport,
  lastExecutionTime,
}: PlaygroundHeaderProps) {
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setExportDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-[#0B0B10]/95 backdrop-blur-xl px-4 py-3">
      <div className="max-w-[1700px] mx-auto flex items-center justify-between gap-4">
        {/* Left Section: Back link, Logo, Strategy Title */}
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/"
            className="p-2 text-white/50 hover:text-white hover:bg-white/5 rounded-lg transition-colors shrink-0"
            title="Return to Home"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div className="flex items-center gap-2 shrink-0">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-accent-magenta to-accent-pink flex items-center justify-center shadow-[0_0_12px_rgba(192,43,214,0.5)]">
              <Sparkles className="w-3.5 h-3.5 text-black" />
            </div>
            <span className="font-mono text-sm font-bold tracking-widest text-white leading-none">
              VANTAGE
            </span>
          </div>

          <div className="h-5 w-[1px] bg-white/10 mx-1 hidden md:block" />

          {/* Editable Title */}
          <div className="relative flex items-center min-w-[180px] max-w-[320px]">
            <input
              type="text"
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder="Untitled Strategy..."
              className="w-full bg-transparent hover:bg-white/5 focus:bg-[#12121A] border border-transparent focus:border-white/20 rounded-md px-2.5 py-1 text-sm font-medium text-white placeholder-white/40 focus:outline-none transition-colors truncate"
            />
          </div>
        </div>

        {/* Center / Right Section: Telemetry, Actions */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Telemetry pill (if available) */}
          {lastExecutionTime && (
            <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-[11px] font-mono text-muted-on-dark">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span>{lastExecutionTime}ms</span>
            </div>
          )}

          {/* Get Code Button */}
          <button
            onClick={onOpenGetCode}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-white transition-colors"
            title="Get Code (Python, TypeScript, cURL)"
          >
            <Code2 className="w-3.5 h-3.5 text-accent-pink" />
            <span className="hidden md:inline">&lt;/&gt; Get Code</span>
          </button>

          {/* Export Dropdown */}
          <div className="relative" ref={exportRef}>
            <button
              onClick={() => setExportDropdownOpen(!exportDropdownOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-white transition-colors"
              title="Export Blueprint"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Export</span>
              <ChevronDown className="w-3 h-3 text-white/50" />
            </button>

            {exportDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-[#12121A] border border-white/15 rounded-xl shadow-2xl py-1 z-50">
                <button
                  onClick={() => {
                    onExport("markdown");
                    setExportDropdownOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-mono text-white hover:bg-white/10 transition-colors"
                >
                  📄 Export Markdown (.md)
                </button>
                <button
                  onClick={() => {
                    onExport("json");
                    setExportDropdownOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-mono text-white hover:bg-white/10 transition-colors"
                >
                  📦 Export Full JSON (.json)
                </button>
                <button
                  onClick={() => {
                    onExport("mermaid");
                    setExportDropdownOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-mono text-white hover:bg-white/10 transition-colors"
                >
                  📊 Export Flowchart (.mmd)
                </button>
              </div>
            )}
          </div>

          {/* Reset Button */}
          <button
            onClick={onReset}
            disabled={loading}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition-colors disabled:opacity-40"
            title="Reset Canvas"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Run Button */}
          <button
            onClick={onRun}
            disabled={loading}
            className="flex items-center gap-2 px-4 sm:px-5 py-2 rounded-lg bg-gradient-to-r from-accent-pink to-accent-magenta hover:from-white hover:to-white text-black font-mono font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-[1px] shadow-[0_0_20px_rgba(255,92,147,0.35)] shrink-0"
          >
            {loading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                <span>Running Swarm...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Run</span>
                <span className="hidden sm:inline opacity-60 text-[10px] lowercase font-normal ml-0.5">
                  ctrl+enter
                </span>
              </>
            )}
          </button>

          <div className="h-5 w-[1px] bg-white/10 mx-1 hidden sm:block" />
          <UserMenu compact={true} />
        </div>
      </div>
    </header>
  );
}
