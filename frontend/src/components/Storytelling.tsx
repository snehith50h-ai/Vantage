"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
gsap.registerPlugin(ScrollTrigger);
import { cn } from "@/lib/utils";

const FEATURES = [
  { id: "feat-1", title: "Automated Tech Stacks", label: "01. Architecture" },
  { id: "feat-2", title: "Global Team Matching", label: "02. Collaboration" },
  { id: "feat-3", title: "AI-Powered Terminal", label: "03. Execution" },
  { id: "feat-4", title: "Real-time Profiling", label: "04. Optimization" },
];

export default function Storytelling() {
  const [activeFeature, setActiveFeature] = useState(FEATURES[0].id);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      FEATURES.forEach((feat) => {
        ScrollTrigger.create({
          trigger: `#${feat.id}`,
          start: "top center",
          end: "bottom center",
          onToggle: (self) => {
            if (self.isActive) setActiveFeature(feat.id);
          }
        });
      });

      // Card entrance animations
      const cards = gsap.utils.toArray<HTMLElement>(".feature-card-wrapper");
      cards.forEach((card) => {
        gsap.fromTo(
          card,
          { opacity: 0, y: 40, scale: 0.98 },
          { 
            opacity: 1, 
            y: 0, 
            scale: 1, 
            duration: 0.8, 
            ease: "power3.out",
            scrollTrigger: {
              trigger: card,
              start: "top 80%",
            }
          }
        );
      });

      // Benchmark bars animation
      ScrollTrigger.create({
        trigger: "#feat-1",
        start: "top 70%",
        animation: gsap.fromTo(
          ".benchmark-bar",
          { width: "0%" },
          { width: (i, target) => target.dataset.width, duration: 1.5, ease: "power3.out", stagger: 0.1 }
        )
      });

      // Chart line draw animation
      ScrollTrigger.create({
        trigger: "#feat-4",
        start: "top 70%",
        animation: gsap.fromTo(
          ".chart-path",
          { strokeDashoffset: 1000 },
          { strokeDashoffset: 0, duration: 2, ease: "power2.inOut" }
        )
      });

    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="mt-32 grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-16 items-start">
      {/* Sticky Left */}
      <div className="md:col-span-4 lg:col-span-3 md:sticky md:top-32 hidden md:block">
        <div className="font-mono text-[11px] tracking-[0.08em] font-bold uppercase mb-8">
          ● WHY VANTAGE
        </div>
        <div className="flex flex-col gap-6">
          {FEATURES.map((feat) => (
            <div 
              key={feat.id}
              className={cn(
                "transition-colors duration-400 font-medium text-lg cursor-pointer",
                activeFeature === feat.id ? "text-ink-dark" : "text-ink-muted"
              )}
            >
              {feat.title}
            </div>
          ))}
        </div>
      </div>

      {/* Scrolling Right */}
      <div className="md:col-span-8 lg:col-span-9 flex flex-col gap-32">
        {/* Card 1: Benchmark */}
        <div id="feat-1" className="feature-card-wrapper">
          <div className="bg-[#0B0B10] rounded-[16px] border border-white/10 p-6 md:p-8 min-h-[400px] flex flex-col shadow-xl">
            <div className="flex justify-between items-center mb-12">
              <div className="flex bg-[#1A1520] p-1 rounded-full border border-white/5">
                <div className="px-4 py-1.5 rounded-full bg-link-blue text-white text-xs font-mono font-bold">NEXT.JS</div>
                <div className="px-4 py-1.5 rounded-full text-white/50 text-xs font-mono font-bold">REACT</div>
              </div>
            </div>
            
            <div className="mt-auto space-y-4">
              {[
                { label: "Project Init", val: "3.8s", width: "15%", color: "bg-accent-pink" },
                { label: "Agent Planning", val: "12s", width: "40%", color: "bg-white/20" },
                { label: "Code Gen", val: "42s", width: "85%", color: "bg-white/20" },
                { label: "Deployment", val: "71s", width: "100%", color: "bg-white/20" }
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-4 text-white font-mono text-sm">
                  <div className="w-32 text-white/60">{item.label}</div>
                  <div className="flex-grow h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className={cn("benchmark-bar h-full rounded-full", item.color)} 
                      data-width={item.width}
                      style={{ width: "0%" }}
                    />
                  </div>
                  <div className="w-12 text-right">{item.val}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-6">
            <h3 className="text-xl font-bold text-ink-dark mb-2">Instant scaffolding</h3>
            <p className="text-ink-muted leading-relaxed">
              Generate fully configured Next.js and React projects in seconds, complete with UI libraries, authentication, and database connections ready to go.
            </p>
          </div>
        </div>

        {/* Card 2: Map */}
        <div id="feat-2" className="feature-card-wrapper">
          <div className="bg-sheet-card rounded-[16px] border border-black/5 p-6 md:p-8 min-h-[400px] relative overflow-hidden shadow-xl flex items-center justify-center">
            {/* Dotted map representation */}
            <div className="absolute inset-0 bg-dotted-dark opacity-10" />
            <div className="relative z-10 w-full h-full flex items-center justify-center">
              <div className="relative w-full max-w-lg aspect-[2/1] border border-black/5 rounded-xl bg-white/50 backdrop-blur-sm">
                 {/* Fake nodes */}
                 <div className="absolute top-1/4 left-1/4 w-3 h-3 bg-accent-pink rounded-full animate-pulse shadow-[0_0_10px_#FF5C93]" />
                 <div className="absolute top-1/3 right-1/3 w-3 h-3 bg-link-blue rounded-full animate-pulse shadow-[0_0_10px_#1F3A8A]" />
                 <div className="absolute bottom-1/4 left-1/2 w-3 h-3 bg-accent-magenta rounded-full animate-pulse shadow-[0_0_10px_#C02BD6]" />
                 
                 {/* Connection lines (SVG) */}
                 <svg className="absolute inset-0 w-full h-full opacity-20">
                   <path d="M 25% 25% Q 50% 10% 66% 33%" fill="transparent" stroke="#0B0B10" strokeWidth="2" strokeDasharray="4 4" />
                   <path d="M 66% 33% Q 60% 60% 50% 75%" fill="transparent" stroke="#0B0B10" strokeWidth="2" strokeDasharray="4 4" />
                 </svg>
                 
                 <div className="absolute top-1/4 left-[28%] bg-ink-dark text-white text-[10px] font-mono px-2 py-0.5 rounded shadow-md">US-EAST</div>
                 <div className="absolute top-1/3 right-[22%] bg-ink-dark text-white text-[10px] font-mono px-2 py-0.5 rounded shadow-md">EU-WEST</div>
              </div>
            </div>
          </div>
          <div className="mt-6">
            <h3 className="text-xl font-bold text-ink-dark mb-2">Global distribution</h3>
            <p className="text-ink-muted leading-relaxed">
              Match with team members globally based on skill profiles. Automatically sync repositories and deployments across regions.
            </p>
          </div>
        </div>

        {/* Card 3: Terminal */}
        <div id="feat-3" className="feature-card-wrapper">
          <div className="bg-black rounded-[16px] border border-white/10 p-6 md:p-8 min-h-[400px] shadow-xl font-mono text-sm">
            <div className="inline-block px-3 py-1 bg-white/10 text-white/80 rounded-md text-xs font-bold mb-8">
              TERMINAL
            </div>
            <div className="text-accent-pink mb-2">&gt; hackathon-ai init project</div>
            <div className="text-white/60 mb-1">Analyzing requirements...</div>
            <div className="text-white/60 mb-4">Generating blueprint...</div>
            
            <div className="space-y-2">
              {[
                { task: "Database Schema", status: "[DONE]" },
                { task: "API Routes", status: "[DONE]" },
                { task: "Frontend Components", status: "..." }
              ].map((item, i) => (
                <div key={i} className="flex justify-between max-w-sm">
                  <span className="text-white/80">{item.task}</span>
                  <span className={item.status === "[DONE]" ? "text-[#4ade80]" : "text-[#facc15] animate-pulse"}>{item.status}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-6">
            <h3 className="text-xl font-bold text-ink-dark mb-2">CLI Agent workflow</h3>
            <p className="text-ink-muted leading-relaxed">
              Run complex workflows directly from your terminal. Our agents understand your codebase and can generate missing pieces on the fly.
            </p>
          </div>
        </div>

        {/* Card 4: Chart */}
        <div id="feat-4" className="feature-card-wrapper">
          <div className="bg-sheet-card rounded-[16px] border border-black/5 p-6 md:p-8 min-h-[400px] flex flex-col shadow-xl">
            <div className="flex gap-4 border-b border-black/5 pb-4 mb-8 font-mono text-xs font-bold">
              <div className="text-ink-dark border-b-2 border-ink-dark pb-4 -mb-[17px] cursor-pointer">CPU</div>
              <div className="text-ink-muted cursor-pointer hover:text-ink-dark">MEMORY</div>
              <div className="text-ink-muted cursor-pointer hover:text-ink-dark">STARTUP</div>
            </div>
            
            <div className="flex-grow relative w-full h-full flex items-end">
              <svg viewBox="0 0 400 200" className="w-full h-full overflow-visible">
                <path 
                  className="chart-path" 
                  d="M0,150 C50,150 80,100 130,120 C180,140 220,50 280,70 C340,90 380,20 400,10" 
                  fill="none" 
                  stroke="#FF5C93" 
                  strokeWidth="4" 
                  strokeLinecap="round"
                  strokeDasharray="1000"
                  strokeDashoffset="1000"
                />
                <path 
                  className="chart-path" 
                  d="M0,180 C60,180 100,160 150,170 C200,180 250,120 300,130 C350,140 380,90 400,80" 
                  fill="none" 
                  stroke="#1F3A8A" 
                  strokeWidth="3" 
                  strokeLinecap="round"
                  strokeDasharray="1000"
                  strokeDashoffset="1000"
                  style={{ animationDelay: "0.2s" }}
                />
              </svg>
            </div>
            
            <div className="flex gap-4 mt-6 pt-4 border-t border-black/5">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-accent-pink" />
                <span className="text-xs font-mono font-bold text-ink-muted">API LOAD</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-link-blue" />
                <span className="text-xs font-mono font-bold text-ink-muted">DB QUERIES</span>
              </div>
            </div>
          </div>
          <div className="mt-6">
            <h3 className="text-xl font-bold text-ink-dark mb-2">Deep profiling</h3>
            <p className="text-ink-muted leading-relaxed">
              Identify bottlenecks before the judges do. Real-time profiling of your application to ensure it runs smoothly during the demo.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
