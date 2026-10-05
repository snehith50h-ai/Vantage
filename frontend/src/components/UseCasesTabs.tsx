"use client";

import { useState, useRef } from "react";
import { Bot, Mic, Code, Zap, Globe, Cpu } from "lucide-react";
import gsap from "gsap";
import { cn } from "@/lib/utils";

const TABS = ["Agents", "Planning", "Pitching"];

const TAB_CONTENT: Record<string, Array<{icon: React.ReactNode; title: string; desc: string}>> = {
  "Agents": [
    { icon: <Bot />, title: "Code Gen Agent", desc: "Automatically generates boilerplate and business logic." },
    { icon: <Cpu />, title: "Profiler Agent", desc: "Analyzes code for performance bottlenecks in real-time." },
    { icon: <Zap />, title: "Debugger Agent", desc: "Finds and fixes syntax errors before you even run." },
    { icon: <Globe />, title: "Deploy Agent", desc: "Pushes your code to Vercel or AWS instantly." },
  ],
  "Planning": [
    { icon: <Code />, title: "Architecture Gen", desc: "Creates comprehensive system designs for your idea." },
    { icon: <Globe />, title: "API Planner", desc: "Designs RESTful and GraphQL schemas automatically." },
    { icon: <Bot />, title: "Task Breakdown", desc: "Splits your hackathon project into manageable tickets." },
    { icon: <Cpu />, title: "Tech Stack Selector", desc: "Recommends the best stack based on your team's skills." },
  ],
  "Pitching": [
    { icon: <Mic />, title: "Pitch Script Writer", desc: "Drafts a compelling 3-minute pitch for the judges." },
    { icon: <Zap />, title: "Slide Deck Gen", desc: "Creates beautiful slide layouts matching your project." },
    { icon: <Bot />, title: "Q&A Prep", desc: "Simulates judge questions and suggests answers." },
    { icon: <Code />, title: "Demo Flow", desc: "Scripts the perfect live demonstration sequence." },
  ]
};

export default function UseCasesTabs() {
  const [activeTab, setActiveTab] = useState(TABS[0]);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const cardsRef = useRef<HTMLDivElement>(null);
  const nextContentRef = useRef<string | null>(null);

  const handleTabChange = (tab: string) => {
    if (tab === activeTab || isTransitioning) return;
    
    setIsTransitioning(true);
    nextContentRef.current = tab;
    
    // Ghost double transition
    if (cardsRef.current) {
      const cards = cardsRef.current.children;
      gsap.to(cards, {
        y: -20,
        opacity: 0,
        duration: 0.3,
        stagger: 0.05,
        onComplete: () => {
          setActiveTab(tab);
          gsap.fromTo(
            cardsRef.current!.children,
            { y: 20, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.4, stagger: 0.05, onComplete: () => setIsTransitioning(false) }
          );
        }
      });
    }
  };

  return (
    <section className="relative py-32 bg-black px-6 z-10">
      <div className="max-w-5xl mx-auto w-full flex flex-col items-center">
        <h2 className="text-[clamp(32px,4vw,64px)] leading-[1.1] tracking-tight font-light text-text-on-dark mb-12 text-center">
          Built with Vantage
        </h2>
        
        {/* Segmented Control */}
        <div className="flex p-1 bg-[#1A1520] rounded-lg border border-white/10 mb-16">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              className={cn(
                "px-6 py-2.5 rounded-md text-sm font-mono tracking-wide transition-all duration-300",
                activeTab === tab 
                  ? "bg-link-blue text-white shadow-md" 
                  : "text-muted-on-dark hover:text-text-on-dark"
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Cards Grid */}
        <div ref={cardsRef} className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          {TAB_CONTENT[activeTab].map((card, i) => (
            <div key={i} className="bg-sheet-card rounded-[12px] border border-black/5 overflow-hidden flex flex-col group cursor-pointer shadow-lg hover:shadow-xl transition-shadow">
              <div className="h-2 w-full bg-sheet-tint-blue" />
              <div className="p-6 md:p-8 flex flex-col flex-grow">
                <div className="flex gap-4 items-start mb-4">
                  <div className="text-link-blue mt-1 opacity-80 group-hover:opacity-100 transition-opacity">
                    {card.icon}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-ink-dark mb-2">{card.title}</h3>
                    <p className="text-ink-muted leading-relaxed line-clamp-2">{card.desc}</p>
                  </div>
                </div>
                <div className="mt-auto pt-6 flex items-center text-[11px] font-mono font-bold tracking-widest text-link-blue uppercase group-hover:text-accent-pink transition-colors">
                  TRY NOW <span className="ml-2 transition-transform group-hover:translate-x-1">→</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
