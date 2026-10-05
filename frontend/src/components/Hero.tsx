"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import Link from "next/link";
import RibbonArt from "./RibbonArt";

export default function Hero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const logosRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    // Reveal animation
    const ctx = gsap.context(() => {
      // Headline lines slide up
      const lines = gsap.utils.toArray<HTMLElement>(".reveal-line");
      gsap.fromTo(
        lines,
        { yPercent: 100 },
        { yPercent: 0, duration: 0.9, stagger: 0.1, ease: "power3.out", delay: 0.2 }
      );
      
      // Colored word fade in
      gsap.fromTo(
        ".gradient-word",
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: 1, ease: "power2.inOut", delay: 0.8 }
      );

      // Content fade in
      gsap.fromTo(
        contentRef.current,
        { autoAlpha: 0, y: 20 },
        { autoAlpha: 1, y: 0, duration: 0.8, ease: "power3.out", delay: 0.6 }
      );

      // Logos stagger fade
      gsap.fromTo(
        ".partner-logo",
        { autoAlpha: 0, y: 10 },
        { autoAlpha: 0.6, y: 0, duration: 0.8, stagger: 0.1, ease: "power3.out", delay: 1 }
      );


    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section 
      ref={containerRef}
      className="relative min-h-screen pt-32 pb-20 flex flex-col justify-center px-6 overflow-hidden bg-dotted-dark"
    >
      <RibbonArt />



      <div className="max-w-7xl mx-auto w-full z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center flex-grow">
        <div className="lg:col-span-8 flex flex-col gap-6">
          <h1 ref={headlineRef} className="text-[clamp(48px,6vw,96px)] leading-[1.05] tracking-tight font-light">
            <div className="overflow-hidden pb-2"><div className="reveal-line">AI-powered agents to</div></div>
            <div className="overflow-hidden pb-2"><div className="reveal-line">plan, profile, and</div></div>
            <div className="overflow-hidden pb-2"><div className="reveal-line"><span className="gradient-word text-gradient font-medium opacity-0">perfect</span> your project</div></div>
          </h1>
        </div>

        <div ref={contentRef} className="lg:col-span-4 flex flex-col gap-8 lg:mt-24 opacity-0">
          <p className="text-[15px] md:text-[17px] leading-relaxed text-muted-on-dark max-w-sm">
            Developers and teams competing in hackathons use Vantage to accelerate their builds. Production speed without the production complexity.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <Link href="/playground" className="px-6 py-3 rounded-md bg-accent-pink text-black hover:bg-white transition-all font-mono text-[12px] tracking-[0.08em] uppercase font-bold hover:-translate-y-[2px] shadow-lg inline-block">
              LAUNCH PLAYGROUND
            </Link>
            <Link href="/demo" className="px-6 py-3 rounded-md bg-[#1A1520] border border-white/10 text-white hover:bg-white/10 transition-all font-mono text-[12px] tracking-[0.08em] uppercase font-bold hover:-translate-y-[2px] inline-block">
              QUICK DEMO
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto w-full z-10 mt-20">
        <div ref={logosRef} className="flex justify-between items-center gap-4 flex-wrap border-t border-white/10 pt-8">
          {["Vercel", "OpenAI", "Supabase", "Stripe", "GitHub", "Prisma", "Devfolio"].map((partner) => (
            <div key={partner} className="partner-logo text-white/60 font-mono text-sm uppercase tracking-wider font-bold opacity-0">
              {partner}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
