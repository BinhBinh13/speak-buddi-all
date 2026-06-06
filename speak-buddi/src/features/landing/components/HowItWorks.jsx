import { COLORS, FONTS } from "../../../shared/constants/theme";
import { useInView } from "../../../shared/hooks/useInView";

const STEPS = [
  {
    num: "01",
    title: "Sign up & pick your level",
    desc: "Create a free account and choose your current level (Beginner, Elementary, Intermediate...) to start at the right place on the roadmap.",
  },
  {
    num: "02",
    title: "Follow the roadmap",
    desc: "Open lessons in order. Each lesson is tied to a real-world topic with specific vocabulary and grammar to prepare you before speaking.",
  },
  {
    num: "03",
    title: "Practice speaking with AI",
    desc: "Tap into a lesson and start talking directly with the AI. Speak naturally in English — the AI will respond and keep the conversation going.",
  },
];

export default function HowItWorks() {
  const [ref, inView] = useInView();
  return (
    <section style={{ background: COLORS.navy, padding: "100px clamp(20px, 5vw, 80px)" }}>
      <div style={{ maxWidth: 1160, margin: "0 auto" }}>
        <div ref={ref} style={{ textAlign: "center", marginBottom: 64, opacity: inView ? 1 : 0, transition: "all 0.6s ease" }}>
          <div style={{ display: "inline-block", background: "rgba(15,169,104,0.15)", borderRadius: 99, padding: "5px 16px", marginBottom: 16, fontFamily: FONTS.body, fontSize: 13, color: COLORS.emeraldLight, fontWeight: 500 }}>How it works</div>
          <h2 style={{ fontFamily: FONTS.display, fontSize: "clamp(28px, 3.5vw, 44px)", fontWeight: 700, color: "white", letterSpacing: "-0.8px" }}>
            Start speaking better<br />in just 3 steps
          </h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
          {STEPS.map(({ num, title, desc }, i) => (
            <StepCard key={num} num={num} title={title} desc={desc} delay={i * 120} />
          ))}
        </div>
      </div>
    </section>
  );
}

function StepCard({ num, title, desc, delay }) {
  const [ref, inView] = useInView();
  return (
    <div ref={ref} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: "28px 22px", opacity: inView ? 1 : 0, transform: inView ? "none" : "translateY(20px)", transition: `all 0.5s ease ${delay}ms` }}>
      <div style={{ fontFamily: FONTS.display, fontSize: 40, fontWeight: 700, color: COLORS.emerald, opacity: 0.4, marginBottom: 14, lineHeight: 1 }}>{num}</div>
      <h3 style={{ fontFamily: FONTS.display, fontSize: 18, fontWeight: 700, color: "white", marginBottom: 10 }}>{title}</h3>
      <p style={{ fontFamily: FONTS.body, fontSize: 14, color: "rgba(255,255,255,0.5)", lineHeight: 1.65 }}>{desc}</p>
    </div>
  );
}
