"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
gsap.registerPlugin(ScrollTrigger);
import { ArrowRight } from "lucide-react";

const FEATURES = [
  "Automated Dependency Management", "API Schema Generation",
  "Real-time Collaboration", "Role-based Access Control",
  "Continuous Integration", "One-click Deployment",
  "Database Migration Scripts", "Unit Test Scaffolding",
  "End-to-End Testing", "Performance Profiling",
  "Security Scanning", "Log Aggregation",
  "Custom Agent Workflows", "Third-party Integrations",
  "Analytics Dashboard", "Pitch Deck Generator"
];

export default function FeaturesIndex() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const rows = gsap.utils.toArray<HTMLElement>(".feature-row");
      ScrollTrigger.create({
        trigger: containerRef.current,
        start: "top 70%",
        animation: gsap.fromTo(
          rows,
          { opacity: 0, y: 10 },
          { opacity: 1, y: 0, duration: 0.5, stagger: 0.05, ease: "power2.out" }
        )
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="py-32 px-6 bg-sheet">
      <div className="max-w-7xl mx-auto w-full grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-16 items-start">
        <div className="md:col-span-4 lg:col-span-3">
          <div className="font-mono text-[11px] tracking-[0.08em] font-bold uppercase text-ink-muted">
            ● FEATURES
          </div>
        </div>
        
        <div className="md:col-span-8 lg:col-span-9">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 border-t border-black/5">
            {FEATURES.map((feat, i) => (
              <div 
                key={i} 
                className="feature-row group flex items-center justify-between py-4 border-b border-black/5 cursor-pointer transition-all duration-300 hover:bg-white hover:px-4 rounded-md hover:shadow-sm"
              >
                <span className="text-ink-dark font-medium transition-transform duration-300 group-hover:translate-x-2">
                  {feat}
                </span>
                <ArrowRight 
                  size={16} 
                  className="text-ink-muted opacity-0 -translate-x-4 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0 group-hover:text-link-blue group-hover:-rotate-45" 
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
