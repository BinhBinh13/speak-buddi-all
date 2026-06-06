import { useState } from "react";
import { COLORS, FONTS } from "../../../shared/constants/theme";
import { translateText } from "../services/translateService";

const MAX_CHARS = 5000;

function validateInput(text) {
  if (!text.trim()) return "Vui lòng nhập văn bản cần dịch.";
  if (text.length > MAX_CHARS) return `Văn bản không được vượt quá ${MAX_CHARS} ký tự.`;
  return null;
}

// S5.2: nhận prop onTranslated (optional callback) — gọi sau khi set translation thành công
//        để TranslatePage có thể trigger refresh TranslationHistory.
export default function TranslatorCard({ onTranslated }) {
  const [inputText, setInputText]     = useState("");
  const [translation, setTranslation] = useState("");
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState(null);
  const [touched, setTouched]         = useState(false);
  const [copied, setCopied]           = useState(false);

  const validationError = validateInput(inputText);
  const showValidation  = touched && validationError;

  async function handleTranslate() {
    setTouched(true);
    if (validationError) return;

    setLoading(true);
    setError(null);
    setTranslation("");

    try {
      const result = await translateText(inputText);
      setTranslation(result);
      onTranslated?.(); // S5.2: trigger history refresh sau khi dịch thành công
    } catch (err) {
      setError(err.message || "Dịch thất bại. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }

  function handleClear() {
    setInputText("");
    setTranslation("");
    setError(null);
    setTouched(false);
  }

  async function handleCopy() {
    if (!translation) return;
    try {
      await navigator.clipboard.writeText(translation);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard not available
    }
  }

  return (
    <>
      <style>{CARD_CSS}</style>

      <div className="translator-card">
        {/* Language bar */}
        <div className="translator-lang-bar">
          <div className="translator-lang-label active-lang">English</div>
          <div className="translator-lang-divider">→</div>
          <div className="translator-lang-label">Tiếng Việt</div>
        </div>

        {/* Input / Output split */}
        <div className="translator-panels">
          {/* Left panel: Input */}
          <div className={`translator-panel input-panel${showValidation ? " has-error" : ""}`}>
            <textarea
              className="translator-textarea"
              placeholder="Nhập văn bản tiếng Anh..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onBlur={() => setTouched(true)}
              rows={6}
              aria-label="Văn bản tiếng Anh cần dịch"
            />

            {showValidation && (
              <div className="translator-validation-msg" role="alert">
                {validationError}
              </div>
            )}

            <div className="translator-panel-footer">
              <span className={`translator-char-count${inputText.length > MAX_CHARS ? " over-limit" : ""}`}>
                {inputText.length} / {MAX_CHARS}
              </span>
              <div className="translator-panel-actions">
                {inputText && (
                  <button
                    className="translator-icon-btn"
                    onClick={handleClear}
                    title="Xóa nội dung"
                    aria-label="Xóa nội dung"
                  >
                    ×
                  </button>
                )}
                <button
                  className={`translator-translate-btn${loading || !!validationError ? " disabled" : ""}`}
                  onClick={handleTranslate}
                  disabled={loading}
                  aria-label="Dịch văn bản"
                >
                  {loading ? "Đang dịch..." : "Dịch"}
                </button>
              </div>
            </div>
          </div>

          {/* Right panel: Output */}
          <div className="translator-panel output-panel">
            {loading ? (
              <div className="translator-skeleton" aria-label="Đang dịch...">
                <div className="skeleton-line" />
                <div className="skeleton-line short" />
                <div className="skeleton-line" />
              </div>
            ) : error ? (
              <div className="translator-error-msg" role="alert">
                {error}
              </div>
            ) : translation ? (
              <div className="translator-output-text">
                {translation}
              </div>
            ) : (
              <div className="translator-placeholder">
                Bản dịch sẽ hiện ở đây
              </div>
            )}

            {translation && !loading && (
              <div className="translator-panel-footer output-footer">
                <button
                  className={`translator-copy-btn${copied ? " copied" : ""}`}
                  onClick={handleCopy}
                  title={copied ? "Đã sao chép!" : "Sao chép bản dịch"}
                  aria-label={copied ? "Đã sao chép!" : "Sao chép bản dịch"}
                >
                  {copied ? "Đã sao chép!" : "Sao chép"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

const CARD_CSS = `
  .translator-card {
    background: #ffffff;
    border: 1px solid ${COLORS.outlineVariant};
    border-radius: 24px;
    overflow: hidden;
    box-shadow: 0 4px 12px rgba(53, 37, 205, 0.04);
  }

  /* Language bar */
  .translator-lang-bar {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
    padding: 12px 24px;
    border-bottom: 1px solid ${COLORS.outlineVariant};
    background: ${COLORS.surface};
  }
  .translator-lang-label {
    font-family: ${FONTS.body};
    font-size: 14px;
    font-weight: 500;
    color: ${COLORS.onSurfaceVariant};
    padding: 8px 16px;
    border-radius: 12px;
    min-height: 44px;
    display: flex;
    align-items: center;
  }
  .translator-lang-label.active-lang {
    color: ${COLORS.primary};
    background: ${COLORS.primaryBgLight};
  }
  .translator-lang-divider {
    font-size: 18px;
    color: ${COLORS.onSurfaceVariant};
    font-weight: 400;
  }

  /* Panels */
  .translator-panels {
    display: flex;
    flex-direction: column;
  }
  @media (min-width: 768px) {
    .translator-panels {
      flex-direction: row;
    }
  }

  .translator-panel {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 20px 24px;
    min-height: 240px;
    position: relative;
  }

  .input-panel {
    border-bottom: 1px solid ${COLORS.outlineVariant};
  }
  @media (min-width: 768px) {
    .input-panel {
      border-bottom: none;
      border-right: 1px solid ${COLORS.outlineVariant};
    }
  }

  .input-panel.has-error .translator-textarea {
    border-color: #ba1a1a;
  }

  .output-panel {
    background: ${COLORS.surfaceLow};
  }

  /* Textarea */
  .translator-textarea {
    width: 100%;
    flex: 1;
    resize: none;
    border: 1px solid ${COLORS.outlineVariant};
    border-radius: 12px;
    padding: 12px;
    font-family: ${FONTS.body};
    font-size: 16px;
    line-height: 1.6;
    color: ${COLORS.onSurface};
    background: transparent;
    outline: none;
    min-height: 140px;
    box-sizing: border-box;
    transition: border-color 0.15s;
  }
  .translator-textarea:focus {
    border-color: ${COLORS.primary};
  }
  .translator-textarea::placeholder {
    color: ${COLORS.onSurfaceVariant};
    opacity: 0.6;
  }

  /* Validation message */
  .translator-validation-msg {
    font-family: ${FONTS.body};
    font-size: 13px;
    color: #ba1a1a;
    margin-top: 6px;
  }

  /* Panel footer */
  .translator-panel-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 12px;
    gap: 8px;
  }
  .output-footer {
    justify-content: flex-end;
  }

  /* Char count */
  .translator-char-count {
    font-family: ${FONTS.body};
    font-size: 12px;
    color: ${COLORS.onSurfaceVariant};
    opacity: 0.7;
  }
  .translator-char-count.over-limit {
    color: #ba1a1a;
    font-weight: 600;
  }

  /* Panel actions */
  .translator-panel-actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  /* Icon button (clear) */
  .translator-icon-btn {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 20px;
    color: ${COLORS.onSurfaceVariant};
    padding: 8px;
    min-height: 44px;
    min-width: 44px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.15s, color 0.15s;
  }
  .translator-icon-btn:hover {
    background: #ffdad6;
    color: #ba1a1a;
  }

  /* Translate button */
  .translator-translate-btn {
    background: ${COLORS.primary};
    color: #ffffff;
    border: none;
    border-radius: 12px;
    padding: 10px 24px;
    font-family: ${FONTS.body};
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    min-height: 44px;
    transition: background 0.15s, opacity 0.15s;
  }
  .translator-translate-btn:hover:not(.disabled) {
    background: ${COLORS.primaryContainer};
  }
  .translator-translate-btn.disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* Copy button */
  .translator-copy-btn {
    background: ${COLORS.primary};
    color: #ffffff;
    border: none;
    border-radius: 20px;
    padding: 8px 20px;
    font-family: ${FONTS.body};
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    min-height: 44px;
    transition: background 0.15s;
  }
  .translator-copy-btn:hover {
    background: ${COLORS.primaryContainer};
  }
  .translator-copy-btn.copied {
    background: ${COLORS.emeraldDark};
  }

  /* Output text */
  .translator-output-text {
    font-family: ${FONTS.body};
    font-size: 16px;
    line-height: 1.6;
    color: ${COLORS.onSurface};
    flex: 1;
    white-space: pre-wrap;
  }

  /* Placeholder */
  .translator-placeholder {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: ${FONTS.body};
    font-size: 16px;
    color: ${COLORS.onSurfaceVariant};
    opacity: 0.5;
    text-align: center;
  }

  /* Error message */
  .translator-error-msg {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: ${FONTS.body};
    font-size: 14px;
    color: #ba1a1a;
    text-align: center;
    padding: 16px;
  }

  /* Loading skeleton */
  .translator-skeleton {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 4px 0;
  }
  .skeleton-line {
    height: 18px;
    background: linear-gradient(90deg, ${COLORS.outlineVariant} 25%, ${COLORS.surfaceContainerHigh} 50%, ${COLORS.outlineVariant} 75%);
    background-size: 200% 100%;
    border-radius: 6px;
    animation: skeleton-shimmer 1.4s infinite;
  }
  .skeleton-line.short {
    width: 60%;
  }
  @keyframes skeleton-shimmer {
    0%   { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }

  /* Focus visible */
  .translator-card button:focus-visible,
  .translator-card textarea:focus-visible {
    outline: 3px solid ${COLORS.primary};
    outline-offset: 2px;
    border-radius: 8px;
  }
`;
