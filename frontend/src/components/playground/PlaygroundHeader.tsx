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
  Check,
  Cpu,
  Layers,
  Flame,
  ArrowLeft,
} from "lucide-react";

export interface ModelOption {
  id: string;
  name: string;
  badge: string;
  speed: string;
  is_default?: boolean;
}

const MODELS: ModelOption[] = [
  {
    id: "gemini-3.5-flash-lite",
    name: "Gemini 3.5 Flash Lite",
    badge: "Recommended",
    speed: "Ultra Fast",
    is_default: true,
  },
  {
    id: "gemini-3.8-flash",
    name: "Gemini 3.8 Flash (High)",
    badge: "Deep Reasoning",
    speed: "Fast",
  },
  {
    id: "gemma-4-26b-a4b-it",
    name: "Gemma 4 (26B-A4B-IT)",
    badge: "Open Weights",
    speed: "High Throughput",
  },
  {
    id: "gemini-3.5-flash",
    name: "Gemini 3.5 Flash",
    badge: "Full Context",
    speed: "Standard",
  },
];

interface PlaygroundHeaderProps {
  title: string;
  onTitleChange: (title: string) => void;
  selectedModel: string;
  onSelectModel: (model: string) => void;
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
  selectedModel,
  onSelectModel,
  loading,
  onRun,
  onReset,
  onOpenGetCode,
  onExport,
  lastExecutionTime,
}: PlaygroundHeaderProps) {
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const exportRef = useRef<HTMLDivElement>(null);

  const currentModel = MODELS.find((m) => m.id === selectedModel) || MODELS[0];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setModelDropdownOpen(false);
      }
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
            <div className="hidden sm:flex flex-col">
              <span className="font-mono text-xs font-bold tracking-widest text-white leading-none">
                VANTAGE
              </span>
              <span className="text-[10px] font-mono text-accent-pink leading-tight">
                AI Studio Playground
              </span>
            </div>
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

        {/* Center / Right Section: Model Selector, Telemetry, Actions */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Model Selector Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setModelDropdownOpen(!modelDropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#14141F] hover:bg-[#1C1C2C] border border-white/10 text-xs font-mono text-white transition-all shadow-sm"
            >
              <Cpu className="w-3.5 h-3.5 text-accent-pink" />
              <span className="hidden sm:inline font-semibold">{currentModel.name}</span>
              <span className="sm:hidden font-semibold">{currentModel.id.split("-")[1]}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-accent-magenta/20 text-accent-magenta border border-accent-magenta/30 hidden lg:inline">
                {currentModel.badge}
              </span>
              <ChevronDown className="w-3 h-3 text-white/50" />
            </button>

            {modelDropdownOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-[#12121A] border border-white/15 rounded-xl shadow-2xl overflow-hidden py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-2 border-b border-white/10 text-[11px] font-mono text-white/40 uppercase tracking-wider">
                  Available Gemini Models
                </div>
                {MODELS.map((model) => (
                  <button
                    key={model.id}
                    onClick={() => {
                      onSelectModel(model.id);
                      setModelDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2.5 hover:bg-white/5 flex items-start justify-between transition-colors ${
                      selectedModel === model.id ? "bg-accent-magenta/10" : ""
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-white">{model.name}</span>
                        {model.badge && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent-pink/10 text-accent-pink font-mono">
                            {model.badge}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-muted-on-dark font-mono mt-0.5">
                        Latency: {model.speed}
                      </div>
                    </div>
                    {selectedModel === model.id && (
                      <Check className="w-4 h-4 text-accent-pink shrink-0 mt-0.5" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

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
            title="Reset Playground"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Run Button (Primary Google AI Studio Action) */}
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
        </div>
      </div>
    </header>
  );
}
