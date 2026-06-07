// src/features/profile/ProfilePage.jsx — Hồ sơ học viên (S2.3)

import AppLayout from "../../shared/components/AppLayout";
import ProfileSettingsContent from "./ProfileSettingsContent";

export default function ProfilePage() {
  return (
    <AppLayout>
      <ProfileSettingsContent variant="user" />
    </AppLayout>
  );
}
