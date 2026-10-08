"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Settings, Library, BarChart3, ChevronDown } from "lucide-react";
import { useAuth } from "./AuthProvider";

export function Avatar({ name, src, size = 28 }: { name: string; src?: string | null; size?: number }) {
  const initials = name
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={name} width={size} height={size} referrerPolicy="no-referrer" className="rounded-full object-cover ring-1 ring-white/15" style={{ width: size, height: size }} />;
  }
  return (
    <span
      className="rounded-full bg-gradient-to-br from-accent-pink to-accent-magenta text-black font-bold flex items-center justify-center ring-1 ring-white/15 select-none"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {initials || "?"}
    </span>
  );
}

/**
 * Signed-in: avatar + dropdown (Library, Usage, Settings, Sign out).
 * Signed-out: "Log in" / "Sign up" buttons.
 */
export default function UserMenu({ compact = false }: { compact?: boolean }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  if (loading) return <div className="w-7 h-7 rounded-full bg-white/10 animate-pulse" aria-hidden />;

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Link
          id="nav-login"
          href="/login"
          className="px-3.5 py-1.5 rounded-md bg-pill-blue/10 text-pill-blue hover:bg-pill-blue/20 transition-all font-semibold font-mono text-[11px] tracking-[0.08em] uppercase"
        >
          Log in
        </Link>
        {!compact && (
          <Link
            id="nav-signup"
            href="/signup"
            className="px-3.5 py-1.5 rounded-md bg-accent-pink text-black hover:bg-white transition-all font-semibold font-mono text-[11px] tracking-[0.08em] uppercase"
          >
            Sign up
          </Link>
        )}
      </div>
    );
  }

  const item = "flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] text-white/80 hover:text-white hover:bg-white/[0.06] transition-colors normal-case tracking-normal font-sans";

  return (
    <div className="relative" ref={ref}>
      <button
        id="user-menu-button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full hover:bg-white/[0.06] border border-transparent hover:border-white/10 transition-all"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Avatar name={user.name} src={user.avatar_url} />
        {!compact && <span className="hidden xl:inline text-[12px] font-sans normal-case tracking-normal text-white/80 max-w-[120px] truncate">{user.name}</span>}
        <ChevronDown className={`w-3.5 h-3.5 text-white/50 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-64 rounded-2xl border border-white/10 bg-[#101018]/95 backdrop-blur-xl shadow-[0_20px_60px_-10px_rgba(0,0,0,0.8)] p-1.5 z-[60] animate-in fade-in zoom-in-95 duration-150 origin-top-right"
        >
          <div className="flex items-center gap-3 px-3 py-3 border-b border-white/[0.06] mb-1">
            <Avatar name={user.name} src={user.avatar_url} size={36} />
            <div className="min-w-0">
              <div className="text-sm font-semibold text-white truncate normal-case tracking-normal font-sans">{user.name}</div>
              <div className="text-[11px] text-white/45 truncate normal-case tracking-normal font-sans">{user.email}</div>
            </div>
          </div>
          <Link id="menu-library" href="/library" className={item} onClick={() => setOpen(false)}>
            <Library className="w-4 h-4 text-accent-pink" /> My library
          </Link>
          <Link id="menu-usage" href="/account?tab=usage" className={item} onClick={() => setOpen(false)}>
            <BarChart3 className="w-4 h-4 text-blue-400" /> Usage
          </Link>
          <Link id="menu-settings" href="/account" className={item} onClick={() => setOpen(false)}>
            <Settings className="w-4 h-4 text-white/60" /> Settings
          </Link>
          <div className="h-px bg-white/[0.06] my-1" />
          <button
            id="menu-logout"
            className={`${item} w-full text-left hover:!text-red-300 hover:!bg-red-500/10`}
            onClick={() => {
              setOpen(false);
              logout();
              router.push("/login");
            }}
          >
            <LogOut className="w-4 h-4" /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}
