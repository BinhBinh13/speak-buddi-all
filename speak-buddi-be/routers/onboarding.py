# speak-buddi-be/routers/onboarding.py
# ─── Onboarding API routes (S2.1 revised v2 — scenario-based roadmap) ─────────
#
# Endpoints:
#   GET  /api/onboarding/topics?level=A1   → list[TopicOut]  [DEPRECATED — giữ lại]
#   POST /api/onboarding                   → OnboardingOut
#
# Guard: Depends(current_user) — yêu cầu đăng nhập (JWT hợp lệ).
# Validate BR09: level phải thuộc {A1, A2, B1, B2, C1, C2}.
# Validate: learning_goal phải thuộc VALID_GOALS.
# AI degrade: Claude lỗi → onboarding vẫn pass, roadmap_generated=False (SRS §4.5).
# ─────────────────────────────────────────────────────────────────────────────

import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from auth.deps import current_user
from db.connection import get_db
from repositories import user_repo
from schemas.onboarding import OnboardingOut, OnboardingRequest, TopicOut
from services.roadmap_ai_service import generate_roadmap_sequence

log = logging.getLogger("speakbuddi.onboarding")

router = APIRouter(prefix="/api/onboarding", tags=["onboarding"])

# Tập level hợp lệ (BR09)
VALID_LEVELS = {"A1", "A2", "B1", "B2", "C1", "C2"}
# Tập mục tiêu học hợp lệ (S2.1 v2)
VALID_GOALS = {"travel", "work", "communication"}


# ─── GET /api/onboarding/topics ───────────────────────────────────────────────

@router.get("/topics", response_model=list[TopicOut])
async def get_onboarding_topics(
    level: str,
    _user: dict = Depends(current_user),
    db: AsyncSession = Depends(get_db),
) -> list[TopicOut]:
    """
    [DEPRECATED — FE không còn gọi endpoint này kể từ S2.1 v2]
    Trả danh sách topic active theo level để hiển thị ở bước 2 onboarding (cũ).
    Giữ lại để không phá API contract / dùng cho admin/debug.
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
    Lưu kết quả onboarding 3 bước vào user_profile (S2.1 revised).
    Validate: level (BR09), learning_goal, words_per_session >= 0.
    words_per_session=0 → speaking-only mode (không sinh roadmap vocab).
    Sau khi lưu profile → fetch topics → gọi AI gen roadmap_sequence.
    AI lỗi → degrade an toàn: onboarding vẫn pass, roadmap_generated=False.
    Không log learning_goal hay dữ liệu cá nhân chi tiết (SRS §4.5).
    """
    # 1. Chuẩn hóa + validate level (BR09 — §5.2)
    level = req.level.strip().upper()
    if level not in VALID_LEVELS:
        raise HTTPException(
            status_code=400,
            detail="Vui lòng chọn trình độ tiếng Anh của bạn.",
        )

    # 2. Validate learning_goal
    goal = req.learning_goal.strip().lower()
    if goal not in VALID_GOALS:
        raise HTTPException(
            status_code=400,
            detail=f"learning_goal không hợp lệ. Vui lòng chọn một trong: {', '.join(sorted(VALID_GOALS))}.",
        )

    # 3. Validate words_per_session: 0 = speaking-only, >0 = học từ
    if req.words_per_session < 0:
        raise HTTPException(
            status_code=400,
            detail="words_per_session không hợp lệ.",
        )

    user_id = payload.get("sub", "")

    # 5. Lưu level + goal + words vào DB (interests = NULL)
    result = await user_repo.update_onboarding(
        db,
        user_id=user_id,
        level=level,
        learning_goal=goal,
        daily_minutes=10,  # giữ default; không hỏi user nữa
        words_per_session=req.words_per_session,
    )

    if not result:
        raise HTTPException(status_code=404, detail="Người dùng không tồn tại.")

    # 6. Fetch topics theo level để truyền cho AI
    topics = await user_repo.get_topics_by_level(db, level)

    # 7. Gọi AI sinh roadmap_sequence — chỉ khi user học từ vựng (words > 0)
    roadmap_generated = False
    if req.words_per_session > 0:
        try:
            sequence = await generate_roadmap_sequence(level, goal, topics)
            if sequence:
                saved = await user_repo.update_roadmap_sequence(db, user_id, sequence)
                roadmap_generated = saved
        except Exception as exc:  # noqa: BLE001
            log.warning("ONBOARDING: roadmap gen unexpected error — %s", exc)

    log.info(
        "ONBOARDING ok user=%s level=%s words=%d roadmap_n=%d",
        user_id,
        level,
        req.words_per_session,
        len(topics),
    )

    return OnboardingOut(
        level=result["target_level"],
        learning_goal=result["learning_goal"],
        words_per_session=result["words_per_session"],
        onboarding_completed=True,
        roadmap_generated=roadmap_generated,
    )
