"use client";

import { ArrowUpRight, Newspaper } from "lucide-react";

const POSTS = [
  {
    id: 1,
    date: "OCT 24, 2026",
    category: "ENGINEERING",
    title: "How we built the AI-Powered Terminal Agent",
  },
  {
    id: 2,
    date: "OCT 12, 2026",
    category: "PRODUCT",
    title: "Introducing Real-time Profiling for Next.js",
  },
  {
    id: 3,
    date: "SEP 28, 2026",
    category: "COMMUNITY",
    title: "Top 10 Hackathon Winning Architectures of 2026",
  }
];

export default function Blog() {
  return (
    <div className="py-32 px-6 bg-sheet">
      <div className="max-w-7xl mx-auto w-full">
        <div className="flex justify-between items-end mb-12">
          <h2 className="text-[clamp(32px,4vw,48px)] leading-[1.1] tracking-tight font-light text-ink-dark">
            Latest from our blog
          </h2>
          <button className="hidden md:block px-5 py-2.5 rounded-md bg-transparent border border-black/10 text-ink-dark hover:bg-black/5 transition-all font-mono text-[11px] tracking-[0.08em] uppercase font-bold">
            SEE ALL
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {POSTS.map((post) => (
            <div key={post.id} className="group cursor-pointer">
              <div className="relative aspect-[4/3] rounded-xl overflow-hidden mb-6 bg-black">
                {/* Fake Ribbon Art background */}
                <div className="absolute inset-0 bg-ribbon-gradient opacity-30 group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-dotted-dark opacity-50" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Newspaper size={48} className="text-white/50" strokeWidth={1} />
                </div>
                {/* Hover arrow */}
                <div className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center opacity-0 -translate-y-2 translate-x-2 group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0 transition-all duration-300">
                  <ArrowUpRight size={20} className="text-white" />
                </div>
              </div>
              
              <div className="flex items-center gap-3 font-mono text-[10px] tracking-widest font-bold text-ink-muted mb-3">
                <span>{post.date}</span>
                <span className="w-1 h-1 rounded-full bg-black/20" />
                <span>{post.category}</span>
              </div>
              
              <h3 className="text-xl font-medium text-ink-dark leading-snug group-hover:text-link-blue transition-colors line-clamp-3">
                {post.title}
              </h3>
            </div>
          ))}
        </div>
        
        <button className="md:hidden mt-8 w-full px-5 py-3 rounded-md bg-transparent border border-black/10 text-ink-dark hover:bg-black/5 transition-all font-mono text-[11px] tracking-[0.08em] uppercase font-bold">
          SEE ALL
        </button>
      </div>
    </div>
  );
}
