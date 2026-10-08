"use client";

import React, { useState, useEffect, useCallback } from "react";
import PlaygroundHeader from "@/components/playground/PlaygroundHeader";
import PlaygroundSidebar, { PresetItem } from "@/components/playground/PlaygroundSidebar";
import AgentExecutionPipeline, { TraceStep } from "@/components/playground/AgentExecutionPipeline";
import ArchitectureStudioTab from "@/components/playground/ArchitectureStudioTab";
import JuryProfilerTab from "@/components/playground/JuryProfilerTab";
import PitchDeckTab from "@/components/playground/PitchDeckTab";
import TradeoffsFeasibilityTab from "@/components/playground/TradeoffsFeasibilityTab";
import DiagnosticsTab from "@/components/playground/DiagnosticsTab";
import MarkdownExportTab from "@/components/playground/MarkdownExportTab";
import WebIntelTab from "@/components/playground/WebIntelTab";
import GetCodeModal from "@/components/playground/GetCodeModal";
import LenisProvider from "@/components/LenisProvider";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/components/auth/AuthProvider";
import { useToast } from "@/components/ui/Toast";
import {
  Sparkles,
  Layers,
  Award,
  Presentation,
  Activity,
  FileText,
  SlidersHorizontal,
  Scale,
  Zap,
  Globe2,
} from "lucide-react";

export default function PlaygroundPage() {
  // Strategy Inputs
  const [strategyTitle, setStrategyTitle] = useState("");
  const [organizerName, setOrganizerName] = useState("");
  const [problemStatement, setProblemStatement] = useState("");
  const [customConstraints, setCustomConstraints] = useState("");
  const [showConstraints, setShowConstraints] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const [userName, setUserName] = useState(user?.name || (user?.email ? user.email.split("@")[0] : "") || "Strategist");

  // Keep username synchronized with current authenticated user
  useEffect(() => {
    if (user?.name) {
      setUserName(user.name);
    } else if (user?.email) {
      setUserName(user.email.split("@")[0]);
    } else {
      apiFetch("/api/auth/me")
        .then((res) => res.json())
        .then((data) => {
          if (data?.user?.name) {
            setUserName(data.user.name);
          } else if (data?.user?.email) {
            setUserName(data.user.email.split("@")[0]);
          }
        })
        .catch(() => {});
    }
  }, [user]);

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
    "architecture" | "jury" | "tradeoffs" | "pitch" | "diagnostics" | "export" | "intel"
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

  // Hydrate an existing run from History
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleLoadRun = (fullRun: any) => {
    setStrategyTitle(fullRun.title || "");
    setOrganizerName(fullRun.organizer_name || "");
    setProblemStatement(fullRun.problem_statement || "");
    if (fullRun.config_json?.model) setSelectedModel(fullRun.config_json.model);
    if (fullRun.config_json?.temperature) setTemperature(fullRun.config_json.temperature);
    if (fullRun.config_json?.system_instruction) setSystemInstruction(fullRun.config_json.system_instruction);
    if (fullRun.config_json?.custom_constraints) setCustomConstraints(fullRun.config_json.custom_constraints);
    if (fullRun.config_json?.enabled_agents) setEnabledAgents(fullRun.config_json.enabled_agents);

    if (fullRun.result_json) {
      setResult(fullRun.result_json);
      if (fullRun.result_json.trace && fullRun.result_json.trace.length > 0) {
        setTrace(fullRun.result_json.trace);
      } else {
        setTrace([
          { agent: "scraper", name: "Precedent & Web Miner", status: "completed", details: "Mined past editions" },
          { agent: "profiler", name: "Jury Profiler & Rubrics", status: "completed", details: "Profiled scoring priorities" },
          { agent: "feasibility", name: "Trade-off Engine", status: "completed", details: "Analyzed technical tradeoffs" },
          { agent: "blueprint", name: "Enterprise Architect", status: "completed", details: "Synthesized Mermaid blueprint" },
          { agent: "pitch", name: "Pitch Deck & Jury Defense", status: "completed", details: "Synthesized winning slides" },
        ]);
      }
      setLastExecutionTime(fullRun.result_json.meta?.total_time_ms || 2400);
      setActiveTab("architecture");
    }
  };

  const handleRun = useCallback(async () => {
    if (!problemStatement.trim() || loading) return;

    setLoading(true);
    setError("");

    const initialSteps: TraceStep[] = [
      {
        agent: "scraper",
        name: "Precedent & Web Miner",
        status: "running",
        details: `Mining past editions (1.0, 2.0, winning PPTs) for ${organizerName || "hackathon"}...`,
      },
      {
        agent: "profiler",
        name: "Jury Profiler & Rubrics",
        status: "idle",
        details: "Profiling judging rubrics & scoring priorities...",
      },
      {
        agent: "feasibility",
        name: "Trade-off & Feasibility Engine",
        status: "idle",
        details: "Analyzing 'Why THIS vs Why NOT THAT' trade-offs...",
      },
      {
        agent: "blueprint",
        name: "Enterprise Architect",
        status: "idle",
        details: "Synthesizing Mermaid flowchart & system blueprint...",
      },
      {
        agent: "pitch",
        name: "Pitch Deck & Jury Defense",
        status: "idle",
        details: "Engineering winning slide deck & defense strategy...",
      },
    ];
    setTrace(initialSteps);

    const stepInterval = setInterval(() => {
      setTrace((prev) => {
        const runningIdx = prev.findIndex((s) => s.status === "running");
        if (runningIdx !== -1 && runningIdx + 1 < prev.length) {
          return prev.map((s, idx) => {
            if (idx === runningIdx) return { ...s, status: "completed" };
            if (idx === runningIdx + 1) return { ...s, status: "running" };
            return s;
          });
        }
        return prev;
      });
    }, 4500);

    const startTime = Date.now();

    try {
      const response = await apiFetch("/api/strategize", {
        method: "POST",
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
      if (data.trace && data.trace.length > 0) {
        setTrace(data.trace);
      } else {
        setTrace((prev) => prev.map((s) => ({ ...s, status: "completed" })));
      }
      const elapsed = data.meta?.total_time_ms || Date.now() - startTime;
      setLastExecutionTime(elapsed);
      toast(`Strategy synthesized in ${(elapsed / 1000).toFixed(1)}s`, "success");
    } catch (err: unknown) {
      console.error(err);
      if (err instanceof Error) {
        setError(err.message);
        toast(err.message, "error");
      } else {
        setError("Failed to execute pipeline");
        toast("Failed to execute pipeline", "error");
      }
    } finally {
      clearInterval(stepInterval);
      setLoading(false);
    }
  }, [
    problemStatement,
    loading,
    organizerName,
    selectedModel,
    temperature,
    systemInstruction,
    customConstraints,
    enabledAgents,
    toast,
  ]);

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
  }, [handleRun]);

  const handleReset = () => {
    setStrategyTitle("");
    setOrganizerName("");
    setProblemStatement("");
    setCustomConstraints("");
    setResult(null);
    setTrace([]);
    setError("");
    setLastExecutionTime(undefined);
  };

  const handleExport = (format: "markdown" | "json" | "mermaid") => {
    if (!result) return;
    let content = "";
    let filename = "";
    let type = "text/plain";

    const titleSlug = (strategyTitle || organizerName || "hackathon-strategy")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-");

    if (format === "markdown") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const whyThis = (result.feasibility_analysis?.why_this_feature || [])
        .map((f: any) => `- **${f.feature}**: ${f.why_chosen} (Rubric: ${f.rubric_alignment})`)
        .join("\n");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const whyNot = (result.feasibility_analysis?.why_not_that_feature || [])
        .map((f: any) => `- **${f.feature}**: ${f.why_rejected} (Risk Averted: ${f.risk_avoided})`)
        .join("\n");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const tradeoffs = (result.feasibility_analysis?.tech_tradeoffs || [])
        .map((t: any) => `- **${t.layer}**: Chose \`${t.chosen}\` over \`${t.alternative}\`. Rationale: ${t.tradeoff_rationale}`)
        .join("\n");

      content = `# ${strategyTitle || "Hackathon Strategy Blueprint"}
Hackathon Organizer: ${organizerName || "Open"}

## 1. Past Precedents & Winning Patterns Mined
${result.precedent_intelligence?.past_editions_analyzed || "No precedent intelligence available."}

### Winning PPT Presentation Strategy
${result.precedent_intelligence?.winning_ppt_strategy || "N/A"}

## 2. Jury Profile & Reverse-Engineered Rubrics
${result.jury_profile || "N/A"}

## 3. Trade-off Matrix: Why THIS vs Why NOT THAT
### Features INCLUDED (High Impact, High Rubric Fit):
${whyThis || "Standard feature set."}

### Features CUT / DEFERRED (Vanity Bloat & Crash Risk):
${whyNot || "None."}

### Comparative Technology Stack Rationale:
${tradeoffs || "Standard stack."}

## 4. Enterprise Architecture Blueprint
${result.final_blueprint?.architecture || "N/A"}

## 5. Pitch Deck & Presentation Flow
${JSON.stringify(result.final_blueprint?.pitch_outline?.slides || result.final_blueprint?.pitch_outline, null, 2)}
`;
      filename = `${titleSlug}.md`;
      toast("Exported Markdown report", "success");
    } else if (format === "json") {
      content = JSON.stringify(result, null, 2);
      filename = `${titleSlug}.json`;
      type = "application/json";
      toast("Exported JSON state", "success");
    } else if (format === "mermaid") {
      content = result.final_blueprint?.architecture || "";
      filename = `${titleSlug}-flowchart.mmd`;
      toast("Exported Mermaid flowchart", "success");
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
      <main className="flex flex-col min-h-screen bg-[#07070B] text-white selection:bg-accent-magenta/30 font-sans">
        {/* Top Application Header Shell */}
        <PlaygroundHeader
          title={strategyTitle}
          onTitleChange={setStrategyTitle}
          loading={loading}
          onRun={handleRun}
          onReset={handleReset}
          onOpenGetCode={() => setGetCodeOpen(true)}
          onExport={handleExport}
          lastExecutionTime={lastExecutionTime}
        />

        {/* 2-Column Split Studio Workspace */}
        <div className="flex-1 flex flex-col lg:flex-row w-full max-w-[1750px] mx-auto overflow-hidden">
          {/* Left Navigation & Presets Sidebar */}
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
              onLoadRun={handleLoadRun}
              onNewConversation={handleReset}
            />
          </div>

          {/* Main Interactive Studio Canvas */}
          <div className="flex-1 flex flex-col min-w-0 p-4 sm:p-6 lg:p-8 gap-6 overflow-y-auto">
            {/* Mobile Sidebar Toggle */}
            <div className="lg:hidden flex justify-end relative z-30">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-mono text-white/70"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-accent-pink" />
                <span>{sidebarOpen ? "Hide Config" : "Show Config"}</span>
              </button>
            </div>

            {/* Glowing Aurora Command Bar */}
            <div
              className={`transition-all duration-700 ease-in-out flex flex-col items-center justify-center relative ${
                !result && !loading ? "flex-1 w-full my-auto py-12" : ""
              }`}
            >
              {!result && !loading && (
                <div className="text-center mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700 relative z-10 max-w-xl mx-auto">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-magenta/10 border border-accent-magenta/30 text-[11px] font-mono text-accent-pink mb-3 shadow-[0_0_12px_rgba(192,43,214,0.3)]">
                    <Sparkles className="w-3 h-3" />
                    <span>Autonomous Agentic Swarm</span>
                  </div>
                  <h1 className="text-3xl md:text-[38px] font-bold tracking-tight text-white mb-2 font-sans">
                    Welcome back, <span className="text-gradient">{userName}</span>
                  </h1>
                  <p className="text-white/60 text-sm">
                    Enter any hackathon theme, problem statement, or select a preset to reverse-engineer jury rubrics and synthesize architecture.
                  </p>
                </div>
              )}

              <div className="relative group w-full z-10 animate-in fade-in zoom-in-95 duration-500 max-w-[680px] mx-auto flex flex-col">
                {/* Wide Thick Ambient Aurora Halo */}
                <div className="aurora-halo-ambient aurora-flow-gradient group-hover:opacity-75 group-focus-within:opacity-90 transition-all duration-500" />

                {/* Medium Bloom Aurora Glow */}
                <div className="aurora-halo-bloom aurora-flow-gradient group-hover:opacity-95 group-focus-within:opacity-100 transition-all duration-300" />

                {/* Crisp All-Edge Gradient Border Wrapper */}
                <div className="aurora-box-wrapper aurora-flow-gradient shadow-2xl shadow-purple-500/20 group-focus-within:shadow-purple-500/35">
                  {/* Inner Studio Command Box */}
                  <div className="relative bg-[#0D0D14] rounded-[1.25rem] flex flex-col shadow-2xl border border-white/5">
                    {/* Expanded Inputs (Organizer & Constraints) */}
                    {(result || loading || showConstraints) && (
                      <div className="flex items-center gap-2 px-4 pt-3 pb-2.5 bg-black/40 flex-wrap border-b border-white/10 rounded-t-[1.25rem]">
                        <input
                          type="text"
                          value={organizerName}
                          onChange={(e) => setOrganizerName(e.target.value)}
                          placeholder="Organizer (e.g. Smart India Hackathon)"
                          className="w-48 bg-transparent text-xs text-white placeholder-white/30 focus:outline-none font-mono"
                        />
                        <div className="h-3.5 w-[1px] bg-white/15 mx-1" />
                        <input
                          type="text"
                          value={customConstraints}
                          onChange={(e) => setCustomConstraints(e.target.value)}
                          placeholder="Constraints (e.g. sub-100ms latency, zero cloud cost)..."
                          className="bg-transparent text-xs text-white placeholder-white/30 focus:outline-none flex-1 min-w-0 font-mono"
                        />
                      </div>
                    )}

                    <div className="flex items-center relative">
                      {/* Main Problem Statement Textarea */}
                      <textarea
                        value={problemStatement}
                        onChange={(e) => setProblemStatement(e.target.value)}
                        placeholder="Describe your hackathon problem, theme guidelines, or system requirements..."
                        className="w-full min-h-[64px] max-h-[350px] bg-transparent px-4 py-3.5 text-[14px] leading-relaxed text-white placeholder-white/35 focus:outline-none resize-none font-sans"
                        rows={!result && !loading ? 3 : 2}
                      />
                    </div>

                    {/* Bottom Action Row */}
                    <div className="flex items-center justify-between px-3 pb-2.5 pt-1 border-t border-white/5">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setShowConstraints(!showConstraints)}
                          className={`p-1.5 rounded-lg text-xs transition-colors flex items-center gap-1.5 font-mono ${
                            showConstraints
                              ? "bg-white/15 text-white"
                              : "text-white/40 hover:text-white hover:bg-white/5"
                          }`}
                          title="Toggle Organizer & Constraint Fields"
                        >
                          <SlidersHorizontal className="w-3.5 h-3.5 text-accent-pink" />
                          <span className="text-[11px] hidden sm:inline">Advanced Parameters</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleRun}
                          disabled={loading || !problemStatement.trim()}
                          className="h-9 px-4 rounded-xl bg-gradient-to-r from-accent-pink to-accent-magenta hover:from-white hover:to-white text-black font-mono font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(255,92,147,0.4)] disabled:opacity-30 disabled:cursor-not-allowed group/btn"
                        >
                          {loading ? (
                            <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                          ) : (
                            <>
                              <span>Execute Swarm</span>
                              <svg
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="transition-transform group-hover/btn:translate-x-[2px]"
                              >
                                <path d="m5 12 7-7 7 7" />
                                <path d="M12 19V5" />
                              </svg>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Real-time Agent Swarm Execution Pipeline Trace */}
            {(loading || (result && trace.length > 0)) && (
              <div className="w-full max-w-[950px] mx-auto animate-in fade-in slide-in-from-bottom-3 duration-500">
                <AgentExecutionPipeline trace={trace} loading={loading} totalTimeMs={lastExecutionTime} />
              </div>
            )}

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs font-mono max-w-[950px] mx-auto w-full">
                {error}
              </div>
            )}

            {/* Results Studio Workspace */}
            {result && (
              <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-3 duration-500">
                {/* Modern Pill Tabs */}
                <div className="flex items-center gap-2 border-b border-white/10 pb-3 overflow-x-auto scrollbar-none">
                  <button
                    onClick={() => setActiveTab("architecture")}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono transition-all shrink-0 ${
                      activeTab === "architecture"
                        ? "bg-accent-magenta/20 text-white border border-accent-magenta/50 font-bold shadow-[0_0_15px_rgba(192,43,214,0.35)]"
                        : "text-white/60 hover:text-white hover:bg-white/5 border border-transparent"
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5 text-accent-magenta" />
                    <span>1. Architecture Blueprint</span>
                  </button>

                  <button
                    onClick={() => setActiveTab("jury")}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono transition-all shrink-0 ${
                      activeTab === "jury"
                        ? "bg-accent-pink/20 text-white border border-accent-pink/50 font-bold shadow-[0_0_15px_rgba(255,92,147,0.35)]"
                        : "text-white/60 hover:text-white hover:bg-white/5 border border-transparent"
                    }`}
                  >
                    <Award className="w-3.5 h-3.5 text-accent-pink" />
                    <span>2. Jury Profiler</span>
                  </button>

                  <button
                    onClick={() => setActiveTab("tradeoffs")}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono transition-all shrink-0 ${
                      activeTab === "tradeoffs"
                        ? "bg-emerald-500/20 text-white border border-emerald-500/50 font-bold shadow-[0_0_15px_rgba(16,185,129,0.35)]"
                        : "text-white/60 hover:text-white hover:bg-white/5 border border-transparent"
                    }`}
                  >
                    <Scale className="w-3.5 h-3.5 text-emerald-400" />
                    <span>3. Trade-offs Matrix</span>
                  </button>

                  <button
                    onClick={() => setActiveTab("pitch")}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono transition-all shrink-0 ${
                      activeTab === "pitch"
                        ? "bg-[#F08705]/20 text-white border border-[#F08705]/50 font-bold shadow-[0_0_15px_rgba(240,135,5,0.35)]"
                        : "text-white/60 hover:text-white hover:bg-white/5 border border-transparent"
                    }`}
                  >
                    <Presentation className="w-3.5 h-3.5 text-[#F08705]" />
                    <span>4. Pitch Deck & Q&A</span>
                  </button>

                  <button
                    onClick={() => setActiveTab("diagnostics")}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono transition-all shrink-0 ${
                      activeTab === "diagnostics"
                        ? "bg-blue-500/20 text-white border border-blue-500/50 font-bold shadow-[0_0_15px_rgba(59,130,246,0.35)]"
                        : "text-white/60 hover:text-white hover:bg-white/5 border border-transparent"
                    }`}
                  >
                    <Activity className="w-3.5 h-3.5 text-blue-400" />
                    <span>5. Diagnostics</span>
                  </button>

                  <button
                    onClick={() => setActiveTab("export")}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono transition-all shrink-0 ${
                      activeTab === "export"
                        ? "bg-white/20 text-white border border-white/40 font-bold shadow-lg"
                        : "text-white/60 hover:text-white hover:bg-white/5 border border-transparent"
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>6. Full Markdown</span>
                  </button>

                  <button
                    onClick={() => setActiveTab("intel")}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono transition-all shrink-0 ${
                      activeTab === "intel"
                        ? "bg-purple-500/20 text-white border border-purple-500/50 font-bold shadow-[0_0_15px_rgba(168,85,247,0.35)]"
                        : "text-white/60 hover:text-white hover:bg-white/5 border border-transparent"
                    }`}
                  >
                    <Globe2 className="w-3.5 h-3.5 text-purple-400" />
                    <span>7. Web & GitHub Intel</span>
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

                {/* Tab 5: Diagnostics */}
                {activeTab === "diagnostics" && (
                  <DiagnosticsTab trace={trace} meta={result.meta || {}} />
                )}

                {/* Tab 6: Full Markdown Report */}
                {activeTab === "export" && (
                  <MarkdownExportTab
                    organizerName={organizerName}
                    problemStatement={problemStatement}
                    juryProfile={result.jury_profile || ""}
                    architecture={result.final_blueprint?.architecture || ""}
                    pitchOutline={result.final_blueprint?.pitch_outline}
                  />
                )}

                {/* Tab 7: Web & Github Intel */}
                {activeTab === "intel" && (
                  <WebIntelTab
                    scrapedHistory={result.scraped_history || []}
                    searchQueries={result.precedent_intelligence?.search_queries_used || []}
                    githubIntel={result.github_intel || {}}
                  />
                )}
              </div>
            )}
          </div>
        </div>

        {/* Export / Get Code Modal */}
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
