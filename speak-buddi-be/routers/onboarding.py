# speak-buddi-be/routers/onboarding.py
# ─── Onboarding API routes (S2.1) ─────────────────────────────────────────────
#
# Endpoints:
#   GET  /api/onboarding/topics?level=A1   → list[TopicOut]
#   POST /api/onboarding                   → OnboardingOut
#
# Guard: Depends(current_user) — yêu cầu đăng nhập (JWT hợp lệ).
# Validate BR09: level phải thuộc {A1, A2, B1, B2, C1, C2}.
# ─────────────────────────────────────────────────────────────────────────────

import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from auth.deps import current_user
from db.connection import get_db
from repositories import user_repo
from schemas.onboarding import OnboardingOut, OnboardingRequest, TopicOut

log = logging.getLogger("speakbuddi.onboarding")

router = APIRouter(prefix="/api/onboarding", tags=["onboarding"])

# Tập level hợp lệ (BR09)
VALID_LEVELS = {"A1", "A2", "B1", "B2", "C1", "C2"}
# Tập daily_minutes hợp lệ
VALID_MINUTES = {5, 10, 15, 20}


# ─── GET /api/onboarding/topics ───────────────────────────────────────────────

@router.get("/topics", response_model=list[TopicOut])
async def get_onboarding_topics(
    level: str,
    _user: dict = Depends(current_user),
    db: AsyncSession = Depends(get_db),
) -> list[TopicOut]:
    """
    Trả danh sách topic active theo level để hiển thị ở bước 2 onboarding.
    Query param `level` bắt buộc, phải thuộc {A1, A2, B1, B2, C1, C2} (BR09).
    """
    level_upper = level.strip().upper()
    if level_upper not in VALID_LEVELS:
        raise HTTPException(
            status_code=400,
            detail=f"Level không hợp lệ. Vui lòng chọn một trong: {', '.join(sorted(VALID_LEVELS))}.",
        )

    topics = await user_repo.get_topics_by_level(db, level_upper)
    return [TopicOut(**t) for t in topics]


# ─── POST /api/onboarding ─────────────────────────────────────────────────────

@router.post("", response_model=OnboardingOut)
async def submit_onboarding(
    req: OnboardingRequest,
    payload: dict = Depends(current_user),
    db: AsyncSession = Depends(get_db),
) -> OnboardingOut:
    """
    Lưu kết quả onboarding 4 bước vào user_profile.
    Validate: level (BR09), daily_minutes, words_per_session > 0.
    Không log topics/dữ liệu cá nhân chi tiết (SRS §4.5).
    """
    # 1. Chuẩn hóa + validate level (BR09 — §5.2)
    level = req.level.strip().upper()
    if level not in VALID_LEVELS:
        raise HTTPException(
            status_code=400,
            detail="⚠ Vui lòng chọn trình độ tiếng Anh của bạn.",
        )

    # 2. Validate daily_minutes
    if req.daily_minutes not in VALID_MINUTES:
        raise HTTPException(
            status_code=400,
            detail=f"daily_minutes phải là một trong: {sorted(VALID_MINUTES)}.",
        )

    # 3. Validate words_per_session
    if req.words_per_session <= 0:
        raise HTTPException(
            status_code=400,
            detail="words_per_session phải lớn hơn 0.",
        )

    user_id = payload.get("sub", "")

    # 4. Lưu vào DB
    result = await user_repo.update_onboarding(
        db,
        user_id=user_id,
        level=level,
        topics=req.topics,
        daily_minutes=req.daily_minutes,
        words_per_session=req.words_per_session,
    )

    if not result:
        raise HTTPException(status_code=404, detail="Người dùng không tồn tại.")

    log.info("ONBOARDING ok user=%s level=%s", user_id, level)

    return OnboardingOut(
        level=result["target_level"],
        topics=result["interests"] or [],
        daily_minutes=result["daily_minutes"],
        words_per_session=result["words_per_session"],
        onboarding_completed=True,
    )
