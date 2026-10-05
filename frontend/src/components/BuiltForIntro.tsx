"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
gsap.registerPlugin(ScrollTrigger);
import LightSheet from "./LightSheet";

export default function BuiltForIntro() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const lines = gsap.utils.toArray<HTMLElement>(".intro-reveal-line");
      
      ScrollTrigger.create({
        trigger: containerRef.current,
        start: "top 70%",
        animation: gsap.fromTo(
          lines,
          { yPercent: 100 },
          { yPercent: 0, duration: 0.9, stagger: 0.1, ease: "power3.out" }
        )
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <LightSheet previousSectionId="hero-section">
      <div ref={containerRef} className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-16 items-start">
        <div className="md:col-span-4 lg:col-span-3">
          <div className="text-[16px] font-medium text-ink-muted border-l-2 border-accent-pink pl-4">
            Production speed without the production complexity.
          </div>
        </div>
        
        <div className="md:col-span-8 lg:col-span-9">
          <h2 className="text-[clamp(36px,4.5vw,72px)] leading-[1.05] tracking-tight font-light text-ink-dark">
            <div className="overflow-hidden pb-2">
              <div className="intro-reveal-line">Built for teams that want</div>
            </div>
            <div className="overflow-hidden pb-2">
              <div className="intro-reveal-line">
                to win with <span className="text-gradient font-medium">strategy</span>
              </div>
            </div>
          </h2>
        </div>
      </div>
    </LightSheet>
  );
}
