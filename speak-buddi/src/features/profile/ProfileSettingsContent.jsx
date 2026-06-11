// ProfileSettingsContent — nội dung Hồ sơ & Cài đặt dùng chung user/admin
// variant="user" | "admin" — admin không có trình độ học / xóa tài khoản

import { useState } from "react";
import { Modal } from "react-bootstrap";
import { useAuth } from "../../shared/auth/AuthContext";
import LevelSelector from "./components/LevelSelector";
import DeleteAccountSection from "./components/DeleteAccountSection";
import PersonalInfoSection from "./components/PersonalInfoSection";
import ChangePasswordSection from "./components/ChangePasswordSection";
import { LEVELS, BADGE_COLORS } from "./constants/levels";
import { updateLearning } from "./services/profileService";
import Toast from "../../shared/components/Toast";

const GOAL_OPTIONS = [
  { slug: "travel",        label: "Du lịch",             desc: "Giao tiếp khi đi du lịch, khám phá thế giới" },
  { slug: "work",          label: "Công việc",            desc: "Tiếng Anh chuyên nghiệp cho môi trường làm việc" },
  { slug: "communication", label: "Giao tiếp hàng ngày", desc: "Trò chuyện tự nhiên trong cuộc sống thường ngày" },
];

const PRIMARY = "#3525cd";
const SURFACE = "#fcf8ff";
const SURFACE_CARD = "#ffffff";
const SURFACE_BORDER = "#c7c4d8";
const ON_SURFACE = "#1b1b24";
const ON_SURFACE_VARIANT = "#464555";
const FONT = "'Be Vietnam Pro', system-ui, sans-serif";
const SURFACE_LOW = "#f5f2ff";
/**
 * @param {{ variant?: "user" | "admin", embedded?: boolean }} props
 */
export default function ProfileSettingsContent({ variant = "user", embedded = false }) {
  const isAdminProfile = variant === "admin";
  const showLevelSection = !isAdminProfile;
  const showDeleteAccount = !isAdminProfile;

  const { user, updateUser } = useAuth();
  const currentLevel = user?.level ?? null;
  const currentGoal  = user?.goal  ?? null;

  const [selectedLevel, setSelectedLevel] = useState(currentLevel);
  const [selectedGoal,  setSelectedGoal]  = useState(currentGoal);
  const [showConfirm,   setShowConfirm]   = useState(false);
  const [submitting,    setSubmitting]    = useState(false);

  const [toast, setToast] = useState({ message: "", type: "success" });

  const hasChanged = (selectedLevel !== null && selectedLevel !== currentLevel)
                  || (selectedGoal  !== null && selectedGoal  !== currentGoal);

  async function handleConfirmSave() {
    setShowConfirm(false);
    setSubmitting(true);
    try {
      const level = selectedLevel ?? currentLevel;
      const goal  = selectedGoal  ?? currentGoal;
      const data  = await updateLearning({ level, learning_goal: goal });
      updateUser({ level: data.level, goal: data.learning_goal, onboarding_completed: true });
      const regen = data.roadmap_generated ? " Lộ trình đã được cập nhật." : "";
      setToast({ message: `Đã lưu thay đổi!${regen}`, type: "success" });
    } catch (err) {
      setToast({ message: err.message || "Cập nhật thất bại. Vui lòng thử lại.", type: "error" });
    } finally {
      setSubmitting(false);
    }
  }

  const notifySuccess = (msg) => setToast({ message: msg, type: "success" });
  const notifyError = (msg) => setToast({ message: msg, type: "error" });

  return (
    <>
      <style>{MODAL_CSS}</style>
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: "", type: "success" })} />

      <main style={embedded ? styles.mainEmbedded : styles.main}>
        <header style={styles.pageHeader}>
          <h1 style={styles.h1}>Hồ sơ &amp; Cài đặt</h1>
          <p style={styles.subtitle}>
            {isAdminProfile
              ? "Quản lý thông tin tài khoản quản trị hệ thống."
              : "Quản lý thông tin cá nhân và điều chỉnh trải nghiệm học tập của bạn."}
          </p>
        </header>

        <div style={styles.twoCol} className="profile-settings-two-col">
          <nav
            style={{
              ...styles.settingsNav,
              top: embedded ? 20 : 80,
            }}
            className="profile-settings-nav"
            aria-label="Điều hướng cài đặt"
          >
            <a href="#personal-info" style={styles.navLink}>Thông tin cá nhân</a>
            {showLevelSection && (
              <a href="#learning-path" style={styles.navLink}>Lộ trình học</a>
            )}
            <a href="#account-security" style={styles.navLink}>Bảo mật tài khoản</a>
            {!isAdminProfile && (
              <span style={styles.navLinkDisabled}>Thông báo</span>
            )}
            {showDeleteAccount && (
              <a href="#danger-zone" style={{ ...styles.navLink, color: ON_SURFACE, fontWeight: 600 }}>
                Xóa tài khoản
              </a>
            )}
          </nav>

          <div style={styles.sections}>
            <PersonalInfoSection
              showAdminRole={isAdminProfile}
              onSuccess={notifySuccess}
              onError={notifyError}
            />

            {showLevelSection && (
              <section id="learning-path" style={styles.section}>
                <div style={styles.sectionHeader}>
                  <div>
                    <h2 style={styles.h2}>Lộ trình học tập</h2>
                    <p style={styles.sectionDesc}>
                      Chọn trình độ và mục tiêu — AI sẽ tạo lộ trình phù hợp với bạn.
                    </p>
                  </div>
                </div>

                <div style={styles.sectionCard}>
                  {/* Current summary */}
                  <div style={{ display: "flex", gap: 12, marginBottom: 28, flexWrap: "wrap" }}>
                    <div style={{ flex: 1, minWidth: 160, background: SURFACE_LOW, borderRadius: 12, padding: "14px 18px", border: `1px solid ${SURFACE_BORDER}` }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: ON_SURFACE_VARIANT, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Trình độ hiện tại</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        {user?.level ? (
                          <>
                            <span style={{ background: BADGE_COLORS[user.level]?.bg, color: BADGE_COLORS[user.level]?.text, padding: "2px 10px", borderRadius: 9999, fontSize: 12, fontWeight: 700 }}>{user.level}</span>
                            <span style={{ fontSize: 15, fontWeight: 600, color: ON_SURFACE }}>{LEVELS.find(l => l.code === user.level)?.label}</span>
                          </>
                        ) : <span style={{ fontSize: 14, color: ON_SURFACE_VARIANT }}>Chưa thiết lập</span>}
                      </div>
                    </div>
                    <div style={{ flex: 1, minWidth: 160, background: SURFACE_LOW, borderRadius: 12, padding: "14px 18px", border: `1px solid ${SURFACE_BORDER}` }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: ON_SURFACE_VARIANT, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Mục tiêu hiện tại</div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: ON_SURFACE }}>
                        {GOAL_OPTIONS.find(g => g.slug === user?.goal)?.label ?? "Chưa thiết lập"}
                      </div>
                    </div>
                  </div>

                  {/* Step 1: Level */}
                  <div style={{ fontSize: 14, fontWeight: 600, color: ON_SURFACE, marginBottom: 12, fontFamily: FONT }}>
                    1. Chọn trình độ
                  </div>
                  <div style={{ marginBottom: 28 }}>
                    <LevelSelector value={selectedLevel} onChange={setSelectedLevel} />
                  </div>

                  {/* Step 2: Goal */}
                  <div style={{ fontSize: 14, fontWeight: 600, color: ON_SURFACE, marginBottom: 12, fontFamily: FONT }}>
                    2. Chọn mục tiêu học tập
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12, marginBottom: 28 }}>
                    {GOAL_OPTIONS.map((g) => {
                      const isSel = selectedGoal === g.slug;
                      return (
                        <button
                          key={g.slug}
                          type="button"
                          onClick={() => setSelectedGoal(g.slug)}
                          aria-pressed={isSel}
                          style={{
                            padding: "16px 14px",
                            border: `2px solid ${isSel ? PRIMARY : SURFACE_BORDER}`,
                            borderRadius: 10,
                            background: isSel ? SURFACE_LOW : SURFACE_CARD,
                            cursor: "pointer",
                            fontFamily: FONT,
                            textAlign: "left",
                            minHeight: 44,
                            transition: "border-color 0.15s, background 0.15s",
                          }}
                        >
                          <div style={{ fontSize: 14, fontWeight: 700, color: isSel ? PRIMARY : ON_SURFACE, marginBottom: 4 }}>
                            {isSel && "✓ "}{g.label}
                          </div>
                          <div style={{ fontSize: 12, color: ON_SURFACE_VARIANT, lineHeight: 1.4 }}>{g.desc}</div>
                        </button>
                      );
                    })}
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <button
                      type="button"
                      onClick={() => hasChanged && setShowConfirm(true)}
                      disabled={!hasChanged || submitting}
                      style={{
                        background: !hasChanged || submitting ? "#c7c4d8" : PRIMARY,
                        color: "#fff", border: "none", borderRadius: 10,
                        padding: "12px 32px", fontSize: 15, fontWeight: 600,
                        fontFamily: FONT, cursor: !hasChanged || submitting ? "not-allowed" : "pointer",
                        minHeight: 44, minWidth: 140,
                      }}
                    >
                      {submitting ? "Đang cập nhật..." : "Lưu & Tạo lại lộ trình"}
                    </button>
                  </div>
                </div>
              </section>
            )}

            <ChangePasswordSection onSuccess={notifySuccess} onError={notifyError} />

            {showDeleteAccount && (
              <DeleteAccountSection onSuccess={notifySuccess} />
            )}
          </div>
        </div>
      </main>

      <Modal
        show={showConfirm}
        onHide={() => setShowConfirm(false)}
        centered
        contentClassName="profile-confirm-modal"
      >
        <Modal.Header closeButton style={styles.modalHeader}>
          <Modal.Title style={styles.modalTitle}>Xác nhận cập nhật lộ trình</Modal.Title>
        </Modal.Header>
        <Modal.Body style={styles.modalBody}>
          <p style={styles.modalText}>
            AI sẽ tạo lại lộ trình học theo trình độ{" "}
            <strong style={{ color: PRIMARY }}>{selectedLevel ?? currentLevel}</strong>
            {selectedGoal && (
              <> và mục tiêu <strong style={{ color: PRIMARY }}>{GOAL_OPTIONS.find(g => g.slug === selectedGoal)?.label}</strong></>
            )}
            . Tiếp tục?
          </p>
        </Modal.Body>
        <Modal.Footer style={styles.modalFooter}>
          <button type="button" onClick={() => setShowConfirm(false)} style={styles.btnCancel}>
            Hủy
          </button>
          <button type="button" onClick={handleConfirmSave} style={styles.btnConfirm}>
            Xác nhận
          </button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

const styles = {
  main: {
    padding: "28px clamp(20px, 3vw, 40px) 60px",
    fontFamily: FONT,
    background: SURFACE,
    minHeight: "100vh",
  },
  mainEmbedded: {
    padding: 0,
    fontFamily: FONT,
    background: "transparent",
    minHeight: "auto",
  },
  pageHeader: { marginBottom: 36 },
  h1: {
    fontFamily: FONT,
    fontSize: "clamp(24px, 4vw, 32px)",
    fontWeight: 700,
    color: ON_SURFACE,
    margin: "0 0 8px",
  },
  subtitle: {
    fontSize: 16,
    color: ON_SURFACE_VARIANT,
    margin: 0,
    lineHeight: 1.6,
    maxWidth: 560,
  },
  twoCol: {
    display: "flex",
    gap: 48,
    alignItems: "flex-start",
  },
  settingsNav: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    minWidth: 180,
    position: "sticky",
    flexShrink: 0,
  },
  navLink: {
    display: "block",
    padding: "10px 16px",
    borderRadius: 8,
    fontFamily: FONT,
    fontSize: 14,
    fontWeight: 500,
    color: ON_SURFACE_VARIANT,
    textDecoration: "none",
    whiteSpace: "nowrap",
  },
  navLinkDisabled: {
    display: "block",
    padding: "10px 16px",
    borderRadius: 8,
    fontFamily: FONT,
    fontSize: 14,
    fontWeight: 400,
    color: ON_SURFACE_VARIANT,
    cursor: "default",
    whiteSpace: "nowrap",
  },
  sections: {
    flex: 1,
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    gap: 48,
  },
  section: { scrollMarginTop: 90 },
  sectionHeader: {
    borderBottom: `1px solid ${SURFACE_BORDER}`,
    paddingBottom: 16,
    marginBottom: 24,
  },
  h2: {
    fontFamily: FONT,
    fontSize: 22,
    fontWeight: 600,
    color: ON_SURFACE,
    margin: "0 0 6px",
  },
  sectionDesc: {
    fontFamily: FONT,
    fontSize: 15,
    color: ON_SURFACE_VARIANT,
    margin: 0,
    lineHeight: 1.5,
  },
  sectionCard: {
    background: SURFACE_CARD,
    borderRadius: 12,
    border: `1px solid ${SURFACE_BORDER}`,
    padding: "28px 28px 24px",
    boxShadow: "0 4px 12px rgba(53,37,205,0.04)",
  },
  modalHeader: {
    borderBottom: `1px solid ${SURFACE_BORDER}`,
    paddingBottom: 12,
  },
  modalTitle: {
    fontFamily: FONT,
    fontSize: 18,
    fontWeight: 600,
    color: ON_SURFACE,
  },
  modalBody: { paddingTop: 20, paddingBottom: 8 },
  modalText: {
    fontFamily: FONT,
    fontSize: 15,
    color: ON_SURFACE,
    margin: 0,
    lineHeight: 1.6,
  },
  modalFooter: {
    borderTop: `1px solid ${SURFACE_BORDER}`,
    gap: 12,
    paddingTop: 16,
  },
  btnCancel: {
    background: "transparent",
    border: `1px solid ${SURFACE_BORDER}`,
    borderRadius: 8,
    padding: "10px 24px",
    fontSize: 14,
    fontWeight: 600,
    color: ON_SURFACE_VARIANT,
    cursor: "pointer",
    fontFamily: FONT,
    minHeight: 44,
  },
  btnConfirm: {
    background: PRIMARY,
    border: "none",
    borderRadius: 8,
    padding: "10px 28px",
    fontSize: 14,
    fontWeight: 600,
    color: "#fff",
    cursor: "pointer",
    fontFamily: FONT,
    minHeight: 44,
  },
};

const MODAL_CSS = `
  .profile-confirm-modal {
    border-radius: 14px !important;
    font-family: 'Be Vietnam Pro', system-ui, sans-serif;
  }
  @media (max-width: 768px) {
    .profile-settings-two-col {
      flex-direction: column;
    }
    .profile-settings-nav {
      position: static !important;
      flex-direction: row !important;
      overflow-x: auto;
      width: 100%;
    }
  }
`;
