import { COLORS, FONTS } from "../constants/theme";
import { userProfile, dashboardStats } from "../../features/dashboard/data/mockData";
import { Avatar } from "../../features/dashboard/components/DashboardLayout";

const DAYS = ["Chủ nhật", "Thứ hai", "Thứ ba", "Thứ tư", "Thứ năm", "Thứ sáu", "Thứ bảy"];
const MONTHS = ["tháng 1","tháng 2","tháng 3","tháng 4","tháng 5","tháng 6","tháng 7","tháng 8","tháng 9","tháng 10","tháng 11","tháng 12"];

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Chào buổi sáng";
  if (h < 18) return "Chào buổi chiều";
  return "Chào buổi tối";
}

export default function DashboardTopbar() {
  const now = new Date();
  const dateStr = `${DAYS[now.getDay()]}, ${now.getDate()} ${MONTHS[now.getMonth()]} ${now.getFullYear()}`;

  return (
    <header
      style={{
        height: 64, background: COLORS.white,
        borderBottom: `1px solid ${COLORS.creamDark}`,
        display: "flex", alignItems: "center",
        justifyContent: "space-between",
        padding: "0 28px",
        position: "sticky", top: 0, zIndex: 10,
      }}
    >
      {/* Left: greeting */}
      <div>
        <div style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 17, color: COLORS.navy, lineHeight: 1.2 }}>
          {greeting()}, {userProfile.name}! 👋
        </div>
        <div style={{ fontFamily: FONTS.body, fontSize: 12, color: COLORS.stone, marginTop: 1 }}>
          {dateStr}
        </div>
      </div>

      {/* Right: streak + bell + avatar */}
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        {/* Streak badge */}
        <div
          style={{
            display: "flex", alignItems: "center", gap: 6,
            background: "#FEF3DC", borderRadius: 99,
            padding: "5px 13px",
          }}
        >
          <span style={{ fontSize: 16 }}>🔥</span>
          <span style={{ fontFamily: FONTS.body, fontWeight: 700, fontSize: 14, color: COLORS.amber }}>
            {dashboardStats.streak} ngày
          </span>
        </div>

        {/* Notifications */}
        <button
          style={{
            width: 36, height: 36, borderRadius: "50%",
            background: COLORS.creamDark, border: "none", cursor: "pointer",
            fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center",
            position: "relative",
          }}
          title="Thông báo"
        >
          🔔
          <span
            style={{
              position: "absolute", top: 4, right: 4,
              width: 8, height: 8, borderRadius: "50%",
              background: COLORS.coral,
              border: `2px solid ${COLORS.white}`,
            }}
          />
        </button>

        {/* Avatar */}
        <Avatar name={userProfile.name} size={36} />
      </div>
    </header>
  );
}
