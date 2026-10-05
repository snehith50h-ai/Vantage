import LenisProvider from "@/components/LenisProvider";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import BuiltForIntro from "@/components/BuiltForIntro";
import Storytelling from "@/components/Storytelling";
import SecurityTrust from "@/components/SecurityTrust";
import UseCasesTabs from "@/components/UseCasesTabs";
import Industries from "@/components/Industries";
import FeaturesIndex from "@/components/FeaturesIndex";
import Blog from "@/components/Blog";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <LenisProvider>
      <main className="flex flex-col min-h-screen">
        <Navbar />
        
        {/* Dark Hero Section */}
        <div id="hero-section" className="relative z-0">
          <Hero />
        </div>

        {/* Light Sheet: Intro + Storytelling */}
        <div id="intro-story-section" className="relative z-10 w-full">
          <BuiltForIntro />
          {/* We place Storytelling directly inside the LightSheet styled area, 
              or rather, BuiltForIntro provides the LightSheet wrapper which we can expand,
              but since BuiltForIntro has its own LightSheet, let's wrap Storytelling 
              in a simple div that continues the light theme. */}
          <div className="bg-sheet text-ink-dark px-4 md:px-8 pb-32">
            <div className="max-w-7xl mx-auto w-full">
              <Storytelling />
            </div>
          </div>
        </div>

        {/* Dark Section: Security & Trust + Use Cases */}
        <div id="security-trust" className="relative z-20">
          <SecurityTrust />
          <UseCasesTabs />
        </div>

        {/* Light Sheet: Industries + Features + Blog */}
        <div className="relative z-30">
          <Industries />
          <FeaturesIndex />
          <Blog />
        </div>

        {/* Dark Footer */}
        <Footer />
        
      </main>
    </LenisProvider>
  );
}
