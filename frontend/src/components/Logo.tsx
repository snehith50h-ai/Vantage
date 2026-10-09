"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  loading?: boolean;
  size?: number;
}

export function Logo({ className, loading = false, size = 64 }: LogoProps) {
  return (
    <div className={cn("relative flex items-center justify-center isolate", className)}>
      {/* Outer ambient glow - massive soft bloom */}
      <div 
        className={cn(
          "absolute inset-[-50%] rounded-full blur-[24px] transition-all duration-1000 bg-gradient-to-r from-[#FF107A] via-[#7A10FF] to-[#00E5FF]",
          loading ? "opacity-50 animate-spin-slow scale-[1.2]" : "opacity-0 scale-90",
          "will-change-transform will-change-opacity transform-gpu mix-blend-screen pointer-events-none"
        )}
      />
      
      {/* Inner concentrated core glow */}
      <div 
        className={cn(
          "absolute inset-[-10%] rounded-full blur-[10px] transition-all duration-700 bg-gradient-to-tr from-[#FF107A] via-[#7A10FF] to-[#00E5FF]",
          loading ? "opacity-80 animate-spin-slow scale-[1.1]" : "opacity-30 scale-100",
          "will-change-transform will-change-opacity transform-gpu mix-blend-plus-lighter pointer-events-none"
        )}
      />

      {/* Pure white hot core for loading state */}
      <div className={cn(
        "absolute inset-[15%] rounded-full blur-[6px] bg-white transition-opacity duration-700 mix-blend-screen pointer-events-none",
        loading ? "opacity-70 animate-pulse" : "opacity-0"
      )} />

      <Image
        src="/v-logo-transparent.png"
        alt="Vantage AI Logo"
        width={size}
        height={size}
        priority
        className={cn(
          "relative z-10 object-contain transition-all duration-700",
          loading ? "scale-[1.02]" : "scale-100"
        )}
        style={{
          filter: loading ? "drop-shadow(0 0 10px rgba(255,255,255,0.6))" : "drop-shadow(0 0 4px rgba(255,255,255,0.2))"
        }}
      />
    </div>
  );
}
