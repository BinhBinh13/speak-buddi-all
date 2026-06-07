// AdminProfilePage — Hồ sơ admin (không có trình độ học / xóa tài khoản)

import ProfileSettingsContent from "../profile/ProfileSettingsContent";

export default function AdminProfilePage() {
  return <ProfileSettingsContent variant="admin" embedded />;
}
