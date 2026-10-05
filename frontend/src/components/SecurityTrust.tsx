"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
gsap.registerPlugin(ScrollTrigger);
import { Shield, Lock, Server, CheckCircle } from "lucide-react";
import SphereArt from "./SphereArt";
import { cn } from "@/lib/utils";

const ITEMS = [
  {
    icon: <Shield size={24} className="text-accent-pink" />,
    title: "Enterprise-grade planning",
    desc: "Generate architectures that scale from day one, incorporating industry best practices.",
  },
  {
    icon: <Lock size={24} className="text-link-blue" />,
    title: "Secure by default",
    desc: "All generated code follows strict security guidelines, preventing common vulnerabilities.",
  },
  {
    icon: <Server size={24} className="text-accent-magenta" />,
    title: "Isolated environments",
    desc: "Test your agents in complete isolation. Zero interference between hackathon projects.",
  },
  {
    icon: <CheckCircle size={24} className="text-white" />,
    title: "100% Uptime Guarantee",
    desc: "Our platform stays up when you need it most. No downtime during submission hours.",
  },
];

export default function SecurityTrust() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const items = gsap.utils.toArray<HTMLElement>(".trust-item");
      
      items.forEach((item, i) => {
        ScrollTrigger.create({
          trigger: item,
          start: "top 60%",
          end: "bottom 40%",
          onEnter: () => gsap.to(item, { opacity: 1, duration: 0.4 }),
          onLeave: () => gsap.to(item, { opacity: 0.35, duration: 0.4 }),
          onEnterBack: () => gsap.to(item, { opacity: 1, duration: 0.4 }),
          onLeaveBack: () => gsap.to(item, { opacity: 0.35, duration: 0.4 }),
        });
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section id="security-trust" className="relative min-h-screen py-32 bg-black px-6">
      <SphereArt />
      
      <div ref={containerRef} className="max-w-7xl mx-auto w-full relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-16 items-start mt-20">
        <div className="lg:col-span-5 lg:sticky lg:top-32">
          <h2 className="text-[clamp(36px,4.5vw,72px)] leading-[1.05] tracking-tight font-light text-text-on-dark mb-8">
            Stable, <span className="text-gradient font-medium">secure</span> and compliant
          </h2>
          <div className="flex flex-wrap gap-4">
            <button className="px-5 py-2.5 rounded-md bg-accent-pink text-black hover:bg-white transition-all font-mono text-[11px] tracking-[0.08em] uppercase font-bold hover:-translate-y-[1px]">
              STATUS PAGE ↗
            </button>
            <button className="px-5 py-2.5 rounded-md bg-[#1A1520] border border-white/10 text-white hover:bg-white/10 transition-all font-mono text-[11px] tracking-[0.08em] uppercase font-bold hover:-translate-y-[1px]">
              SECURITY DOCS
            </button>
          </div>
        </div>

        <div className="lg:col-span-7 flex flex-col gap-12 lg:pl-16 lg:mt-32 pb-32">
          {ITEMS.map((item, i) => (
            <div key={i} className="trust-item opacity-35 flex gap-6 items-start transition-opacity">
              <div className="mt-1">{item.icon}</div>
              <div>
                <h3 className="text-2xl font-bold text-text-on-dark mb-2">{item.title}</h3>
                <p className="text-lg text-muted-on-dark leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
