// speak-buddi/src/features/translate/components/TranslationHistory.jsx
// ─── Section lịch sử dịch gần đây (S5.2 — AC-07-03) ─────────────────────────
//
// UI tham chiếu: speak-buddi-docs/ui/dich_thuat_desktop/code.html
//   section <!-- History Section --> (dòng 273–306)
//   Grid 2 cột (desktop) / 1 cột (mobile), badge EN→VI, source/target text line-clamp-1.
//
// Props:
//   refreshTrigger {number} — tăng mỗi lần user dịch xong để fetch lại lịch sử.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from "react";
import { COLORS, FONTS } from "../../../shared/constants/theme";
import { getTranslationHistory } from "../services/translateService";

/**
 * Format ISO timestamp → "dd/MM HH:mm" theo locale vi-VN.
 * @param {string} isoString
 */
function formatDate(isoString) {
  if (!isoString) return "";
  const d = new Date(isoString);
  return d.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function TranslationHistory({ refreshTrigger }) {
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchHistory() {
      setLoading(true);
      try {
        const data = await getTranslationHistory();
        if (!cancelled) {
          setItems(data);
          setLoading(false);
        }
      } catch {
        // Ẩn lỗi DB — không hiện thông báo lỗi cho user (plan §6 — error state)
        if (!cancelled) setLoading(false);
      }
    }

    fetchHistory();
    return () => { cancelled = true; };
  }, [refreshTrigger]);

  async function handleCopy(item) {
    try {
      await navigator.clipboard.writeText(item.target_text);
      setCopiedId(item.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // clipboard not available
    }
  }

  return (
    <section style={{ marginTop: 32 }}>
      <style>{HISTORY_CSS}</style>

      {/* Section header */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <span style={{
          fontSize: 22,
          color: COLORS.primary,
          lineHeight: 1,
          userSelect: "none",
        }}>
          ⏱
        </span>
        <h2 style={{
          fontFamily: FONTS.display,
          fontSize: 20,
          fontWeight: 700,
          color: COLORS.onSurface,
          margin: 0,
          lineHeight: 1.25,
        }}>
          Lịch sử dịch gần đây
        </h2>
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="th-grid">
          {[1, 2].map((n) => (
            <div key={n} className="th-card-skeleton">
              <div className="th-skel-badge" />
              <div className="th-skel-line" />
              <div className="th-skel-line short" />
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && items.length === 0 && (
        <p style={{
          fontFamily: FONTS.body,
          fontSize: 15,
          color: COLORS.onSurfaceVariant,
          opacity: 0.7,
          textAlign: "center",
          padding: "32px 0",
          margin: 0,
        }}>
          Chưa có lịch sử dịch.
        </p>
      )}

      {/* History grid */}
      {!loading && items.length > 0 && (
        <div className="th-grid">
          {items.map((item) => (
            <div key={item.id} className="th-card">
              {/* Card header: badge + copy button */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <span className="th-badge">EN → VI</span>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{
                    fontFamily: FONTS.body,
                    fontSize: 12,
                    color: COLORS.onSurfaceVariant,
                    opacity: 0.7,
                  }}>
                    {formatDate(item.created_at)}
                  </span>
                  <button
                    className={`th-copy-btn${copiedId === item.id ? " copied" : ""}`}
                    onClick={() => handleCopy(item)}
                    title={copiedId === item.id ? "Đã sao chép!" : "Sao chép bản dịch"}
                    aria-label={copiedId === item.id ? "Đã sao chép!" : "Sao chép bản dịch"}
                  >
                    {copiedId === item.id ? "✓" : "⎘"}
                  </button>
                </div>
              </div>

              {/* Source text (English) */}
              <p className="th-text-source">{item.source_text}</p>

              {/* Target text (Vietnamese) */}
              <p className="th-text-target">{item.target_text}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

const HISTORY_CSS = `
  /* Grid 2 cột desktop, 1 cột mobile — theo mockup dich_thuat_desktop */
  .th-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 16px;
  }
  @media (min-width: 768px) {
    .th-grid {
      grid-template-columns: 1fr 1fr;
    }
  }

  /* Card item */
  .th-card {
    background: #ffffff;
    border: 1px solid ${COLORS.outlineVariant};
    border-radius: 16px;
    padding: 16px;
    cursor: pointer;
    transition: box-shadow 0.18s, border-color 0.18s;
    position: relative;
  }
  .th-card:hover {
    box-shadow: 0 8px 24px rgba(53, 37, 205, 0.06);
    border-color: rgba(53, 37, 205, 0.3);
  }

  /* Badge EN → VI */
  .th-badge {
    font-family: ${FONTS.body};
    font-size: 12px;
    font-weight: 500;
    color: ${COLORS.onSurfaceVariant};
    background: ${COLORS.surfaceContainer};
    padding: 3px 8px;
    border-radius: 6px;
    line-height: 1.4;
  }

  /* Source text (EN) */
  .th-text-source {
    font-family: ${FONTS.body};
    font-size: 14px;
    color: ${COLORS.onSurface};
    margin: 0 0 4px 0;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    line-height: 1.5;
  }

  /* Target text (VI) */
  .th-text-target {
    font-family: ${FONTS.body};
    font-size: 14px;
    color: ${COLORS.onSurfaceVariant};
    margin: 0;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    line-height: 1.5;
  }

  /* Copy button */
  .th-copy-btn {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 16px;
    color: ${COLORS.onSurfaceVariant};
    padding: 4px 6px;
    border-radius: 6px;
    min-height: 28px;
    min-width: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.15s, color 0.15s;
    line-height: 1;
  }
  .th-copy-btn:hover {
    background: ${COLORS.primaryBgLight};
    color: ${COLORS.primary};
  }
  .th-copy-btn.copied {
    color: ${COLORS.emeraldDark};
  }

  /* Loading skeleton card */
  .th-card-skeleton {
    background: ${COLORS.surface};
    border: 1px solid ${COLORS.outlineVariant};
    border-radius: 16px;
    padding: 16px;
  }
  .th-skel-badge {
    width: 64px;
    height: 22px;
    background: linear-gradient(90deg, ${COLORS.outlineVariant} 25%, ${COLORS.surfaceContainerHigh} 50%, ${COLORS.outlineVariant} 75%);
    background-size: 200% 100%;
    border-radius: 6px;
    animation: th-shimmer 1.4s infinite;
    margin-bottom: 12px;
  }
  .th-skel-line {
    height: 16px;
    background: linear-gradient(90deg, ${COLORS.outlineVariant} 25%, ${COLORS.surfaceContainerHigh} 50%, ${COLORS.outlineVariant} 75%);
    background-size: 200% 100%;
    border-radius: 6px;
    animation: th-shimmer 1.4s infinite;
    margin-bottom: 8px;
  }
  .th-skel-line.short {
    width: 70%;
    margin-bottom: 0;
  }
  @keyframes th-shimmer {
    0%   { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
`;
