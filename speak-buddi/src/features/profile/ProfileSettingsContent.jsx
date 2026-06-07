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
import { updateLevel } from "./services/profileService";
import Toast from "../../shared/components/Toast";

const PRIMARY = "#3525cd";
const SURFACE = "#fcf8ff";
const SURFACE_CARD = "#ffffff";
const SURFACE_BORDER = "#c7c4d8";
const ON_SURFACE = "#1b1b24";
const ON_SURFACE_VARIANT = "#464555";
const FONT = "'Be Vietnam Pro', system-ui, sans-serif";
const SURFACE_LOW = "#f5f2ff";
function LevelDisplay({ level }) {
  const found = LEVELS.find((l) => l.code === level);
  const badge = level ? BADGE_COLORS[level] : null;

  return (
    <div
      style={{
        background: SURFACE_LOW,
        borderRadius: 12,
        padding: "20px 24px",
        border: `1px solid ${SURFACE_BORDER}`,
        display: "flex",
        alignItems: "center",
        gap: 16,
        marginBottom: 24,
        boxShadow: "0 4px 12px rgba(53,37,205,0.04)",
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 10,
          background: PRIMARY + "18",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill={PRIMARY}>
          <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3zm0 12.08L4.59 11 12 6.92 19.41 11 12 15.08zM5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z" />
        </svg>
      </div>
      <div>
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: ON_SURFACE_VARIANT,
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            marginBottom: 4,
          }}
        >
          Trình độ hiện tại
        </div>
        {level && badge ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                background: badge.bg,
                color: badge.text,
                padding: "2px 12px",
                borderRadius: 9999,
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}
            >
              {level}
            </span>
            <span style={{ fontSize: 18, fontWeight: 600, color: ON_SURFACE }}>
              {found?.label}
            </span>
          </div>
        ) : (
          <span style={{ fontSize: 15, color: ON_SURFACE_VARIANT }}>Chưa thiết lập</span>
        )}
      </div>
    </div>
  );
}

/**
 * @param {{ variant?: "user" | "admin", embedded?: boolean }} props
 */
export default function ProfileSettingsContent({ variant = "user", embedded = false }) {
  const isAdminProfile = variant === "admin";
  const showLevelSection = !isAdminProfile;
  const showDeleteAccount = !isAdminProfile;

  const { user, updateUser } = useAuth();
  const currentLevel = user?.level ?? null;

  const [selectedLevel, setSelectedLevel] = useState(currentLevel);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({ message: "", type: "success" });

  const hasChanged = selectedLevel !== null && selectedLevel !== currentLevel;

  async function handleConfirmSave() {
    setShowConfirm(false);
    setSubmitting(true);
    try {
      const data = await updateLevel(selectedLevel);
      updateUser({ level: data.level, onboarding_completed: data.onboarding_completed });
      setToast({ message: "Đã cập nhật trình độ thành công!", type: "success" });
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
              <a href="#learning-level" style={styles.navLink}>Trình độ học</a>
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
              <section id="learning-level" style={styles.section}>
                <div style={styles.sectionHeader}>
                  <div>
                    <h2 style={styles.h2}>Trình độ tiếng Anh</h2>
                    <p style={styles.sectionDesc}>
                      Cập nhật trình độ để lộ trình học được cá nhân hóa chính xác hơn.
                    </p>
                  </div>
                </div>

                <div style={styles.sectionCard}>
                  <LevelDisplay level={user?.level ?? null} />
                  <div style={{ marginBottom: 28 }}>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: ON_SURFACE,
                        marginBottom: 12,
                        fontFamily: FONT,
                      }}
                    >
                      Chọn trình độ mới:
                    </div>
                    <LevelSelector value={selectedLevel} onChange={setSelectedLevel} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <button
                      type="button"
                      onClick={() => hasChanged && setShowConfirm(true)}
                      disabled={!hasChanged || submitting}
                      style={{
                        background: !hasChanged || submitting ? "#c7c4d8" : PRIMARY,
                        color: "#fff",
                        border: "none",
                        borderRadius: 10,
                        padding: "12px 32px",
                        fontSize: 15,
                        fontWeight: 600,
                        fontFamily: FONT,
                        cursor: !hasChanged || submitting ? "not-allowed" : "pointer",
                        minHeight: 44,
                        minWidth: 140,
                      }}
                    >
                      {submitting ? "Đang lưu..." : "Lưu thay đổi"}
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
          <Modal.Title style={styles.modalTitle}>Xác nhận đổi trình độ</Modal.Title>
        </Modal.Header>
        <Modal.Body style={styles.modalBody}>
          <p style={styles.modalText}>
            Lộ trình học sẽ được cập nhật theo trình độ{" "}
            <strong style={{ color: PRIMARY }}>{selectedLevel}</strong>. Tiếp tục?
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
