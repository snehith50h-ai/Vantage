"use client";

import React, { useState } from "react";
import {
  Sliders,
  Settings,
  Sparkles,
  Bot,
  Layers,
  Bookmark,
  ChevronDown,
  ChevronRight,
  Flame,
  Shield,
  Database,
  CheckSquare,
  Square,
  HelpCircle,
} from "lucide-react";

export interface PresetItem {
  id: string;
  name: string;
  organizer: string;
  problem: string;
  constraints: string;
  persona: string;
  tag: string;
}

export const PRESETS: PresetItem[] = [
  {
    id: "hack-with-hyderabad",
    name: "Hack with Hyderabad 3.0: Urban Flood Response",
    organizer: "Hack with Hyderabad 3.0",
    problem:
      "Build an AI-powered offline-first emergency response and volunteer routing mesh system for urban flood management and flash crisis relief in Hyderabad.",
    constraints:
      "Must operate with zero cellular network using peer-to-peer ad-hoc WiFi/Bluetooth mesh. Sub-second geo-spatial alerts for first responders.",
    persona: "Hack with Hyderabad Senior Technical Jury",
    tag: "CivicTech / Disaster AI",
  },
  {
    id: "sih-coal-mine",
    name: "SIH 2026: Mine Subsidence Monitoring",
    organizer: "Smart India Hackathon (SIH)",
    problem:
      "Problem Statement ID 26025: Development of an AI-enabled Low Cost Real Time Mine Subsidence Monitoring, Prediction and Early Warning System for Underground Coal Mines in India.",
    constraints:
      "Must work reliably in underground bandwidth-constrained environments. Total sensor node cost under ₹15,000 ($180). Audible and visual sirens with fail-safe manual override.",
    persona: "SIH / Smart India Hackathon Technical Evaluator",
    tag: "GovTech / IoT",
  },
  {
    id: "ethglobal-zk-intent",
    name: "ETHGlobal: Autonomous ZK AI Router",
    organizer: "ETHGlobal",
    problem:
      "Build a cross-chain autonomous liquidity routing engine using decentralized AI intent solvers and zero-knowledge validity proofs.",
    constraints:
      "Sub-second execution quotes, decentralized relayer network, gas-optimized smart contracts on Arbitrum & Base, zero centralized custody.",
    persona: "Cypherpunk / Web3 Auditor",
    tag: "Web3 / DeFi",
  },
  {
    id: "hackmit-drone-swarm",
    name: "HackMIT: Disaster Response Drone Mesh",
    organizer: "HackMIT",
    problem:
      "Autonomous search-and-rescue aerial drone swarm operating over ad-hoc peer-to-peer LoRa mesh networks in GPS-denied catastrophe zones.",
    constraints:
      "Edge computer vision inferencing on Jetson Nano, resilient to 40% node loss, decentralized swarm leader election.",
    persona: "Enterprise Architect",
    tag: "Robotics / Edge AI",
  },
  {
    id: "google-solution-crops",
    name: "Google Solution: Crop Disease Audio AI",
    organizer: "Google Solution Challenge",
    problem:
      "Offline mobile edge AI application for instant crop leaf pathology diagnosis with localized native voice audio synthesis for rural farmers.",
    constraints:
      "Completely offline on low-end Android hardware, model quantized under 15MB, voice guidance in 8 regional dialects.",
    persona: "Tier-1 Silicon Valley VC",
    tag: "Social Impact / AI",
  },
];

const PERSONA_TEMPLATES: { label: string; text: string }[] = [
  {
    label: "Enterprise Architect",
    text: "You are an Elite Enterprise Technical Architect. Enforce strict microservices boundaries, decoupled asynchronous message brokers, high-throughput caching tiers, and zero single points of failure.",
  },
  {
    label: "SIH Evaluator",
    text: "You are a Senior Judge for the Smart India Hackathon. Focus relentlessly on physical feasibility, ultra-low cost bill of materials, edge resilience in rural/underground zones, and rock-solid fail-safes.",
  },
  {
    label: "Tier-1 VC Judge",
    text: "You are a General Partner at a Tier-1 Silicon Valley VC firm. Evaluate unfair defensibility, scalability to 100M users, viral distribution vectors, and massive technological moat.",
  },
  {
    label: "Web3 / Cypherpunk",
    text: "You are a Cypherpunk security auditor. Prioritize trustless architecture, cryptographic verification, decentralized consensus, and absence of central choke points.",
  },
];

interface PlaygroundSidebarProps {
  systemInstruction: string;
  onSystemInstructionChange: (text: string) => void;
  temperature: number;
  onTemperatureChange: (temp: number) => void;
  topP: number;
  onTopPChange: (val: number) => void;
  enabledAgents: string[];
  onToggleAgent: (agentId: string) => void;
  onSelectPreset: (preset: PresetItem) => void;
}

export default function PlaygroundSidebar({
  systemInstruction,
  onSystemInstructionChange,
  temperature,
  onTemperatureChange,
  topP,
  onTopPChange,
  enabledAgents,
  onToggleAgent,
  onSelectPreset,
}: PlaygroundSidebarProps) {
  const [systemOpen, setSystemOpen] = useState(true);
  const [paramsOpen, setParamsOpen] = useState(true);
  const [agentsOpen, setAgentsOpen] = useState(true);
  const [presetsOpen, setPresetsOpen] = useState(true);

  const agentsList = [
    {
      id: "scraper",
      name: "1. Precedent & Web Miner",
      desc: "Mines past editions (1.0, 2.0, winning PPTs) & live web citations.",
      icon: "🌐",
    },
    {
      id: "profiler",
      name: "2. Jury Profiler & Rubrics",
      desc: "Synthesizes judging archetypes, criteria weights, and win factors.",
      icon: "🧠",
    },
    {
      id: "feasibility",
      name: "3. Trade-off & Feasibility Engine",
      desc: "Constructs 'Why THIS vs Why NOT THAT' matrix & MVP scope.",
      icon: "⚖️",
    },
    {
      id: "blueprint",
      name: "4. Enterprise Blueprint Architect",
      desc: "Draws Mermaid flowcharts, subgraphs, and component topologies.",
      icon: "🏛️",
    },
    {
      id: "pitch",
      name: "5. Pitch Deck & Jury Defense",
      desc: "Builds 5-slide deck, speaker notes, and anticipated jury Q&A.",
      icon: "🚀",
    },
  ];

  return (
    <aside className="w-full lg:w-80 xl:w-96 shrink-0 border-r border-white/10 bg-[#0B0B10]/60 backdrop-blur-md flex flex-col h-full overflow-y-auto font-sans p-4 gap-4 text-white">
      {/* SECTION 1: System Instructions / Agent Persona */}
      <div className="bg-[#12121A]/80 border border-white/10 rounded-xl overflow-hidden shadow-sm">
        <button
          onClick={() => setSystemOpen(!systemOpen)}
          className="w-full flex items-center justify-between p-3.5 text-xs font-mono font-bold tracking-wider uppercase text-white/90 hover:bg-white/5 transition-colors border-b border-white/5"
        >
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-accent-magenta" />
            <span>System Instructions</span>
          </div>
          {systemOpen ? <ChevronDown className="w-3.5 h-3.5 text-white/50" /> : <ChevronRight className="w-3.5 h-3.5 text-white/50" />}
        </button>

        {systemOpen && (
          <div className="p-3.5 flex flex-col gap-3">
            <textarea
              value={systemInstruction}
              onChange={(e) => onSystemInstructionChange(e.target.value)}
              placeholder="Define agent behavior, architectural constraints, and persona..."
              className="w-full h-28 bg-[#07070B] border border-white/10 rounded-lg p-2.5 text-xs font-mono text-white/90 placeholder-white/30 focus:outline-none focus:border-accent-magenta resize-none transition-colors"
            />

            {/* Quick Persona Pills */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-mono text-white/40 uppercase">
                Persona Presets
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {PERSONA_TEMPLATES.map((tmpl) => (
                  <button
                    key={tmpl.label}
                    onClick={() => onSystemInstructionChange(tmpl.text)}
                    className="text-left px-2 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-[11px] font-mono text-white/80 hover:text-white transition-colors truncate"
                    title={tmpl.text}
                  >
                    + {tmpl.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 2: Model Generation Parameters */}
      <div className="bg-[#12121A]/80 border border-white/10 rounded-xl overflow-hidden shadow-sm">
        <button
          onClick={() => setParamsOpen(!paramsOpen)}
          className="w-full flex items-center justify-between p-3.5 text-xs font-mono font-bold tracking-wider uppercase text-white/90 hover:bg-white/5 transition-colors border-b border-white/5"
        >
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-accent-pink" />
            <span>Model Parameters</span>
          </div>
          {paramsOpen ? <ChevronDown className="w-3.5 h-3.5 text-white/50" /> : <ChevronRight className="w-3.5 h-3.5 text-white/50" />}
        </button>

        {paramsOpen && (
          <div className="p-3.5 flex flex-col gap-4">
            {/* Temperature Slider */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-white/80 flex items-center gap-1">
                  Temperature
                  <Flame className="w-3 h-3 text-accent-pink" />
                </span>
                <span className="text-accent-pink font-bold">{temperature.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={temperature}
                onChange={(e) => onTemperatureChange(parseFloat(e.target.value))}
                className="w-full accent-accent-pink bg-white/10 h-1.5 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-white/40">
                <span>Deterministic (0.0)</span>
                <span>Creative (1.0)</span>
              </div>
            </div>

            {/* Top-P Slider */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-white/80">Top P</span>
                <span className="text-accent-magenta font-bold">{topP.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.05"
                value={topP}
                onChange={(e) => onTopPChange(parseFloat(e.target.value))}
                className="w-full accent-accent-magenta bg-white/10 h-1.5 rounded-lg cursor-pointer"
              />
            </div>

            {/* Grounding Toggle */}
            <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs">
              <div className="flex items-center gap-2">
                <Database className="w-3.5 h-3.5 text-accent-pink" />
                <span className="font-mono text-white/90">PGVector Knowledge</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Active
              </span>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 3: Multi-Agent Swarm Toggles */}
      <div className="bg-[#12121A]/80 border border-white/10 rounded-xl overflow-hidden shadow-sm">
        <button
          onClick={() => setAgentsOpen(!agentsOpen)}
          className="w-full flex items-center justify-between p-3.5 text-xs font-mono font-bold tracking-wider uppercase text-white/90 hover:bg-white/5 transition-colors border-b border-white/5"
        >
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-400" />
            <span>Agent Swarm Nodes</span>
          </div>
          {agentsOpen ? <ChevronDown className="w-3.5 h-3.5 text-white/50" /> : <ChevronRight className="w-3.5 h-3.5 text-white/50" />}
        </button>

        {agentsOpen && (
          <div className="p-3.5 flex flex-col gap-2.5">
            {agentsList.map((agent) => {
              const isEnabled = enabledAgents.includes(agent.id);
              return (
                <div
                  key={agent.id}
                  onClick={() => onToggleAgent(agent.id)}
                  className={`flex items-start gap-2.5 p-2 rounded-lg cursor-pointer transition-colors border ${
                    isEnabled
                      ? "bg-white/5 border-white/15"
                      : "bg-transparent border-transparent opacity-50"
                  }`}
                >
                  <div className="mt-0.5 text-accent-pink">
                    {isEnabled ? (
                      <CheckSquare className="w-4 h-4" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm">{agent.icon}</span>
                      <span className="text-xs font-semibold text-white truncate">
                        {agent.name}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-on-dark leading-tight mt-0.5">
                      {agent.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION 4: Preset Hackathons (Click-To-Load) */}
      <div className="bg-[#12121A]/80 border border-white/10 rounded-xl overflow-hidden shadow-sm">
        <button
          onClick={() => setPresetsOpen(!presetsOpen)}
          className="w-full flex items-center justify-between p-3.5 text-xs font-mono font-bold tracking-wider uppercase text-white/90 hover:bg-white/5 transition-colors border-b border-white/5"
        >
          <div className="flex items-center gap-2">
            <Bookmark className="w-4 h-4 text-amber-400" />
            <span>Preset Hackathons</span>
          </div>
          {presetsOpen ? <ChevronDown className="w-3.5 h-3.5 text-white/50" /> : <ChevronRight className="w-3.5 h-3.5 text-white/50" />}
        </button>

        {presetsOpen && (
          <div className="p-3 flex flex-col gap-2">
            {PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => onSelectPreset(preset)}
                className="w-full text-left p-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-accent-pink/40 transition-all flex flex-col gap-1 group"
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-bold text-white group-hover:text-accent-pink transition-colors truncate">
                    {preset.name}
                  </span>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-white/70 shrink-0">
                    {preset.tag}
                  </span>
                </div>
                <p className="text-[11px] text-muted-on-dark line-clamp-2 leading-tight">
                  {preset.problem}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
