import React from "react";
import { Search, Link as LinkIcon, Code, Terminal, FileText } from "lucide-react";

interface ScrapedItem {
  project_name: string;
  description: string;
  url?: string;
}

interface GithubIntel {
  summary: string;
  readmes: { repo: string; readme: string }[];
}

interface WebIntelTabProps {
  scrapedHistory: ScrapedItem[];
  searchQueries: string[];
  githubIntel: GithubIntel;
}

export default function WebIntelTab({ scrapedHistory, searchQueries, githubIntel }: WebIntelTabProps) {
  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      
      {/* Search Queries Section */}
      <div className="bg-[#12121A] border border-white/10 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-3 opacity-10">
          <Search className="w-24 h-24" />
        </div>
        <div className="flex items-center gap-3 mb-6 relative z-10">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
            <Search className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">Search Queries</h3>
            <p className="text-xs text-muted-on-dark font-mono">Live queries executed by the DuckDuckGo Scraper Agent</p>
          </div>
        </div>

        <div className="flex flex-col gap-3 relative z-10">
          {searchQueries && searchQueries.length > 0 ? (
            searchQueries.map((query, idx) => (
              <div key={idx} className="flex items-center gap-3 p-3 bg-black/40 border border-white/5 rounded-xl font-mono text-xs">
                <Terminal className="w-4 h-4 text-purple-400" />
                <span className="text-white">{query}</span>
              </div>
            ))
          ) : (
            <div className="text-xs text-muted-on-dark italic">No queries logged.</div>
          )}
        </div>
      </div>

      {/* Web Intel / Scraped History */}
      <div className="bg-[#12121A] border border-white/10 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
            <LinkIcon className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">Discovered URLs & Snippets</h3>
            <p className="text-xs text-muted-on-dark font-mono">Top precedents identified across the web</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {scrapedHistory && scrapedHistory.length > 0 ? (
            scrapedHistory.map((item, idx) => (
              <div key={idx} className="flex flex-col gap-2 p-4 bg-black/40 border border-white/10 rounded-xl hover:border-blue-500/50 transition-colors">
                <h4 className="text-sm font-bold text-white">{item.project_name}</h4>
                <p className="text-xs text-white/60 line-clamp-3 leading-relaxed">{item.description}</p>
                {item.url && (
                  <a href={item.url} target="_blank" rel="noreferrer" className="text-[11px] font-mono text-blue-400 hover:text-blue-300 mt-2 flex items-center gap-1.5 truncate">
                    <LinkIcon className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">{item.url}</span>
                  </a>
                )}
              </div>
            ))
          ) : (
            <div className="text-xs text-muted-on-dark italic">No web history found.</div>
          )}
        </div>
      </div>

      {/* Github Intel */}
      <div className="bg-[#12121A] border border-white/10 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-3 opacity-10">
          <Code className="w-24 h-24" />
        </div>
        <div className="flex items-center gap-3 mb-6 relative z-10">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
            <Code className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">GitHub Deep Diver Intel</h3>
            <p className="text-xs text-muted-on-dark font-mono">{githubIntel?.summary || "No Github repos analyzed"}</p>
          </div>
        </div>

        <div className="flex flex-col gap-4 relative z-10">
          {githubIntel && githubIntel.readmes && githubIntel.readmes.length > 0 ? (
            githubIntel.readmes.map((repo, idx) => (
              <div key={idx} className="flex flex-col gap-3 p-4 bg-black/40 border border-white/10 rounded-xl">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <a href={repo.repo} target="_blank" rel="noreferrer" className="text-sm font-bold font-mono text-emerald-400 hover:text-emerald-300 flex items-center gap-2">
                    <Code className="w-4 h-4" />
                    {repo.repo.replace("https://github.com/", "")}
                  </a>
                  <span className="text-[10px] font-mono uppercase bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded">README Extracted</span>
                </div>
                <div className="bg-[#0A0A10] p-3 rounded-lg border border-white/5 max-h-48 overflow-y-auto">
                  <p className="text-[11px] font-mono text-white/50 whitespace-pre-wrap leading-relaxed">
                    {repo.readme}
                    {repo.readme.length >= 1000 && "..."}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="p-6 bg-black/40 border border-white/5 rounded-xl flex items-center justify-center gap-2 text-xs text-muted-on-dark font-mono">
              <FileText className="w-4 h-4" />
              No READMEs extracted for this session.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
