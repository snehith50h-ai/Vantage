"use client";

import React, { useState } from "react";
import {
  Presentation,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  Code2,
  Tv,
  Sparkles,
  MessageSquare,
  ShieldQuestion,
  HelpCircle,
  ShieldCheck
} from "lucide-react";

interface Slide {
  title: string;
  content: string;
  speaker_notes?: string;
}

interface DefenseQA {
  question: string;
  defense: string;
}

interface PitchDeckTabProps {
  pitchOutline: {
    slides?: Slide[];
    jury_defense_qa?: DefenseQA[];
  };
  juryDefenseQa?: DefenseQA[];
}

export default function PitchDeckTab({ pitchOutline, juryDefenseQa }: PitchDeckTabProps) {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const [showJson, setShowJson] = useState(false);

  const slides = pitchOutline?.slides && pitchOutline.slides.length > 0
    ? pitchOutline.slides
    : [
        {
          title: "1. The High-Stakes Problem",
          content: "Underground coal mining hazards require instant, low-cost sensor intelligence to prevent catastrophic subsidence events.",
          speaker_notes: "Grab attention immediately with the human and economic stakes involved.",
        },
        {
          title: "2. The AI-Powered Solution",
          content: "An edge-to-cloud AI early warning mesh with sub-second subsidence prediction and zero-latency audible alarms.",
          speaker_notes: "Show the unified product vision and emphasize low deployment cost.",
        },
        {
          title: "3. Enterprise Architecture & Trade-offs",
          content: "Decoupled microservices architecture utilizing Kafka event streaming, TimescaleDB time-series storage, and high-frequency edge inferencing.",
          speaker_notes: "Walk through the architectural flowchart to prove engineering excellence.",
        },
        {
          title: "4. Field Validation & Cost Impact",
          content: "Deployment cost under 10% of traditional systems with 99.4% prediction accuracy 45 minutes prior to structural shifts.",
          speaker_notes: "Highlight verified quantitative metrics that satisfy the judges' criteria.",
        },
        {
          title: "5. Why We Win The Hackathon",
          content: "Production-grade codebase, verified sensor prototypes, and a direct alignment with the judging rubric.",
          speaker_notes: "Close with a confident call to action and invite judges to test the live demo.",
        },
      ];

  const currentSlide = slides[currentSlideIndex] || slides[0];

  const qaList = juryDefenseQa || pitchOutline?.jury_defense_qa || [
    {
      question: "What happens if underground network connectivity is completely severed?",
      defense: "Our sensor nodes operate an ad-hoc LoRa mesh protocol with localized flash buffering. Alerts trigger locally via hardware sirens immediately, and sync back to cloud TimescaleDB once gateway connection is restored."
    },
    {
      question: "How did you keep the hardware cost under ₹15,000 per unit?",
      defense: "We replaced expensive multi-million rupee laser interferometers with high-precision MEMS accelerometers coupled with Kalman filtering on a low-power ESP32 edge microcontroller."
    },
    {
      question: "Why did you build this on Next.js and TimescaleDB instead of standard MERN stack?",
      defense: "Telemetry data is strictly time-series with spatial coordinates. TimescaleDB provides 90% hyper-table compression and native SQL range queries, whereas MongoDB requires expensive unindexed scans."
    }
  ];

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(pitchOutline, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full flex flex-col gap-6 animate-in fade-in duration-300">
      {/* Tab Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#12121A]/70 p-5 rounded-xl border border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-accent-pink shadow-[0_0_10px_rgba(255,92,147,0.7)]"></span>
            <h3 className="text-lg font-bold text-white tracking-tight">
              Pitch Deck & Jury Defense Arsenal
            </h3>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-accent-pink/20 text-accent-pink border border-accent-pink/30">
              {slides.length} Winning Slides
            </span>
          </div>
          <p className="text-xs text-muted-on-dark mt-1">
            Engineered slide-by-slide presentation with spoken notes and anticipated tough jury cross-examination defenses.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowJson(!showJson)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-colors border ${
              showJson
                ? "bg-accent-pink text-white border-accent-pink"
                : "bg-white/5 hover:bg-white/10 text-white border-white/10"
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>{showJson ? "View Slides" : "View JSON"}</span>
          </button>

          <button
            onClick={handleCopyJson}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white rounded-lg text-xs font-mono transition-colors border border-white/10"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? "Copied!" : "Copy Deck"}</span>
          </button>
        </div>
      </div>

      {!showJson ? (
        <div className="flex flex-col gap-6">
          {/* Main Slide Card Container */}
          <div className="relative min-h-[380px] bg-gradient-to-br from-[#161622] via-[#101018] to-[#0A0A10] rounded-2xl border border-white/15 p-8 sm:p-12 shadow-2xl flex flex-col justify-between overflow-hidden">
            {/* Top Slide Metadata Bar */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2 font-mono text-xs text-accent-pink uppercase tracking-widest font-semibold">
                <Tv className="w-4 h-4" />
                <span>Presentation Slide {currentSlideIndex + 1} of {slides.length}</span>
              </div>
              <span className="text-[11px] font-mono text-white/40">
                16:9 Presentation Format
              </span>
            </div>

            {/* Slide Body */}
            <div className="my-auto py-6">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-4 text-glow">
                {currentSlide.title}
              </h2>
              <p className="text-base sm:text-lg text-white/90 leading-relaxed font-sans max-w-3xl">
                {currentSlide.content}
              </p>
            </div>

            {/* Speaker Notes Drawer */}
            <div className="mt-8 pt-5 border-t border-white/10 bg-[#0B0B10]/70 -mx-8 sm:-mx-12 -mb-8 sm:-mb-12 p-6 sm:p-8 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-xs font-mono text-white/50 uppercase tracking-wider mb-2">
                <MessageSquare className="w-3.5 h-3.5 text-accent-pink" />
                <span>Speaker Presentation Notes</span>
              </div>
              <p className="text-xs sm:text-sm text-accent-pink/90 font-mono italic leading-relaxed">
                &ldquo;{currentSlide.speaker_notes || "Deliver this slide with high energy, focusing directly on the tangible prototype demo."}&rdquo;
              </p>
            </div>
          </div>

          {/* Navigation Bar */}
          <div className="flex items-center justify-between px-2">
            <button
              onClick={() => setCurrentSlideIndex((i) => Math.max(0, i - 1))}
              disabled={currentSlideIndex === 0}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white font-mono text-xs transition-colors disabled:opacity-30 disabled:cursor-not-allowed border border-white/10"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            {/* Slide Indicator Pills */}
            <div className="flex items-center gap-2">
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlideIndex(idx)}
                  className={`h-2.5 rounded-full transition-all duration-300 ${
                    currentSlideIndex === idx
                      ? "w-8 bg-accent-pink shadow-[0_0_10px_rgba(255,92,147,0.7)]"
                      : "w-2.5 bg-white/20 hover:bg-white/40"
                  }`}
                  title={`Go to Slide ${idx + 1}`}
                />
              ))}
            </div>

            <button
              onClick={() => setCurrentSlideIndex((i) => Math.min(slides.length - 1, i + 1))}
              disabled={currentSlideIndex === slides.length - 1}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white font-mono text-xs transition-colors disabled:opacity-30 disabled:cursor-not-allowed border border-white/10"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Jury Defense & Cross-Examination Q&A */}
          <div className="bg-[#101018] rounded-2xl border border-white/10 p-6 flex flex-col gap-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <h4 className="text-sm font-mono font-bold uppercase tracking-wider text-white">
                  Jury Cross-Examination Defense Arsenal
                </h4>
              </div>
              <span className="text-[11px] font-mono text-muted-on-dark">
                Anticipated Tough Inquiries & Winning Rebuttals
              </span>
            </div>

            <div className="space-y-3">
              {qaList.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-[#151522] border border-white/5 rounded-xl p-4 flex flex-col gap-2 hover:border-emerald-500/30 transition-colors"
                >
                  <div className="flex items-start gap-2">
                    <span className="text-xs font-mono font-bold text-rose-400 shrink-0 mt-0.5">Q{idx + 1}:</span>
                    <h5 className="text-xs sm:text-sm font-bold text-white leading-snug">
                      &quot;{item.question}&quot;
                    </h5>
                  </div>
                  <div className="flex items-start gap-2 mt-1 pl-4 border-l-2 border-emerald-500/40">
                    <p className="text-xs text-emerald-200/90 leading-relaxed">
                      <strong className="text-emerald-400">Winning Defense: </strong>
                      {item.defense}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Raw JSON Inspector */
        <div className="bg-[#0A0A10] rounded-2xl border border-white/10 p-5 overflow-x-auto relative shadow-xl">
          <button
            onClick={handleCopyJson}
            className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-md text-xs font-mono transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? "Copied JSON!" : "Copy JSON"}</span>
          </button>
          <pre className="font-mono text-xs text-white/80 leading-relaxed whitespace-pre">
            {JSON.stringify(pitchOutline, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
