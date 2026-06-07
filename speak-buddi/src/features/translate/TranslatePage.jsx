// speak-buddi/src/features/translate/TranslatePage.jsx
// ─── Trang Dịch thuật (S5.1 + S5.2) ─────────────────────────────────────────
//
// S5.2: Thêm section TranslationHistory hiển thị khi user đã đăng nhập.
//        historyTrigger tăng mỗi lần dịch xong → TranslationHistory tự fetch lại.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import { useAuth } from "../../shared/auth/AuthContext";
import AppLayout from "../../shared/components/AppLayout";
import TranslatorCard from "./components/TranslatorCard";
import TranslationHistory from "./components/TranslationHistory";
import { COLORS, FONTS } from "../../shared/constants/theme";

export default function TranslatePage() {
  const { isAuthenticated } = useAuth();
  // S5.2: historyTrigger — tăng mỗi khi dịch thành công để TranslationHistory re-fetch
  const [historyTrigger, setHistoryTrigger] = useState(0);

  function handleTranslated() {
    setHistoryTrigger((n) => n + 1);
  }

  return (
    <AppLayout>
      <div style={{ padding: "28px 24px", maxWidth: 960, margin: "0 auto" }}>
        <header style={{ marginBottom: 24 }}>
          <h1 style={{
            fontFamily: FONTS.display,
            fontSize: 28,
            fontWeight: 700,
            color: COLORS.onSurface,
            margin: 0,
            lineHeight: 1.25,
          }}>
            Dịch thuật
          </h1>
          <p style={{
            fontFamily: FONTS.body,
            fontSize: 16,
            color: COLORS.onSurfaceVariant,
            marginTop: 6,
            marginBottom: 0,
          }}>
            Dịch văn bản tiếng Anh sang tiếng Việt nhanh chóng.
          </p>
        </header>

        {/* Translator card — truyền callback để biết khi nào dịch xong (S5.2) */}
        <TranslatorCard onTranslated={handleTranslated} />

        {/* Section lịch sử — chỉ hiện khi đã đăng nhập (AC-07-03, guest không lưu) */}
        {isAuthenticated && (
          <TranslationHistory refreshTrigger={historyTrigger} />
        )}
      </div>
    </AppLayout>
  );
}
