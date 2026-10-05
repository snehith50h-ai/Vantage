"use client";

import { useRef } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import LightSheet from "./LightSheet";
import { cn } from "@/lib/utils";

const CASE_STUDIES = [
  { id: 1, logo: "ACME CORP", title: "How Acme shipped a winning hackathon project in 24 hours." },
  { id: 2, logo: "GLOBEX", title: "Globex used Strategist AI to win the global defi track." },
  { id: 3, logo: "SOYLENT", title: "Soylent accelerated their prototyping by 400%." },
  { id: 4, logo: "INITECH", title: "Initech built a scalable architecture for their pitch." },
  { id: 5, logo: "UMBRELLA", title: "Umbrella secured their infrastructure in record time." },
];

export default function Industries() {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = direction === "left" ? -400 : 400;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  return (
    <LightSheet previousSectionId="security-trust">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
        <h2 className="text-[clamp(32px,4vw,64px)] leading-[1.05] tracking-tight font-light text-ink-dark max-w-2xl">
          Powering <span className="text-gradient font-medium">hackathon winners</span> across industries
        </h2>
        <div className="flex gap-4">
          <button 
            onClick={() => scroll("left")}
            className="w-12 h-12 rounded-full border border-black/10 flex items-center justify-center hover:bg-black/5 transition-colors"
          >
            <ArrowLeft size={20} className="text-ink-dark" />
          </button>
          <button 
            onClick={() => scroll("right")}
            className="w-12 h-12 rounded-full border border-black/10 flex items-center justify-center hover:bg-black/5 transition-colors"
          >
            <ArrowRight size={20} className="text-ink-dark" />
          </button>
        </div>
      </div>

      <div 
        ref={scrollRef}
        className="flex gap-6 overflow-x-auto pb-12 snap-x snap-mandatory hide-scrollbar cursor-grab active:cursor-grabbing"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {CASE_STUDIES.map((study) => (
          <div 
            key={study.id} 
            className="snap-start min-w-[300px] md:min-w-[400px] h-[480px] bg-sheet-tint-blue rounded-[16px] p-8 flex flex-col group hover:-translate-y-[6px] transition-transform duration-300 shadow-md"
          >
            <div className="flex-grow flex items-center justify-center">
              {/* Monochrome Logo placeholder */}
              <div className="font-mono text-2xl font-bold text-ink-dark/30 tracking-widest uppercase">
                {study.logo}
              </div>
            </div>
            
            <div className="mt-auto">
              <h3 className="text-xl font-bold text-ink-dark mb-6 leading-tight">
                {study.title}
              </h3>
              <div className="flex items-center text-[11px] font-mono font-bold tracking-widest text-link-blue uppercase">
                READ CASE STUDY <span className="ml-2 transition-transform duration-300 group-hover:translate-x-2">→</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </LightSheet>
  );
}
