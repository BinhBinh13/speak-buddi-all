import AppLayout      from "../../shared/components/AppLayout";
import RoadmapSection from "./components/RoadmapSection";

export default function DashboardPage() {
  return (
    <AppLayout>
      <main style={styles.main}>
        <RoadmapSection />
      </main>
    </AppLayout>
  );
}

const styles = {
  main: {
    padding: "28px clamp(20px, 3vw, 40px) 40px",
  },
};
