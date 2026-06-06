import { useNavigate } from "react-router-dom";
import { COLORS, FONTS } from "../../../shared/constants/theme";
import { useInView } from "../../../shared/hooks/useInView";

export default function CTABanner() {
  const [ref, inView] = useInView();
  const navigate = useNavigate();
  const goToSpeaking = () => navigate("/speaking", { state: { freeTopic: { prompt: "" } } });

  return (
    <section style={{ background: `linear-gradient(135deg, ${COLORS.emeraldDark} 0%, ${COLORS.emerald} 50%, #16C47F 100%)`, padding: "80px clamp(20px, 5vw, 80px)" }}>
      <div ref={ref} style={{ maxWidth: 720, margin: "0 auto", textAlign: "center", opacity: inView ? 1 : 0, transform: inView ? "none" : "translateY(20px)", transition: "all 0.6s ease" }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>🎯</div>
        <h2 style={{ fontFamily: FONTS.display, fontSize: "clamp(28px, 3.5vw, 44px)", fontWeight: 700, color: "white", letterSpacing: "-0.8px", marginBottom: 16 }}>
          Ready to speak English<br />with more confidence?
        </h2>
        <p style={{ fontFamily: FONTS.body, fontSize: 16, color: "rgba(255,255,255,0.75)", marginBottom: 32 }}>
          No sign-up needed. Hit one button, start talking to AI right now.
        </p>
        <button onClick={goToSpeaking} style={{ fontFamily: FONTS.body, fontSize: 15, fontWeight: 600, background: "white", color: COLORS.emeraldDark, border: "none", borderRadius: 12, padding: "16px 36px", cursor: "pointer", boxShadow: "0 4px 20px rgba(0,0,0,0.15)", transition: "transform 0.15s" }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "")}>
          🎤 Try speaking now — completely free →
        </button>
      </div>
    </section>
  );
}
