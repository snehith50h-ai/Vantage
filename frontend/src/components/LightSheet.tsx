"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
gsap.registerPlugin(ScrollTrigger);
import { cn } from "@/lib/utils";

gsap.registerPlugin(ScrollTrigger);

interface LightSheetProps {
  children: React.ReactNode;
  className?: string;
  previousSectionId?: string;
}

export default function LightSheet({ children, className, previousSectionId }: LightSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // If there's a previous section, animate it scaling down and dimming
      if (previousSectionId) {
        const prevSection = document.getElementById(previousSectionId);
        if (prevSection) {
          ScrollTrigger.create({
            trigger: sheetRef.current,
            start: "top bottom",
            end: "top top",
            scrub: true,
            animation: gsap.to(prevSection, {
              scale: 0.96,
              opacity: 0.4,
              ease: "none",
            }),
          });
        }
      }
    }, sheetRef);

    return () => ctx.revert();
  }, [previousSectionId]);

  return (
    <div 
      ref={sheetRef}
      className={cn(
        "relative z-20 bg-sheet text-ink-dark rounded-t-[24px] w-full mt-[-40px] px-4 md:px-8 shadow-2xl",
        className
      )}
    >
      <div className="max-w-7xl mx-auto w-full py-24 md:py-32">
        {children}
      </div>
    </div>
  );
}
