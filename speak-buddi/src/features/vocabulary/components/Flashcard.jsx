// src/features/vocabulary/components/Flashcard.jsx
// ─── Thẻ từ vựng (flashcard) trong màn hình học từ vựng (S3.2) ───────────────
//
// Bám mockup: hoc_tu_vung_desktop — card trung tâm
// Props:
//   word        — TopicWordOut object từ API
//   onAudioPlay — callback(word) khi nhấn nút audio (xử lý TTS ở page)
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import { BsVolumeUpFill, BsEye, BsEyeSlash } from "react-icons/bs";

/**
 * Tag badge (loại từ đầu tiên, nếu có).
 */
function TagBadge({ name }) {
  return (
    <span
      style={{
        background: "#e4e1ee",
        color: "#464555",
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        borderRadius: 6,
        padding: "3px 10px",
      }}
    >
      {name}
    </span>
  );
}

/**
 * Badge "Mới" (S3.4 / AC-05-04 UX): hiển thị khi từ từ nguồn Langeek chưa có progress.
 * Biến mất tự nhiên sau khi học viên đánh dấu known/learning (progressStatus != null).
 */
function NewWordBadge({ word, progressStatus }) {
  // Chỉ hiện badge khi: source = 'langeek' VÀ chưa có progress (null)
  if (word?.source !== "langeek" || progressStatus != null) return null;
  return (
    <span
      aria-label="Từ mới từ Langeek"
      style={{
        display: "inline-flex",
        alignItems: "center",
        background: "#e6f4ee",
        color: "#006c49",
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: "0.05em",
        borderRadius: 999,
        padding: "3px 10px",
        border: "1px solid #6cf8bb",
        whiteSpace: "nowrap",
      }}
    >
      Mới
    </span>
  );
}

/**
 * Badge trạng thái học (S3.3): "Đã thuộc" / "Cần luyện" nếu đã đánh dấu.
 */
function ProgressBadge({ status }) {
  if (!status) return null;
  const isKnown = status === "known";
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        background: isKnown ? "#d1fae5" : "#fff8ec",
        color: isKnown ? "#065f46" : "#b45309",
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "0.05em",
        borderRadius: 999,
        padding: "3px 10px",
        border: `1px solid ${isKnown ? "#6ee7b7" : "#fcd34d"}`,
      }}
    >
      {isKnown ? "Đã thuộc" : "Cần luyện"}
    </span>
  );
}

export default function Flashcard({ word, onAudioPlay, progressStatus = null }) {
  const [showEngMeaning, setShowEngMeaning] = useState(false);

  // Reset khi chuyển từ
  // (controlled via key từ parent để React remount)

  if (!word) return null;

  const firstTag = word.tags?.[0] ?? null;

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        background: "#ffffff",
        borderRadius: 32,
        border: "1px solid #e4e1ee",
        boxShadow: "0 8px 30px rgba(0,0,0,0.04)",
        padding: "32px 28px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 20,
        overflow: "hidden",
      }}
    >
      {/* Decorative background blobs — bám mockup */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: -60,
          right: -60,
          width: 160,
          height: 160,
          borderRadius: "50%",
          background: "rgba(53,37,205,0.05)",
          filter: "blur(40px)",
          pointerEvents: "none",
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          bottom: -80,
          left: -80,
          width: 220,
          height: 220,
          borderRadius: "50%",
          background: "rgba(0,108,73,0.05)",
          filter: "blur(50px)",
          pointerEvents: "none",
        }}
      />

      {/* ── Top row: tag badge + progress status badge + audio button ── */}
      <div
        className="d-flex justify-content-between align-items-start w-100"
        style={{ position: "relative", zIndex: 1 }}
      >
        <div className="d-flex align-items-center gap-2">
          {firstTag ? <TagBadge name={firstTag.name} /> : <span />}
          {/* S3.4: badge "Mới" cho từ Langeek chưa học */}
          <NewWordBadge word={word} progressStatus={progressStatus} />
          <ProgressBadge status={progressStatus} />
        </div>
        <button
          aria-label="Phát âm"
          onClick={() => onAudioPlay && onAudioPlay(word)}
          style={{
            width: 48,
            height: 48,
            borderRadius: "50%",
            background: "rgba(53,37,205,0.10)",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#3525cd",
            flexShrink: 0,
            transition: "background 0.15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(53,37,205,0.18)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(53,37,205,0.10)";
          }}
        >
          <BsVolumeUpFill size={22} />
        </button>
      </div>

      {/* ── Word + IPA ── */}
      <div
        className="d-flex flex-column align-items-center gap-2 text-center"
        style={{ position: "relative", zIndex: 1 }}
      >
        <h2
          style={{
            fontSize: "clamp(32px, 6vw, 48px)",
            fontWeight: 700,
            letterSpacing: "-0.02em",
            lineHeight: 1.2,
            color: "#3525cd",
            margin: 0,
          }}
        >
          {word.word}
        </h2>
        {word.phonetic && (
          <span
            style={{
              fontFamily: "monospace",
              fontSize: 16,
              lineHeight: 1.6,
              color: "#464555",
              background: "#f0ecf9",
              borderRadius: 8,
              padding: "4px 16px",
            }}
          >
            {word.phonetic}
          </span>
        )}
      </div>

      {/* ── Vietnamese meaning (always visible) — AC-05-02 ── */}
      <div
        style={{
          fontSize: 20,
          fontWeight: 600,
          lineHeight: 1.4,
          color: "#1b1b24",
          textAlign: "center",
          position: "relative",
          zIndex: 1,
        }}
      >
        {word.meaning_vi}
      </div>

      {/* ── English meaning toggle — AC-05-02 ── */}
      {word.meaning_en && (
        <div className="w-100" style={{ position: "relative", zIndex: 1 }}>
          <button
            className="d-flex align-items-center justify-content-center gap-2 w-100"
            onClick={() => setShowEngMeaning((v) => !v)}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: "8px 0",
              color: "#3525cd",
              fontSize: 14,
              fontWeight: 500,
              borderRadius: 8,
              transition: "background 0.15s",
              minHeight: 44,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#e4e1ee";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
          >
            {showEngMeaning ? (
              <BsEyeSlash size={16} />
            ) : (
              <BsEye size={16} />
            )}
            {showEngMeaning ? "Ẩn nghĩa tiếng Anh" : "Hiện nghĩa tiếng Anh"}
          </button>
          {showEngMeaning && (
            <div
              style={{
                marginTop: 8,
                padding: "12px 16px",
                background: "#f5f2ff",
                borderRadius: 12,
                fontSize: 15,
                lineHeight: 1.6,
                color: "#464555",
                textAlign: "center",
              }}
            >
              &ldquo;{word.meaning_en}&rdquo;
            </div>
          )}
        </div>
      )}

      {/* ── Example sentence — ẩn nếu rỗng (AC-05-02) ── */}
      {word.example_sentence && (
        <div
          className="w-100"
          style={{
            padding: "14px 18px",
            border: "1px solid #e4e1ee",
            borderRadius: 16,
            background: "rgba(252,248,255,0.5)",
            textAlign: "center",
            position: "relative",
            zIndex: 1,
          }}
        >
          <p
            style={{
              fontSize: 15,
              lineHeight: 1.6,
              color: "#1b1b24",
              fontStyle: "italic",
              margin: 0,
            }}
            dangerouslySetInnerHTML={{
              __html: word.example_sentence.replace(
                new RegExp(`\\b(${word.word})\\b`, "gi"),
                '<strong style="color:#3525cd">$1</strong>'
              ),
            }}
          />
        </div>
      )}

      {/* ── Grammar note — ẩn nếu rỗng (AC-05-02) ── */}
      {word.grammar_note && (
        <div
          className="w-100"
          style={{
            padding: "12px 16px",
            background: "#fff8ec",
            borderLeft: "3px solid #f5a623",
            borderRadius: "0 8px 8px 0",
            fontSize: 14,
            lineHeight: 1.6,
            color: "#464555",
            position: "relative",
            zIndex: 1,
          }}
        >
          <span style={{ fontWeight: 600, color: "#b45309", marginRight: 6 }}>
            Ghi chú:
          </span>
          {word.grammar_note}
        </div>
      )}
    </div>
  );
}
