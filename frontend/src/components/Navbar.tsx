"use client";

import Link from "next/link";
import { ChevronDown, Grip, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import UserMenu from "@/components/auth/UserMenu";
import { Logo } from "@/components/Logo";

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex items-center justify-between pointer-events-auto bg-black/40 backdrop-blur-md border-b border-white/5">
      {/* Logo */}
      <Link href="/" className="font-mono text-xl tracking-widest font-bold z-10 flex items-center gap-3 group">
        <Logo size={48} className="group-hover:scale-110 transition-transform" />
        VANTAGE
      </Link>

      {/* Links & Buttons */}
      <div className="hidden lg:flex items-center gap-4 xl:gap-5 font-mono text-[10px] xl:text-[11px] tracking-[0.08em] text-muted-on-dark uppercase">
        
        {/* Dropdown for Features */}
        <div className="relative group cursor-pointer h-full flex items-center">
          <div className="flex items-center gap-1 hover:text-text-on-dark transition-colors py-2">
            PLATFORM <ChevronDown size={14} className="opacity-70 group-hover:rotate-180 transition-transform" />
          </div>
          
          <div className="absolute top-[100%] left-0 hidden group-hover:flex flex-col bg-[#0B0B10] border border-white/10 rounded-xl p-3 gap-2 min-w-[220px] shadow-2xl z-50">
            <Link href="/team" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-accent-magenta/15 text-white/80 hover:text-accent-magenta transition-all">
              TEAM INTELLIGENCE
            </Link>
            <Link href="/scope" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-red-500/15 text-white/80 hover:text-red-400 transition-all">
              SCOPE ASSASSIN
            </Link>
            <Link href="/execution" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-blue-500/15 text-white/80 hover:text-blue-400 transition-all">
              EXECUTION ENGINE
            </Link>
            <Link href="/xray" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-purple-500/15 text-white/80 hover:text-purple-400 transition-all">
              PROJECT X-RAY
            </Link>
            <Link href="/mentor" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-amber-500/15 text-white/80 hover:text-amber-400 transition-all">
              AI MENTOR
            </Link>
            <Link href="/github" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-500/15 text-white/80 hover:text-slate-400 transition-all">
              GITHUB INTEL
            </Link>
            <Link href="/postmortem" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-emerald-500/15 text-white/80 hover:text-emerald-400 transition-all">
              POSTMORTEM
            </Link>
          </div>
        </div>

        <Link 
          href="/playground" 
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent-pink/15 text-accent-pink border border-accent-pink/40 hover:bg-accent-pink hover:text-black transition-all font-bold shadow-[0_0_15px_rgba(255,92,147,0.3)] animate-pulse"
        >
          <Sparkles size={13} />
          PLAYGROUND
        </Link>

        <div className="flex items-center gap-1 cursor-pointer hover:text-text-on-dark transition-colors">
          USE CASES <ChevronDown size={14} className="opacity-70" />
        </div>
        <Link href="/demo" className="hover:text-text-on-dark transition-colors">DEMO</Link>
        <Link href="#pricing" className="hover:text-text-on-dark transition-colors">PRICING</Link>
        <Link href="#docs" className="hover:text-text-on-dark transition-colors">DOCS</Link>
        <Link href="#blog" className="hover:text-text-on-dark transition-colors">BLOG</Link>
        
        <div className="w-[1px] h-4 bg-white/10 mx-1" />
        
        <button className="hover:text-text-on-dark transition-colors" aria-label="Apps">
          <Grip size={16} />
        </button>
        
        <div className="flex items-center gap-3 ml-1">
          <Link 
            href="/playground" 
            className="px-4 py-2 rounded-md bg-accent-pink text-black hover:bg-white transition-all font-semibold hover:-translate-y-[1px]"
          >
            TRY PLAYGROUND
          </Link>
          <UserMenu compact={true} />
        </div>
      </div>
    </nav>
  );
}
