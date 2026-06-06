# speak-buddi-be/routers/profile.py
# ─── Profile API routes (S2.3) ────────────────────────────────────────────────
#
# Endpoints:
#   PATCH /api/profile/level   → UpdateLevelOut
#
# Guard: Depends(current_user) — yêu cầu đăng nhập (JWT hợp lệ).
# Validate BR09: level phải thuộc {A1, A2, B1, B2, C1, C2}.
# Chỉ UPDATE target_level — không đụng interests/daily_minutes/words_per_session.
# ─────────────────────────────────────────────────────────────────────────────

import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from auth.deps import current_user
from db.connection import get_db
from repositories import user_repo
from schemas.profile import UpdateLevelOut, UpdateLevelRequest

log = logging.getLogger("speakbuddi.profile")

router = APIRouter(prefix="/api/profile", tags=["profile"])

# Tập level hợp lệ (BR09)
VALID_LEVELS = {"A1", "A2", "B1", "B2", "C1", "C2"}


# ─── PATCH /api/profile/level ─────────────────────────────────────────────────

@router.patch("/level", response_model=UpdateLevelOut)
async def update_level(
    req: UpdateLevelRequest,
    payload: dict = Depends(current_user),
    db: AsyncSession = Depends(get_db),
) -> UpdateLevelOut:
    """
    Cập nhật trình độ CEFR trong user_profile.
    Chỉ động tới cột target_level — không reset interests/daily_minutes.
    Validate BR09: level phải thuộc {A1, A2, B1, B2, C1, C2}.
    Không log dữ liệu cá nhân (SRS §4.5).
    """
    # 1. Chuẩn hóa + validate level (BR09)
    level = req.level.strip().upper()
    if level not in VALID_LEVELS:
        raise HTTPException(
            status_code=400,
            detail="⚠ Trình độ không hợp lệ. Vui lòng chọn từ A1 đến C2.",
        )

    user_id = payload.get("sub", "")

    # 2. Cập nhật DB
    result = await user_repo.update_level(db, user_id=user_id, level=level)

    if result is None:
        raise HTTPException(status_code=404, detail="Người dùng không tồn tại.")

    # 3. Log an toàn — chỉ ghi user_id và level (SRS §4.5)
    log.info("PROFILE update_level user=%s level=%s", user_id, level)

    return UpdateLevelOut(
        level=result["target_level"],
        onboarding_completed=result["target_level"] is not None,
    )
