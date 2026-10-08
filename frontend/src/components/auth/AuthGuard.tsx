"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";

/** Redirects to /login?next=<current path> when nobody is signed in. */
export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) router.replace(`/login?next=${encodeURIComponent(pathname || "/")}`);
  }, [loading, user, router, pathname]);

  if (loading || !user) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center gap-4 bg-[#0B0B10]">
        <div className="w-10 h-10 border-2 border-white/10 border-t-accent-pink rounded-full animate-spin" />
        <p className="text-xs font-mono text-white/40 tracking-widest uppercase">
          {loading ? "Restoring your workspace" : "Redirecting to sign in"}
        </p>
      </div>
    );
  }
  return <>{children}</>;
}
