"use client";

import React, { useState } from "react";
import { X, Copy, Check, Terminal, FileCode, Cpu, Braces } from "lucide-react";

interface GetCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  organizerName: string;
  problemStatement: string;
  model: string;
  temperature: number;
}

export default function GetCodeModal({
  isOpen,
  onClose,
  organizerName,
  problemStatement,
  model,
  temperature,
}: GetCodeModalProps) {
  const [activeTab, setActiveTab] = useState<"python" | "typescript" | "curl" | "json">("python");
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const org = organizerName || "Smart India Hackathon";
  const prob = problemStatement || "AI-enabled Low Cost Real Time Mine Subsidence Monitoring";

  const pythonCode = `import os
import requests
from dotenv import load_dotenv

load_dotenv()

# Vantage Multi-Agent Swarm API
API_BASE = os.getenv("VANTAGE_API_URL", "http://localhost:8000")
API_URL = f"{API_BASE}/api/playground/generate"

payload = {
    "organizer_name": "${org.replace(/"/g, '\\"')}",
    "problem_statement": "${prob.replace(/"/g, '\\"').slice(0, 150)}...",
    "model": "${model}",
    "temperature": ${temperature},
    "enabled_agents": ["scraper", "profiler", "blueprint", "pitch"]
}

response = requests.post(API_URL, json=payload)
data = response.json()

print(f"Jury Profile:\\n{data.get('jury_profile')}\\n")
print(f"Architecture Blueprint:\\n{data.get('final_blueprint', {}).get('architecture')}\\n")
print(f"Execution Latency: {data.get('meta', {}).get('total_time_ms')}ms")
`;

  const typescriptCode = `// Next.js / TypeScript API Client
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function generateHackathonStrategy() {
  const response = await fetch(\`\${API_BASE}/api/playground/generate\`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      organizer_name: "${org.replace(/"/g, '\\"')}",
      problem_statement: "${prob.replace(/"/g, '\\"').slice(0, 150)}...",
      model: "${model}",
      temperature: ${temperature},
      enabled_agents: ["scraper", "profiler", "blueprint", "pitch"],
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to execute agent swarm");
  }

  const result = await response.json();
  console.log("Jury Profile:", result.jury_profile);
  console.log("Architecture Blueprint:", result.final_blueprint.architecture);
  return result;
}
`;

  const curlCode = `curl -X POST "http://localhost:8000/api/playground/generate" \\
  -H "Content-Type: application/json" \\
  -d '{
    "organizer_name": "${org.replace(/"/g, '\\"')}",
    "problem_statement": "${prob.replace(/"/g, '\\"').slice(0, 150)}...",
    "model": "${model}",
    "temperature": ${temperature}
  }'
`;

  const jsonCode = JSON.stringify(
    {
      organizer_name: org,
      problem_statement: prob,
      model: model,
      temperature: temperature,
      enabled_agents: ["scraper", "profiler", "blueprint", "pitch"],
    },
    null,
    2
  );

  const getCodeContent = () => {
    switch (activeTab) {
      case "python":
        return pythonCode;
      case "typescript":
        return typescriptCode;
      case "curl":
        return curlCode;
      case "json":
        return jsonCode;
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getCodeContent());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-[#0B0B10] border border-white/15 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#12121A]/90">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-accent-magenta/20 border border-accent-magenta/40 flex items-center justify-center text-accent-magenta">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                Get Code
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-accent-pink/10 text-accent-pink border border-accent-pink/20">
                  API Client Export
                </span>
              </h3>
              <p className="text-xs text-muted-on-dark">
                Production-ready code snippets to integrate this strategy swarm into your stack.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Language Tabs */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-white/10 bg-[#0E0E15]">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("python")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono transition-colors ${
                activeTab === "python"
                  ? "bg-accent-magenta/20 text-accent-magenta border border-accent-magenta/40 font-semibold"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>Python SDK</span>
            </button>
            <button
              onClick={() => setActiveTab("typescript")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono transition-colors ${
                activeTab === "typescript"
                  ? "bg-accent-pink/20 text-accent-pink border border-accent-pink/40 font-semibold"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>TypeScript</span>
            </button>
            <button
              onClick={() => setActiveTab("curl")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono transition-colors ${
                activeTab === "curl"
                  ? "bg-accent-magenta/20 text-accent-magenta border border-accent-magenta/40 font-semibold"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>cURL</span>
            </button>
            <button
              onClick={() => setActiveTab("json")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono transition-colors ${
                activeTab === "json"
                  ? "bg-white/20 text-white border border-white/30 font-semibold"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              }`}
            >
              <Braces className="w-3.5 h-3.5" />
              <span>JSON Schema</span>
            </button>
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-accent-pink hover:bg-white text-black font-mono font-bold text-xs rounded-lg transition-all shadow-[0_0_15px_rgba(255,92,147,0.3)]"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? "Copied!" : "Copy Code"}</span>
          </button>
        </div>

        {/* Code Content */}
        <div className="flex-1 p-6 overflow-auto bg-[#07070B] font-mono text-xs text-white/90 leading-relaxed selection:bg-accent-magenta/30">
          <pre className="whitespace-pre">{getCodeContent()}</pre>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-white/10 bg-[#12121A]/80 flex items-center justify-between text-xs text-muted-on-dark font-mono">
          <span>Target Endpoint: http://localhost:8000/api/playground/generate</span>
          <span className="text-accent-pink">Auth: None (Dev Mode)</span>
        </div>
      </div>
    </div>
  );
}
