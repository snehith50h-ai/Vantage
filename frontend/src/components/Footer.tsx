"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
gsap.registerPlugin(ScrollTrigger);
import { Globe, Code, Briefcase, MessageCircle } from "lucide-react";
import RibbonArt from "./RibbonArt";

export default function Footer() {
  const ctaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: ctaRef.current,
        start: "top 80%",
        animation: gsap.fromTo(
          ".footer-cta-content",
          { y: 40, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" }
        )
      });
    }, ctaRef);
    return () => ctx.revert();
  }, []);

  return (
    <footer className="relative bg-black pt-24 pb-8 px-6 overflow-hidden mt-[-40px] rounded-t-[24px] z-30">
      <div className="absolute bottom-[-20%] left-0 right-0 h-[600px] opacity-40 pointer-events-none transform rotate-180 mix-blend-screen">
        <RibbonArt />
      </div>

      <div className="max-w-7xl mx-auto w-full relative z-10 flex flex-col min-h-[60vh]">
        
        {/* Top Link Columns */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-24 text-[13px] text-muted-on-dark">
          <div className="col-span-2 lg:col-span-1 mb-8 lg:mb-0 flex flex-col justify-between">
            <div>
              <div className="font-mono text-sm tracking-widest font-bold text-white mb-6">
                STRATEGIST
              </div>
              <p className="max-w-xs leading-relaxed">
                Production speed without the production complexity.
              </p>
            </div>
            <div className="flex gap-4 mt-8">
              <Globe size={18} className="hover:text-white cursor-pointer transition-colors" />
              <Code size={18} className="hover:text-white cursor-pointer transition-colors" />
              <Briefcase size={18} className="hover:text-white cursor-pointer transition-colors" />
              <MessageCircle size={18} className="hover:text-white cursor-pointer transition-colors" />
            </div>
          </div>
          
          <div className="flex flex-col gap-3">
            <h4 className="font-mono font-bold text-white mb-2">PRODUCT</h4>
            <Link href="#" className="hover:text-white transition-colors">Agents</Link>
            <Link href="#" className="hover:text-white transition-colors">Terminal</Link>
            <Link href="#" className="hover:text-white transition-colors">Security</Link>
            <Link href="#" className="hover:text-white transition-colors">Pricing</Link>
          </div>
          <div className="flex flex-col gap-3">
            <h4 className="font-mono font-bold text-white mb-2">RESOURCES</h4>
            <Link href="#" className="hover:text-white transition-colors">Documentation</Link>
            <Link href="#" className="hover:text-white transition-colors">API Reference</Link>
            <Link href="#" className="hover:text-white transition-colors">Case Studies</Link>
            <Link href="#" className="hover:text-white transition-colors">Blog</Link>
          </div>
          <div className="flex flex-col gap-3">
            <h4 className="font-mono font-bold text-white mb-2">COMPANY</h4>
            <Link href="#" className="hover:text-white transition-colors">About Us</Link>
            <Link href="#" className="hover:text-white transition-colors">Careers</Link>
            <Link href="#" className="hover:text-white transition-colors">Contact</Link>
            <Link href="#" className="hover:text-white transition-colors">Partners</Link>
          </div>
          <div className="flex flex-col gap-3">
            <h4 className="font-mono font-bold text-white mb-2">LEGAL</h4>
            <Link href="#" className="hover:text-white transition-colors">Status</Link>
            <Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-white transition-colors">Terms of Service</Link>
          </div>
        </div>

        {/* Big CTA */}
        <div ref={ctaRef} className="flex-grow flex flex-col items-center justify-center text-center mt-12 mb-32">
          <div className="footer-cta-content">
            <h2 className="text-[clamp(28px,4vw,56px)] font-light text-white mb-10 max-w-3xl leading-tight">
              Build your hackathon winning project today.
            </h2>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <button className="px-8 py-4 rounded-md bg-accent-pink text-black hover:bg-white transition-all font-mono text-[13px] tracking-[0.08em] uppercase font-bold hover:-translate-y-[2px] shadow-[0_0_20px_rgba(255,92,147,0.4)]">
                GET STARTED
              </button>
              <button className="px-8 py-4 rounded-md bg-[#1A1520] border border-white/10 text-white hover:bg-white/10 transition-all font-mono text-[13px] tracking-[0.08em] uppercase font-bold hover:-translate-y-[2px]">
                BOOK A DEMO
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-mono tracking-widest text-white/40">
          <div>2026 © VANTAGE</div>
          <div className="flex flex-wrap gap-4 md:gap-8 justify-center">
            <Link href="#" className="hover:text-white transition-colors">BRAND ASSETS</Link>
            <Link href="#" className="hover:text-white transition-colors">PRIVACY POLICY</Link>
            <Link href="#" className="hover:text-white transition-colors">TERMS OF SERVICE</Link>
            <Link href="#" className="hover:text-white transition-colors">COOKIE PREFERENCES</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
