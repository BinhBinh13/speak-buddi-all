// LevelCompleteAlert — thông báo khi hoàn thành toàn bộ topic trong level hiện tại
import { Link } from "react-router-dom";

const PRIMARY   = "#3525cd";
const SECONDARY = "#006c49";
const FONT      = "'Be Vietnam Pro', system-ui, sans-serif";

export default function LevelCompleteAlert({ level, levelName, onDismiss }) {
  return (
    <div
      role="alert"
      style={{
        marginBottom: 20,
        padding: "16px 20px",
        borderRadius: 14,
        border: `2px solid ${SECONDARY}`,
        background: "#ecfdf5",
        fontFamily: FONT,
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <span style={{ fontSize: 22, lineHeight: 1 }} aria-hidden="true">🎉</span>
        <div style={{ flex: 1 }}>
          <p style={{ margin: "0 0 4px", fontWeight: 700, fontSize: 15, color: "#065f46" }}>
            Chúc mừng! Bạn đã hoàn thành level {levelName || level}
          </p>
          <p style={{ margin: 0, fontSize: 13, color: "#047857", lineHeight: 1.5 }}>
            Bạn có thể nâng trình độ lên level tiếp theo. Hãy vào trang{" "}
            <Link to="/profile" style={{ color: PRIMARY, fontWeight: 600 }}>
              Hồ sơ &amp; Cài đặt
            </Link>{" "}
            để đổi level và tiếp tục lộ trình mới.
          </p>
        </div>
        <button
          onClick={onDismiss}
          aria-label="Đóng thông báo"
          style={{
            background: "transparent",
            border: "none",
            color: "#065f46",
            cursor: "pointer",
            fontSize: 20,
            lineHeight: 1,
            padding: 4,
            flexShrink: 0,
          }}
        >
          ×
        </button>
      </div>
      <Link
        to="/profile"
        style={{
          alignSelf: "flex-start",
          padding: "10px 18px",
          borderRadius: 10,
          background: SECONDARY,
          color: "#ffffff",
          fontSize: 13,
          fontWeight: 700,
          textDecoration: "none",
          minHeight: 40,
          display: "inline-flex",
          alignItems: "center",
        }}
      >
        Đổi level tại Hồ sơ →
      </Link>
    </div>
  );
}
