"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Sparkles } from "lucide-react";

export default function PlaygroundLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login?next=/playground");
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[#0B0B10] flex flex-col items-center justify-center text-white">
        <div className="inline-flex items-center justify-center w-12 h-12 mb-5 rounded-2xl bg-gradient-to-br from-accent-pink to-accent-magenta shadow-[0_0_30px_rgba(255,92,147,0.35)] animate-pulse">
          <Sparkles className="w-6 h-6 text-black" />
        </div>
        <p className="text-sm font-mono text-white/50 animate-pulse">Authenticating Workspace...</p>
      </div>
    );
  }

  return <>{children}</>;
}
