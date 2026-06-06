import { UI } from "../../shared/constants/designTokens";
import PublicNavbar from "../../shared/components/PublicNavbar";
import PublicFooter from "../../shared/components/PublicFooter";
import HeroSection     from "./components/HeroSection";
import StatsBar        from "./components/StatsBar";
import FeaturesSection from "./components/FeaturesSection";
import PricingSection  from "./components/PricingSection";

export default function LandingPage() {
  return (
    <div
      style={{
        fontFamily: UI.font,
        background: UI.background,
        overflowX: "hidden",
      }}
    >
      <PublicNavbar />

      <main style={{ paddingTop: 68 }}>
        <HeroSection />
        <StatsBar />
        <FeaturesSection />
        <PricingSection />
      </main>

      <PublicFooter />
    </div>
  );
}
