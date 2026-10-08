"use client";

import React, { useState, useEffect } from "react";
import {
  History,
  Folder,
  Plus,
  Settings,
  Clock,
  Filter,
  Trash2,
  FolderPlus,
  Sparkles,
  Search,
  X,
  ExternalLink,
  Cpu,
  Layers
} from "lucide-react";
import { apiFetch, setToken } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";

export interface PresetItem {
  id: string;
  name: string;
  organizer: string;
  problem: string;
  constraints: string;
  persona: string;
  tag: string;
}

export const PRESETS: PresetItem[] = [];

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
  onLoadRun?: (runData: any) => void;
  onNewConversation?: () => void;
}

export default function PlaygroundSidebar({
  systemInstruction,
  onSystemInstructionChange,
  temperature,
  onTemperatureChange,
  topP,
  onTopPChange,
  onSelectPreset,
  onLoadRun,
  onNewConversation,
}: PlaygroundSidebarProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [projects, setProjects] = useState<PresetItem[]>(PRESETS);
  const [runs, setRuns] = useState<any[]>([]);
  const [historySearch, setHistorySearch] = useState("");
  const [loadingRunId, setLoadingRunId] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  // Settings State
  const [defaultModel, setDefaultModel] = useState("gemini-3.5-flash-lite");
  const [savingSettings, setSavingSettings] = useState(false);

  const fetchRuns = () => {
    apiFetch("/api/me/runs")
      .then((res) => {
        if (!res.ok) return { runs: [] };
        return res.json();
      })
      .then((data) => {
        if (data.runs) setRuns(data.runs);
      })
      .catch(console.error);
  };

  useEffect(() => {
    fetchRuns();
  }, []);

  const handleSelectRun = async (runId: string) => {
    setLoadingRunId(runId);
    try {
      const res = await apiFetch(`/api/me/runs/${runId}`);
      if (!res.ok) throw new Error("Could not load run");
      const fullRun = await res.json();
      if (onLoadRun) {
        onLoadRun(fullRun);
        toast(`Loaded: ${fullRun.title || "Strategy Run"}`, "success");
      }
      setHistoryOpen(false);
    } catch (err) {
      console.error(err);
      toast("Failed to load run data", "error");
    } finally {
      setLoadingRunId(null);
    }
  };

  const handleDeleteRun = async (e: React.MouseEvent, runId: string) => {
    e.stopPropagation();
    try {
      const res = await apiFetch(`/api/me/runs/${runId}`, { method: "DELETE" });
      if (res.ok) {
        setRuns((prev) => prev.filter((r) => r.id !== runId));
        toast("Conversation deleted", "info");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateProject = () => {
    const name = prompt("Enter new project preset name:");
    if (name?.trim()) {
      const newProj: PresetItem = {
        id: Date.now().toString(),
        name: name.trim(),
        organizer: "",
        problem: "",
        constraints: "",
        persona: systemInstruction,
        tag: "Custom",
      };
      setProjects([...projects, newProj]);
      toast(`Created project preset: ${name}`, "success");
    }
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      await apiFetch("/api/me/settings", {
        method: "PUT",
        body: JSON.stringify({
          default_model: defaultModel,
          temperature,
          system_instruction: systemInstruction,
        }),
      });
      toast("Settings saved successfully", "success");
      setSettingsOpen(false);
    } catch (err) {
      console.error(err);
      toast("Failed to save settings", "error");
    } finally {
      setSavingSettings(false);
    }
  };

  const handleLogout = () => {
    setToken(null);
    toast("Logged out", "info");
    router.push("/login");
  };

  const filteredRuns = runs.filter((r) => {
    if (!historySearch.trim()) return true;
    const term = historySearch.toLowerCase();
    return (
      (r.title && r.title.toLowerCase().includes(term)) ||
      (r.organizer_name && r.organizer_name.toLowerCase().includes(term))
    );
  });

  return (
    <aside className="w-full lg:w-[270px] shrink-0 bg-[#0A0A10] flex flex-col h-full font-sans text-white/80 border-r border-white/10 relative transition-all">
      {/* New Conversation Button */}
      <div className="px-3 pt-4 pb-3">
        <button
          onClick={() => {
            if (onNewConversation) onNewConversation();
            toast("New conversation initiated", "info");
          }}
          className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white text-xs font-mono font-medium py-2 px-3 rounded-xl transition-all border border-white/10 hover:border-white/20 shadow-sm"
        >
          <Plus className="w-3.5 h-3.5 text-accent-pink" />
          <span>New Conversation</span>
        </button>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto px-3 pb-6 scrollbar-none text-xs flex flex-col gap-5">
        {/* Quick Tools */}
        <div className="flex flex-col gap-1">
          <button
            onClick={() => setHistoryOpen(true)}
            className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-white/5 text-white/70 hover:text-white transition-colors w-full text-left font-mono"
          >
            <div className="flex items-center gap-2">
              <History className="w-3.5 h-3.5 text-accent-pink" />
              <span>History Archive</span>
            </div>
            {runs.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 bg-white/10 rounded-full text-white/60">
                {runs.length}
              </span>
            )}
          </button>
        </div>

        {/* Project Presets (Only shown if custom created by user) */}
        {projects.length > 0 && (
          <div>
            <div className="px-2 flex items-center justify-between text-[11px] font-mono text-white/40 mb-1.5 uppercase tracking-wider">
              <span>Saved Presets</span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleCreateProject}
                  title="Create Preset"
                  className="text-white/40 hover:text-white transition-colors p-0.5"
                >
                  <FolderPlus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              {projects.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    onSelectPreset(p);
                    toast(`Loaded preset: ${p.name}`, "info");
                  }}
                  className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-white/5 text-white/70 hover:text-white transition-colors w-full text-left truncate group border border-transparent hover:border-white/5"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Folder className="w-3.5 h-3.5 text-accent-magenta/70 shrink-0" />
                    <span className="truncate">{p.name}</span>
                  </div>
                  {p.tag && (
                    <span className="text-[9px] font-mono px-1.5 py-0.2 bg-white/5 rounded text-white/40 group-hover:text-accent-pink shrink-0">
                      {p.tag}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Recent Runs */}
        <div>
          <div className="px-2 flex items-center justify-between text-[11px] font-mono text-white/40 mb-1.5 uppercase tracking-wider">
            <span>Recent Blueprints</span>
            <button
              onClick={fetchRuns}
              className="hover:text-white transition-colors text-[10px]"
              title="Refresh runs"
            >
              refresh
            </button>
          </div>
          <div className="flex flex-col gap-1">
            {runs.length === 0 ? (
              <span className="text-[11px] text-white/30 px-2 py-1 font-mono italic">
                No runs recorded yet
              </span>
            ) : (
              runs.slice(0, 8).map((r) => (
                <div
                  key={r.id}
                  onClick={() => handleSelectRun(r.id)}
                  className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-white/5 text-white/70 hover:text-white transition-colors w-full text-left cursor-pointer group border border-transparent hover:border-white/5 ${
                    loadingRunId === r.id ? "opacity-50 pointer-events-none" : ""
                  }`}
                >
                  <span className="truncate flex-1 font-sans text-xs">
                    {r.title || r.organizer_name || "Untitled Strategy"}
                  </span>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => handleDeleteRun(e, r.id)}
                      className="p-1 hover:text-red-400 text-white/40 transition-colors"
                      title="Delete run"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Bottom Settings Bar with extra clearance */}
      <div className="p-3 pb-8 mt-auto border-t border-white/5 bg-[#09090F]">
        <button
          onClick={() => setSettingsOpen(true)}
          className="flex items-center gap-2.5 px-2.5 py-2 text-xs font-mono text-white/60 hover:text-white rounded-lg hover:bg-white/5 transition-colors w-full text-left"
        >
          <Settings className="w-3.5 h-3.5 text-accent-pink" />
          <span>Settings</span>
        </button>
      </div>

      {/* History Archive Modal */}
      {historyOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#12121A] border border-white/10 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[80vh]">
            <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-[#151522]">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-accent-pink" />
                <h3 className="font-mono text-sm font-semibold text-white">History Archive</h3>
              </div>
              <button
                onClick={() => setHistoryOpen(false)}
                className="text-white/40 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 border-b border-white/5 bg-[#0D0D14]">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-white/40 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  placeholder="Search previous hackathon runs..."
                  className="w-full bg-[#14141E] border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-accent-pink"
                />
              </div>
            </div>

            <div className="p-4 overflow-y-auto flex-1 flex flex-col gap-2">
              {filteredRuns.length === 0 ? (
                <div className="text-center py-8 text-white/40 text-xs font-mono">
                  No matching strategies found.
                </div>
              ) : (
                filteredRuns.map((r) => (
                  <div
                    key={r.id}
                    onClick={() => handleSelectRun(r.id)}
                    className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-accent-pink/30 cursor-pointer transition-all flex items-center justify-between group"
                  >
                    <div>
                      <h4 className="text-xs font-semibold text-white group-hover:text-accent-pink transition-colors">
                        {r.title || r.organizer_name || "Untitled Strategy"}
                      </h4>
                      <p className="text-[11px] text-white/40 font-mono mt-0.5">
                        {r.organizer_name ? `Organizer: ${r.organizer_name}` : "Custom Run"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-white/30">
                        {r.created_at ? new Date(r.created_at).toLocaleDateString() : ""}
                      </span>
                      <ExternalLink className="w-3.5 h-3.5 text-white/40 group-hover:text-white" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {settingsOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#12121A] border border-white/10 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-[#151522]">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-accent-pink" />
                <h3 className="font-mono text-sm font-semibold text-white">Preferences</h3>
              </div>
              <button
                onClick={() => setSettingsOpen(false)}
                className="text-white/40 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 flex flex-col gap-4 text-xs font-mono">
              <div>
                <div className="flex justify-between text-white/70 mb-1.5">
                  <span>Temperature (Creativity)</span>
                  <span className="text-accent-pink">{temperature}</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1.5"
                  step="0.05"
                  value={temperature}
                  onChange={(e) => onTemperatureChange(parseFloat(e.target.value))}
                  className="w-full accent-accent-pink"
                />
              </div>

              <div>
                <label className="block text-white/70 mb-1.5">System Instruction Persona</label>
                <textarea
                  value={systemInstruction}
                  onChange={(e) => onSystemInstructionChange(e.target.value)}
                  rows={3}
                  className="w-full bg-[#0E0E16] border border-white/10 rounded-xl p-2.5 text-white placeholder-white/30 focus:outline-none focus:border-accent-pink font-sans text-xs"
                />
              </div>
            </div>

            <div className="px-5 py-3 border-t border-white/10 bg-[#0E0E16] flex justify-between items-center">
              <button
                onClick={handleLogout}
                className="text-red-400 hover:text-red-300 font-mono text-xs px-2 py-1 rounded transition-colors"
              >
                Sign Out
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSettingsOpen(false)}
                  className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white font-mono text-xs rounded-lg transition-colors border border-white/10"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveSettings}
                  disabled={savingSettings}
                  className="px-4 py-1.5 bg-accent-pink hover:bg-white text-black font-mono font-bold text-xs rounded-lg transition-colors shadow-sm disabled:opacity-50"
                >
                  {savingSettings ? "Saving..." : "Save Preferences"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
