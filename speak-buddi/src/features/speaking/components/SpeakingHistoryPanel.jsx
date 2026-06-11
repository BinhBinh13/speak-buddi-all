// src/features/speaking/components/SpeakingHistoryPanel.jsx
// Panel lịch sử hội thoại free speaking — hiển thị danh sách + xem lại nội dung

import { useEffect, useState } from "react";
import { deleteSpeakingSession, listSpeakingHistory } from "../services/speakingHistoryService";

const C = {
  primary:          "#3525cd",
  surface:          "#fcf8ff",
  surfaceCard:      "#ffffff",
  surfaceLow:       "#f5f2ff",
  outlineVariant:   "#c7c4d8",
  onSurface:        "#1b1b24",
  onSurfaceVariant: "#464555",
  error:            "#ba1a1a",
  errorBg:          "#ffdad6",
};
const FONT = "'Be Vietnam Pro', system-ui, sans-serif";

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleString("vi-VN", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function SessionDetail({ session, onClose }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 0", borderBottom: `1px solid ${C.outlineVariant}`, marginBottom: 12 }}>
        <button
          onClick={onClose}
          style={{ background: "none", border: "none", cursor: "pointer", padding: 4, borderRadius: 6, color: C.onSurfaceVariant, display: "flex", alignItems: "center" }}
          aria-label="Quay lại"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
          </svg>
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: C.onSurface, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {session.title}
          </div>
          <div style={{ fontSize: 12, color: C.onSurfaceVariant }}>{formatDate(session.created_at)}</div>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10 }}>
        {session.messages.map((m, i) => {
          const isUser = m.role === "user";
          return (
            <div key={i} style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start" }}>
              <div
                style={{
                  maxWidth: "80%",
                  padding: "10px 14px",
                  borderRadius: isUser ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                  background: isUser ? C.primary : C.surfaceCard,
                  color: isUser ? "#fff" : C.onSurface,
                  fontSize: 14,
                  lineHeight: 1.55,
                  border: isUser ? "none" : `1px solid ${C.outlineVariant}`,
                  fontFamily: FONT,
                }}
              >
                {m.content}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function SpeakingHistoryPanel({ visible, onClose }) {
  const [sessions, setSessions]   = useState([]);
  const [loading, setLoading]     = useState(false);
  const [selected, setSelected]   = useState(null);
  const [deleting, setDeleting]   = useState(null);
  const [error, setError]         = useState("");

  useEffect(() => {
    if (!visible) { setSelected(null); return; }
    setLoading(true);
    setError("");
    listSpeakingHistory()
      .then(setSessions)
      .catch(() => setError("Không tải được lịch sử."))
      .finally(() => setLoading(false));
  }, [visible]);

  async function handleDelete(id, e) {
    e.stopPropagation();
    setDeleting(id);
    try {
      await deleteSpeakingSession(id);
      setSessions((prev) => prev.filter((s) => s.id !== id));
      if (selected?.id === id) setSelected(null);
    } catch {
      setError("Không xóa được phiên hội thoại.");
    } finally {
      setDeleting(null);
    }
  }

  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "flex-end",
        pointerEvents: "none",
      }}
    >
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.25)", pointerEvents: "auto" }}
      />

      {/* Panel */}
      <aside
        style={{
          position: "relative",
          width: "min(420px, 100vw)",
          height: "100vh",
          background: C.surface,
          boxShadow: "-4px 0 24px rgba(53,37,205,0.10)",
          display: "flex",
          flexDirection: "column",
          padding: "20px 20px 24px",
          boxSizing: "border-box",
          pointerEvents: "auto",
          fontFamily: FONT,
          overflowY: "hidden",
        }}
        aria-label="Lịch sử hội thoại"
      >
        {selected ? (
          <SessionDetail session={selected} onClose={() => setSelected(null)} />
        ) : (
          <>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: C.onSurface }}>Lịch sử hội thoại</h2>
              <button
                onClick={onClose}
                style={{ background: "none", border: "none", cursor: "pointer", padding: 4, borderRadius: 6, color: C.onSurfaceVariant }}
                aria-label="Đóng"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                </svg>
              </button>
            </div>

            {error && (
              <div style={{ background: C.errorBg, color: C.error, borderRadius: 8, padding: "8px 12px", fontSize: 13, marginBottom: 12 }}>
                {error}
              </div>
            )}

            {loading ? (
              <div style={{ textAlign: "center", color: C.onSurfaceVariant, paddingTop: 40, fontSize: 14 }}>Đang tải...</div>
            ) : sessions.length === 0 ? (
              <div style={{ textAlign: "center", color: C.onSurfaceVariant, paddingTop: 40, fontSize: 14 }}>
                Chưa có phiên hội thoại nào được lưu.
              </div>
            ) : (
              <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
                {sessions.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSelected(s)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 8,
                      padding: "12px 14px",
                      background: C.surfaceCard,
                      border: `1px solid ${C.outlineVariant}`,
                      borderRadius: 10,
                      cursor: "pointer",
                      textAlign: "left",
                      fontFamily: FONT,
                      width: "100%",
                      transition: "border-color 0.15s, background 0.15s",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.primary; e.currentTarget.style.background = C.surfaceLow; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.outlineVariant; e.currentTarget.style.background = C.surfaceCard; }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: C.onSurface, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {s.title}
                      </div>
                      <div style={{ fontSize: 12, color: C.onSurfaceVariant, marginTop: 2 }}>
                        {formatDate(s.created_at)} · {s.messages.length} tin nhắn
                      </div>
                    </div>
                    <button
                      onClick={(e) => handleDelete(s.id, e)}
                      disabled={deleting === s.id}
                      style={{ background: "none", border: "none", cursor: "pointer", padding: 4, borderRadius: 6, color: C.error, flexShrink: 0, opacity: deleting === s.id ? 0.5 : 1 }}
                      aria-label="Xóa phiên hội thoại"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                      </svg>
                    </button>
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </aside>
    </div>
  );
}
