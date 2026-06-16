import { LandingNav }           from "@/components/landing/LandingNav";
import { HeroSection }           from "@/components/landing/HeroSection";
import { LogoBar }               from "@/components/landing/LogoBar";
import { ProblemSection }        from "@/components/landing/ProblemSection";
import { LiveDemoSection }       from "@/components/landing/LiveDemoSection";
import { FeaturesSection }       from "@/components/landing/FeaturesSection";
import { NeuralNetworkSection }  from "@/components/landing/NeuralNetworkSection";
import { KnowledgeGraphSection } from "@/components/landing/KnowledgeGraphSection";
import { WorkflowSection }       from "@/components/landing/WorkflowSection";
import { ShowcaseSection }       from "@/components/landing/ShowcaseSection";
import { FoundersSection }       from "@/components/landing/FoundersSection";
import { PricingSection }        from "@/components/landing/PricingSection";
import { FaqSection }            from "@/components/landing/FaqSection";
import { CtaSection }            from "@/components/landing/CtaSection";
import { LandingFooter }         from "@/components/landing/LandingFooter";
import { OnboardingGuide }       from "@/components/onboarding/OnboardingGuide";
import { WelcomeExperience }     from "@/components/onboarding/WelcomeExperience";
import { AIAvatarGuide }         from "@/components/avatar/AIAvatarGuide";
import { AICopilot }             from "@/components/copilot/AICopilot";
import { CursorGlow, MagneticButtons } from "@/components/ui/MicroInteractions";

export default function LandingPage() {
  return (
    <main className="relative overflow-x-hidden" style={{ background: "var(--bg)" }}>
      {/* Global UI layers */}
      <WelcomeExperience />
      <CursorGlow />
      <MagneticButtons />
      <AIAvatarGuide />
      <OnboardingGuide />
      <AICopilot />

      <LandingNav />
      <HeroSection />
      <LogoBar />
      <ProblemSection />

      {/* Core WOW features */}
      <LiveDemoSection />
      <NeuralNetworkSection />
      <KnowledgeGraphSection />

      {/* Standard sections */}
      <FeaturesSection />
      <WorkflowSection />
      <ShowcaseSection />

      {/* Trust + social proof */}
      <FoundersSection />
      <PricingSection />
      <FaqSection />
      <CtaSection />
      <LandingFooter />
    </main>
  );
}
