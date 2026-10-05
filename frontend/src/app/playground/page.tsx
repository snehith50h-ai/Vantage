"use client";

import React, { useState, useEffect } from "react";
import PlaygroundHeader from "@/components/playground/PlaygroundHeader";
import PlaygroundSidebar, { PresetItem, PRESETS } from "@/components/playground/PlaygroundSidebar";
import AgentExecutionPipeline, { TraceStep } from "@/components/playground/AgentExecutionPipeline";
import ArchitectureStudioTab from "@/components/playground/ArchitectureStudioTab";
import JuryProfilerTab from "@/components/playground/JuryProfilerTab";
import PitchDeckTab from "@/components/playground/PitchDeckTab";
import TradeoffsFeasibilityTab from "@/components/playground/TradeoffsFeasibilityTab";
import DiagnosticsTab from "@/components/playground/DiagnosticsTab";
import MarkdownExportTab from "@/components/playground/MarkdownExportTab";
import GetCodeModal from "@/components/playground/GetCodeModal";
import LenisProvider from "@/components/LenisProvider";
import {
  Sparkles,
  Layers,
  Award,
  Presentation,
  Activity,
  FileText,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Scale,
} from "lucide-react";

export default function PlaygroundPage() {
  // Strategy Inputs
  const [strategyTitle, setStrategyTitle] = useState("SIH 2026 - Mine Subsidence Monitoring");
  const [organizerName, setOrganizerName] = useState("Smart India Hackathon (SIH)");
  const [problemStatement, setProblemStatement] = useState(
    "Problem Statement ID 26025: Development of an AI-enabled Low Cost Real Time Mine Subsidence Monitoring, Prediction and Early Warning System for Underground Coal Mines in India."
  );
  const [customConstraints, setCustomConstraints] = useState(
    "Low cost sensors under ₹15,000. Must function offline in underground mines with ad-hoc mesh sync."
  );
  const [showConstraints, setShowConstraints] = useState(false);

  // Model & Sidebar Config
  const [selectedModel, setSelectedModel] = useState("gemini-3.5-flash-lite");
  const [temperature, setTemperature] = useState(0.7);
  const [topP, setTopP] = useState(0.95);
  const [systemInstruction, setSystemInstruction] = useState(
    "You are an Elite Enterprise Technical Architect and Hackathon Jury Profiler. Design production-grade microservices with clear separation of concerns, high-reliability event buses, and zero single points of failure."
  );
  const [enabledAgents, setEnabledAgents] = useState<string[]>([
    "scraper",
    "profiler",
    "feasibility",
    "blueprint",
    "pitch",
  ]);

  // Execution State & Results
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [result, setResult] = useState<any>(null);
  const [trace, setTrace] = useState<TraceStep[]>([]);
  const [lastExecutionTime, setLastExecutionTime] = useState<number | undefined>(undefined);

  // Active Output Tab
  const [activeTab, setActiveTab] = useState<
    "architecture" | "jury" | "tradeoffs" | "pitch" | "diagnostics" | "export"
  >("architecture");

  // Modals & Panels
  const [getCodeOpen, setGetCodeOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);



  const handleToggleAgent = (agentId: string) => {
    setEnabledAgents((prev) =>
      prev.includes(agentId) ? prev.filter((id) => id !== agentId) : [...prev, agentId]
    );
  };

  const handleSelectPreset = (preset: PresetItem) => {
    setStrategyTitle(preset.name);
    setOrganizerName(preset.organizer);
    setProblemStatement(preset.problem);
    setCustomConstraints(preset.constraints);
    setSystemInstruction(preset.persona);
  };

  const handleRun = async () => {
    if (!problemStatement.trim() || loading) return;

    setLoading(true);
    setError("");

    // Simulate animated step transitions
    setTrace([
      {
        agent: "scraper",
        name: "Precedent & Web Miner",
        status: "running",
        details: `Mining past editions (1.0, 2.0, winning PPTs) for ${organizerName}...`,
      },
      {
        agent: "profiler",
        name: "Jury Profiler & Rubrics",
        status: "idle",
        details: "Awaiting web precedent intelligence...",
      },
      {
        agent: "feasibility",
        name: "Trade-off & Feasibility Engine",
        status: "idle",
        details: "Awaiting jury rubric priorities...",
      },
      {
        agent: "blueprint",
        name: "Enterprise Architect",
        status: "idle",
        details: "Awaiting comparative tech stack specs...",
      },
      {
        agent: "pitch",
        name: "Pitch Deck & Jury Defense",
        status: "idle",
        details: "Awaiting architectural specs...",
      },
    ]);

    try {
      const response = await fetch("http://localhost:8000/api/playground/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizer_name: organizerName,
          problem_statement: problemStatement,
          model: selectedModel,
          temperature: temperature,
          system_instruction: systemInstruction,
          custom_constraints: customConstraints,
          enabled_agents: enabledAgents,
        }),
      });

      if (!response.ok) {
        throw new Error("Execution failed. Please check backend connection.");
      }

      const data = await response.json();
      setResult(data);
      if (data.trace) setTrace(data.trace);
      if (data.meta?.total_time_ms) setLastExecutionTime(data.meta.total_time_ms);
    } catch (err: unknown) {
      console.error(err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to execute pipeline");
      }
    } finally {
      setLoading(false);
    }
  };

  // Keyboard shortcut listener: Ctrl+Enter to Run
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        handleRun();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizerName, problemStatement, selectedModel, temperature, systemInstruction, customConstraints, enabledAgents, handleRun]);

  const handleReset = () => {
    handleSelectPreset(PRESETS[0]);
    setResult(null);
    setTrace([]);
    setError("");
  };

  const handleExport = (format: "markdown" | "json" | "mermaid") => {
    if (!result) return;
    let content = "";
    let filename = "";
    let type = "text/plain";

    if (format === "markdown") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const whyThis = (result.feasibility_analysis?.why_this_feature || []).map((f: any) => `- **${f.feature}**: ${f.why_chosen} (Rubric: ${f.rubric_alignment})`).join('\n');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const whyNot = (result.feasibility_analysis?.why_not_that_feature || []).map((f: any) => `- **${f.feature}**: ${f.why_rejected} (Risk Averted: ${f.risk_avoided})`).join('\n');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const tradeoffs = (result.feasibility_analysis?.tech_tradeoffs || []).map((t: any) => `- **${t.layer}**: Chose \`${t.chosen}\` over \`${t.alternative}\`. Rationale: ${t.tradeoff_rationale}`).join('\n');
      
      content = `# ${strategyTitle}
Hackathon Organizer: ${organizerName}

## 1. Past Precedents & Winning Patterns Mined
${result.precedent_intelligence?.past_editions_analyzed || "No precedent intelligence available."}

### Winning PPT Presentation Strategy
${result.precedent_intelligence?.winning_ppt_strategy || "N/A"}

## 2. Jury Profile & Reverse-Engineered Rubrics
${result.jury_profile}

## 3. Trade-off Matrix: Why THIS vs Why NOT THAT
### Features INCLUDED (High Impact, High Rubric Fit):
${whyThis || "Standard feature set."}

### Features CUT / DEFERRED (Vanity Bloat & Crash Risk):
${whyNot || "None."}

### Comparative Technology Stack Rationale:
${tradeoffs || "Standard stack."}

## 4. Enterprise Architecture Blueprint
${result.final_blueprint?.architecture}

## 5. Pitch Deck & Presentation Flow
${JSON.stringify(result.final_blueprint?.pitch_outline?.slides || result.final_blueprint?.pitch_outline, null, 2)}
`;
      filename = `${strategyTitle.toLowerCase().replace(/\s+/g, "-")}.md`;
    } else if (format === "json") {
      content = JSON.stringify(result, null, 2);
      filename = `${strategyTitle.toLowerCase().replace(/\s+/g, "-")}.json`;
      type = "application/json";
    } else if (format === "mermaid") {
      content = result.final_blueprint?.architecture || "";
      filename = `${strategyTitle.toLowerCase().replace(/\s+/g, "-")}-flowchart.mmd`;
    }

    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <LenisProvider>
      <main className="flex flex-col min-h-screen bg-[#0B0B10] text-text-on-dark font-sans selection:bg-accent-magenta/30">
        {/* Sticky Google AI Studio Header */}
        <PlaygroundHeader
          title={strategyTitle}
          onTitleChange={setStrategyTitle}
          selectedModel={selectedModel}
          onSelectModel={setSelectedModel}
          loading={loading}
          onRun={handleRun}
          onReset={handleReset}
          onOpenGetCode={() => setGetCodeOpen(true)}
          onExport={handleExport}
          lastExecutionTime={lastExecutionTime}
        />

        {/* 2-Column / Split Layout */}
        <div className="flex-1 flex flex-col lg:flex-row w-full max-w-[1700px] mx-auto overflow-hidden">
          {/* Collapsible Left Sidebar */}
          <div className={`${sidebarOpen ? "block" : "hidden"} lg:block`}>
            <PlaygroundSidebar
              systemInstruction={systemInstruction}
              onSystemInstructionChange={setSystemInstruction}
              temperature={temperature}
              onTemperatureChange={setTemperature}
              topP={topP}
              onTopPChange={setTopP}
              enabledAgents={enabledAgents}
              onToggleAgent={handleToggleAgent}
              onSelectPreset={handleSelectPreset}
            />
          </div>

          {/* Main Interactive Studio Canvas */}
          <div className="flex-1 flex flex-col min-w-0 p-4 sm:p-6 lg:p-8 gap-6 overflow-y-auto">
            {/* Mobile Sidebar Toggle */}
            <div className="lg:hidden flex justify-end">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-mono text-white"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>{sidebarOpen ? "Hide Config" : "Show Config"}</span>
              </button>
            </div>

            {/* Prompt & Input Workspace Card */}
            <div className="bg-[#12121A]/80 border border-white/10 rounded-2xl p-5 sm:p-6 shadow-xl backdrop-blur-md flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-accent-pink shadow-[0_0_8px_rgba(255,92,147,0.7)]"></span>
                  <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-white">
                    Hackathon Prompt Workspace
                  </h2>
                </div>
                <span className="text-[11px] font-mono text-white/40">
                  Ctrl + Enter to Run
                </span>
              </div>

              {/* Organizer Name Field with Auto-Suggest Pills */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-mono text-muted-on-dark flex items-center justify-between">
                  <span>Organizer / Hackathon Platform</span>
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={organizerName}
                    onChange={(e) => setOrganizerName(e.target.value)}
                    placeholder="e.g. Smart India Hackathon (SIH), ETHGlobal, MLH..."
                    className="flex-grow bg-[#0A0A10] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-accent-pink transition-colors"
                  />
                  <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap">
                    {["SIH", "ETHGlobal", "MLH", "HackMIT", "Google"].map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => setOrganizerName(tag)}
                        className="text-[11px] font-mono px-2.5 py-1.5 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white rounded-lg border border-white/10 transition-colors"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Problem Statement Field */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs font-mono text-muted-on-dark">
                  <span>Problem Statement / Hackathon Theme</span>
                  <span>{problemStatement.length} chars</span>
                </div>
                <textarea
                  value={problemStatement}
                  onChange={(e) => setProblemStatement(e.target.value)}
                  placeholder="Paste problem statement, theme guidelines, or challenge prompt here..."
                  className="w-full h-28 bg-[#0A0A10] border border-white/10 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-accent-pink transition-colors resize-y leading-relaxed font-sans"
                />
              </div>

              {/* Collapsible Constraints Field */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowConstraints(!showConstraints)}
                  className="flex items-center gap-1.5 text-xs font-mono text-accent-pink hover:underline"
                >
                  <span>{showConstraints ? "- Hide Custom Judging Constraints" : "+ Add Custom Judging Constraints / Hard Limits"}</span>
                  {showConstraints ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                {showConstraints && (
                  <div className="mt-2.5 animate-in fade-in duration-200">
                    <input
                      type="text"
                      value={customConstraints}
                      onChange={(e) => setCustomConstraints(e.target.value)}
                      placeholder="e.g. Cost under $100, offline mode required, strict GDPR compliance..."
                      className="w-full bg-[#0A0A10] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-accent-pink transition-colors"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Real-time Agent Execution Pipeline Stepper */}
            <AgentExecutionPipeline
              trace={trace}
              loading={loading}
              totalTimeMs={lastExecutionTime}
            />

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs font-mono">
                {error}
              </div>
            )}

            {/* Results Studio Workspace */}
            {result ? (
              <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-3 duration-500">
                {/* Google AI Studio Output Tabs */}
                <div className="flex items-center gap-2 border-b border-white/10 pb-2 overflow-x-auto">
                  <button
                    onClick={() => setActiveTab("architecture")}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-mono transition-colors shrink-0 ${
                      activeTab === "architecture"
                        ? "bg-accent-magenta/20 text-white border border-accent-magenta/40 font-bold shadow-[0_0_15px_rgba(192,43,214,0.3)]"
                        : "text-muted-on-dark hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <Layers className="w-4 h-4 text-accent-magenta" />
                    <span>1. System Architecture</span>
                  </button>

                  <button
                    onClick={() => setActiveTab("jury")}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-mono transition-colors shrink-0 ${
                      activeTab === "jury"
                        ? "bg-accent-pink/20 text-white border border-accent-pink/40 font-bold shadow-[0_0_15px_rgba(255,92,147,0.3)]"
                        : "text-muted-on-dark hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <Award className="w-4 h-4 text-accent-pink" />
                    <span>2. Jury Profiler & Precedents</span>
                  </button>

                  <button
                    onClick={() => setActiveTab("tradeoffs")}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-mono transition-colors shrink-0 ${
                      activeTab === "tradeoffs"
                        ? "bg-emerald-500/20 text-white border border-emerald-500/40 font-bold shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                        : "text-muted-on-dark hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <Scale className="w-4 h-4 text-emerald-400" />
                    <span>3. Trade-offs & Feasibility</span>
                  </button>

                  <button
                    onClick={() => setActiveTab("pitch")}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-mono transition-colors shrink-0 ${
                      activeTab === "pitch"
                        ? "bg-[#F08705]/20 text-white border border-[#F08705]/40 font-bold shadow-[0_0_15px_rgba(240,135,5,0.3)]"
                        : "text-muted-on-dark hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <Presentation className="w-4 h-4 text-[#F08705]" />
                    <span>4. Pitch Deck & Jury Defense</span>
                  </button>

                  <button
                    onClick={() => setActiveTab("diagnostics")}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-mono transition-colors shrink-0 ${
                      activeTab === "diagnostics"
                        ? "bg-blue-500/20 text-white border border-blue-500/40 font-bold shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                        : "text-muted-on-dark hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <Activity className="w-4 h-4 text-blue-400" />
                    <span>5. Diagnostics</span>
                  </button>

                  <button
                    onClick={() => setActiveTab("export")}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-mono transition-colors shrink-0 ${
                      activeTab === "export"
                        ? "bg-white/20 text-white border border-white/30 font-bold"
                        : "text-muted-on-dark hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    <span>6. Full Markdown</span>
                  </button>
                </div>

                {/* Tab 1: Architecture Studio */}
                {activeTab === "architecture" && (
                  <ArchitectureStudioTab
                    architecture={result.final_blueprint?.architecture || ""}
                    onUpdateArchitecture={(updated) => {
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      setResult((prev: any) => ({
                        ...prev,
                        final_blueprint: {
                          ...prev.final_blueprint,
                          architecture: updated,
                        },
                      }));
                    }}
                    problemStatement={problemStatement}
                    selectedModel={selectedModel}
                  />
                )}

                {/* Tab 2: Jury Profiler & Precedent Intelligence */}
                {activeTab === "jury" && (
                  <JuryProfilerTab
                    juryProfile={result.jury_profile || ""}
                    organizerName={organizerName}
                    precedentIntelligence={result.precedent_intelligence}
                  />
                )}

                {/* Tab 3: Trade-off Matrix & Feasibility */}
                {activeTab === "tradeoffs" && (
                  <TradeoffsFeasibilityTab
                    feasibilityData={result.feasibility_analysis || result.final_blueprint?.feasibility}
                    organizerName={organizerName}
                  />
                )}

                {/* Tab 4: Pitch Deck Player & Jury Defense */}
                {activeTab === "pitch" && (
                  <PitchDeckTab
                    pitchOutline={result.final_blueprint?.pitch_outline || {}}
                    juryDefenseQa={result.final_blueprint?.jury_defense_qa || []}
                  />
                )}

                {/* Tab 4: Diagnostics */}
                {activeTab === "diagnostics" && (
                  <DiagnosticsTab
                    trace={trace}
                    meta={result.meta || {}}
                  />
                )}

                {/* Tab 5: Full Markdown Report */}
                {activeTab === "export" && (
                  <MarkdownExportTab
                    organizerName={organizerName}
                    problemStatement={problemStatement}
                    juryProfile={result.jury_profile || ""}
                    architecture={result.final_blueprint?.architecture || ""}
                    pitchOutline={result.final_blueprint?.pitch_outline}
                  />
                )}
              </div>
            ) : (
              /* Ready State Placeholder */
              <div className="p-16 rounded-2xl border border-white/10 bg-[#12121A]/30 text-center flex flex-col items-center justify-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-accent-pink">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-white tracking-tight">
                  Playground Ready to Execute
                </h3>
                <p className="text-xs text-muted-on-dark max-w-md">
                  Click <strong className="text-white">&quot;Run&quot;</strong> in the top header or press <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-[11px] text-white">Ctrl + Enter</kbd> to launch the multi-agent swarm.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Google AI Studio Get Code Modal */}
        <GetCodeModal
          isOpen={getCodeOpen}
          onClose={() => setGetCodeOpen(false)}
          organizerName={organizerName}
          problemStatement={problemStatement}
          model={selectedModel}
          temperature={temperature}
        />
      </main>
    </LenisProvider>
  );
}
