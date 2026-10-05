"use client";

import React, { useState } from "react";
import { Copy, Check, Download, FileText } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownExportTabProps {
  organizerName: string;
  problemStatement: string;
  juryProfile: string;
  architecture: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  pitchOutline: any;
}

export default function MarkdownExportTab({
  organizerName,
  problemStatement,
  juryProfile,
  architecture,
  pitchOutline,
}: MarkdownExportTabProps) {
  const [copied, setCopied] = useState(false);

  const fullMarkdown = `# Hackathon Strategy Blueprint
**Organizer:** ${organizerName || "Target Hackathon"}  
**Problem Statement:**  
> ${problemStatement || "Problem Statement"}

---

## 1. Jury Profile & Judging Rubric
${juryProfile || "*(No jury profile generated yet)*"}

---

## 2. Technical System Architecture & Flowchart
${architecture || "*(No architecture generated yet)*"}

---

## 3. Pitch Deck Presentation Outline (5 Slides)
${
  pitchOutline?.slides
    ? pitchOutline.slides
        .map(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (s: any, i: number) =>
            `### Slide ${i + 1}: ${s.title}\n\n${s.content}\n\n*Speaker Notes: ${
              s.speaker_notes || "N/A"
            }*`
        )
        .join("\n\n")
    : "*(No pitch outline generated yet)*"
}
`;

  const handleCopy = () => {
    navigator.clipboard.writeText(fullMarkdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([fullMarkdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `hackathon-strategy-${Date.now()}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full flex flex-col gap-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#12121A]/70 p-5 rounded-xl border border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-accent-pink shadow-[0_0_10px_rgba(255,92,147,0.7)]"></span>
            <h3 className="text-lg font-bold text-white tracking-tight">
              Comprehensive Strategy Blueprint (.md)
            </h3>
          </div>
          <p className="text-xs text-muted-on-dark mt-1">
            Complete unified strategy document ready for team submission, Devpost writeup, and pitch prep.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white rounded-lg text-xs font-mono transition-colors border border-white/10"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download .md</span>
          </button>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-accent-pink/20 hover:bg-accent-pink/30 text-accent-pink rounded-lg text-xs font-mono transition-colors border border-accent-pink/40"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? "Copied!" : "Copy Markdown"}</span>
          </button>
        </div>
      </div>

      <div className="bg-[#12121A]/80 rounded-2xl border border-white/10 p-8 shadow-xl text-[14px] leading-relaxed text-muted-on-dark markdown-content">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {fullMarkdown}
        </ReactMarkdown>
      </div>
    </div>
  );
}
