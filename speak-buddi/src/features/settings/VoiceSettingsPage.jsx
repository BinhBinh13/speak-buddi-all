// src/features/settings/VoiceSettingsPage.jsx
// ─── Cài đặt giọng đọc (S8.4) ────────────────────────────────────────────────
// Mockup: speak-buddi-docs/ui/cai_dat_giong_doc_desktop/code.html
// Design: speak-buddi-docs/ui/speak_buddi/DESIGN.md

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { LuCheck, LuSave, LuStar, LuUser } from "react-icons/lu";
import AppLayout from "../../shared/components/AppLayout";
import { UI } from "../../shared/constants/designTokens";
import {
  getVoiceModels,
  getVoicePreference,
  setVoicePreference,
} from "./services/voiceService";

const FONT = "'Be Vietnam Pro', system-ui, sans-serif";

function Toast({ message, type = "success", onClose }) {
  if (!message) return null;
  const bg = type === "success" ? UI.secondary : UI.error;
  return (
    <div
      role="alert"
      aria-live="polite"
      style={{
        position: "fixed",
        top: 80,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 9999,
        background: bg,
        color: UI.onPrimary,
        padding: "12px 24px",
        borderRadius: 10,
        fontFamily: FONT,
        fontSize: 14,
        fontWeight: 600,
        boxShadow: "0 4px 16px rgba(0,0,0,0.18)",
        minWidth: 280,
        maxWidth: "90vw",
      }}
    >
      <span>{message}</span>
      <button
        onClick={onClose}
        aria-label="Đóng"
        style={{
          marginLeft: 12,
          background: "transparent",
          border: "none",
          color: UI.onPrimary,
          cursor: "pointer",
          fontSize: 18,
        }}
      >
        ×
      </button>
    </div>
  );
}

function genderIcon(gender) {
  if (gender === "male") return <LuUser size={22} />;
  return <LuUser size={22} />;
}

function VoiceCard({ voice, isSelected, onSelect }) {
  const proStyle = voice.is_pro
    ? {
        border: "2px solid transparent",
        backgroundImage: `linear-gradient(${UI.surfaceContainerLowest}, ${UI.surfaceContainerLowest}), linear-gradient(135deg, #FFD700 0%, #FDB931 100%)`,
        backgroundOrigin: "border-box",
        backgroundClip: "padding-box, border-box",
      }
    : {};

  return (
    <button
      type="button"
      onClick={() => onSelect(voice.id)}
      aria-pressed={isSelected}
      style={{
        position: "relative",
        textAlign: "left",
        padding: 16,
        borderRadius: 12,
        border: isSelected ? `2px solid ${UI.primary}` : `1px solid ${UI.outlineVariant}`,
        background: isSelected ? "rgba(53, 37, 205, 0.05)" : UI.surfaceContainerLowest,
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        gap: 8,
        minHeight: 44,
        fontFamily: FONT,
        ...proStyle,
      }}
    >
      {voice.is_pro && (
        <span
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            background: UI.tertiaryContainer,
            color: UI.onTertiaryContainer,
            padding: "4px 8px",
            borderBottomLeftRadius: 8,
            fontSize: 11,
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <LuStar size={12} fill="currentColor" /> PRO
        </span>
      )}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              background: UI.surfaceContainer,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: isSelected ? UI.primary : UI.onSurfaceVariant,
            }}
          >
            {genderIcon(voice.gender)}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: UI.onSurface }}>{voice.display_name}</div>
            <div style={{ fontSize: 12, color: UI.onSurfaceVariant }}>{voice.accent}</div>
          </div>
        </div>
        {isSelected && (
          <div
            style={{
              width: 24,
              height: 24,
              borderRadius: "50%",
              background: UI.primary,
              color: UI.onPrimary,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <LuCheck size={14} />
          </div>
        )}
      </div>
    </button>
  );
}

export default function VoiceSettingsPage() {
  const [models, setModels] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [savedId, setSavedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [upgradeRequired, setUpgradeRequired] = useState(false);
  const [toast, setToast] = useState({ message: "", type: "success" });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      setUpgradeRequired(false);
      try {
        const [voiceList, pref] = await Promise.all([
          getVoiceModels(),
          getVoicePreference(),
        ]);
        if (cancelled) return;
        setModels(voiceList);
        const currentId = pref?.voice_model_id ?? voiceList[0]?.id ?? null;
        setSelectedId(currentId);
        setSavedId(pref?.voice_model_id ?? null);
      } catch (err) {
        if (cancelled) return;
        const msg = err?.message || "Không tải được cài đặt giọng đọc.";
        if (msg.includes("gói Pro") || msg.includes("403")) {
          setUpgradeRequired(true);
        } else {
          setError(msg);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  const selectedVoice = models.find((v) => v.id === selectedId);

  async function handleSave() {
    if (!selectedId) return;
    setSaving(true);
    setError(null);
    try {
      await setVoicePreference(selectedId);
      setSavedId(selectedId);
      setToast({ message: "Đã lưu giọng đọc thành công!", type: "success" });
    } catch (err) {
      const msg = err?.message || "Lưu thất bại.";
      if (msg.includes("gói Pro")) {
        setUpgradeRequired(true);
      } else {
        setToast({ message: msg, type: "error" });
      }
    } finally {
      setSaving(false);
    }
  }

  function handleReset() {
    const defaultVoice = models[0];
    if (defaultVoice) setSelectedId(defaultVoice.id);
  }

  if (upgradeRequired) {
    return (
      <AppLayout>
        <div style={{ fontFamily: FONT, maxWidth: 640, margin: "0 auto", padding: "24px 0" }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: UI.onSurface, marginBottom: 12 }}>
            Cài đặt giọng đọc
          </h1>
          <div
            style={{
              background: UI.surfaceContainerLow,
              border: `1px solid ${UI.outlineVariant}`,
              borderRadius: 12,
              padding: 24,
            }}
          >
            <p style={{ color: UI.onSurfaceVariant, marginBottom: 16 }}>
              Tính năng đổi giọng đọc AI chỉ dành cho gói Pro. Nâng cấp để tùy chỉnh giọng đọc cho gia sư AI của bạn.
            </p>
            <Link
              to="/pricing"
              style={{
                display: "inline-block",
                background: UI.primary,
                color: UI.onPrimary,
                padding: "12px 24px",
                borderRadius: 10,
                fontWeight: 600,
                textDecoration: "none",
                minHeight: 44,
                lineHeight: "20px",
              }}
            >
              Xem gói Pro
            </Link>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: "", type: "success" })}
      />

      <div style={{ fontFamily: FONT, maxWidth: 896, margin: "0 auto" }}>
        <header style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 32, fontWeight: 700, color: UI.onSurface, margin: "0 0 8px" }}>
            Cài đặt giọng đọc
          </h1>
          <p style={{ fontSize: 16, color: UI.onSurfaceVariant, margin: 0 }}>
            Tùy chỉnh giọng, accent và phong cách nói của gia sư AI để tối ưu luyện nghe.
          </p>
        </header>

        {loading && (
          <p style={{ color: UI.onSurfaceVariant }}>Đang tải danh sách giọng đọc…</p>
        )}

        {error && !loading && (
          <p style={{ color: UI.error }} role="alert">{error}</p>
        )}

        {!loading && !error && (
          <>
            <section
              style={{
                background: UI.surfaceContainerLowest,
                borderRadius: 12,
                padding: 24,
                border: `1px solid ${UI.outlineVariant}`,
                boxShadow: "0px 4px 12px rgba(53, 37, 205, 0.04)",
                marginBottom: 24,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 12,
                  marginBottom: 20,
                }}
              >
                <h2 style={{ fontSize: 20, fontWeight: 600, color: UI.onSurface, margin: 0 }}>
                  Giọng đọc
                </h2>
                {selectedVoice && (
                  <span
                    style={{
                      background: UI.surfaceContainer,
                      padding: "4px 12px",
                      borderRadius: 999,
                      fontSize: 12,
                      fontWeight: 600,
                      color: UI.onSurfaceVariant,
                    }}
                  >
                    Đang chọn: {selectedVoice.display_name}
                  </span>
                )}
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                  gap: 16,
                }}
              >
                {models.map((voice) => (
                  <VoiceCard
                    key={voice.id}
                    voice={voice}
                    isSelected={voice.id === selectedId}
                    onSelect={setSelectedId}
                  />
                ))}
              </div>
            </section>

            <div
              style={{
                marginTop: 32,
                paddingTop: 24,
                borderTop: `1px solid ${UI.outlineVariant}`,
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "flex-end",
                gap: 16,
              }}
            >
              <button
                type="button"
                onClick={handleReset}
                disabled={saving || !models.length}
                style={{
                  padding: "12px 24px",
                  borderRadius: 10,
                  border: "none",
                  background: "transparent",
                  color: UI.onSurface,
                  fontWeight: 600,
                  fontFamily: FONT,
                  cursor: "pointer",
                  minHeight: 44,
                }}
              >
                Đặt lại mặc định
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || !selectedId || selectedId === savedId}
                style={{
                  padding: "12px 32px",
                  borderRadius: 10,
                  border: "none",
                  background: UI.primary,
                  color: UI.onPrimary,
                  fontWeight: 600,
                  fontFamily: FONT,
                  cursor: saving ? "wait" : "pointer",
                  minHeight: 44,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  opacity: saving || selectedId === savedId ? 0.7 : 1,
                }}
              >
                <LuSave size={18} />
                {saving ? "Đang lưu…" : "Lưu thay đổi"}
              </button>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
