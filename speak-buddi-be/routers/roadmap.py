# speak-buddi-be/routers/roadmap.py
# ─── Roadmap API routes (S2.2) ────────────────────────────────────────────────
#
# Endpoints:
#   GET /api/roadmap   → RoadmapOut
#
# Guard: Depends(current_user) — yêu cầu đăng nhập (JWT hợp lệ) [AC-04-03].
# Roadmap được tính on-the-fly từ active content, KHÔNG lưu bảng riêng (§3).
# ─────────────────────────────────────────────────────────────────────────────

import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from auth.deps import current_user
from db.connection import get_db
from repositories import roadmap_repo
from schemas.roadmap import RoadmapNode, RoadmapOut

log = logging.getLogger("speakbuddi.roadmap")

router = APIRouter(prefix="/api/roadmap", tags=["roadmap"])

# Tập level hợp lệ (BR09) — tái dùng hằng giống onboarding.py
VALID_LEVELS = {"A1", "A2", "B1", "B2", "C1", "C2"}


# ─── GET /api/roadmap ─────────────────────────────────────────────────────────

@router.get("", response_model=RoadmapOut)
async def get_roadmap(
    payload: dict = Depends(current_user),
    db: AsyncSession = Depends(get_db),
) -> RoadmapOut:
    """
    Trả roadmap cá nhân hóa của user hiện tại.
    - Topics khớp level đã chọn trong onboarding, chỉ content is_active=TRUE (AC-04-02).
    - Topics user đã quan tâm (interests) xếp trước, kèm is_interest=True (AC-03-02).
    - Chưa onboarding (target_level NULL) → trả roadmap rỗng, KHÔNG 400 (AC-04-04).
    - Không có topic active cho level → nodes=[], total_topics=0 (AC-04-04).
    Không log dữ liệu cá nhân chi tiết (SRS §4.5).
    """
    user_id: str = payload.get("sub", "")

    result = await roadmap_repo.get_roadmap(db, user_id)

    # user_profile không tồn tại (hiếm — chỉ khi user bị xóa giữa chừng)
    if result is None:
        raise HTTPException(status_code=404, detail="Không tìm thấy hồ sơ người dùng.")

    level = result["level"]

    # Validate level thuộc tập hợp lệ nếu đã set (BR09)
    if level is not None and level.upper() not in VALID_LEVELS:
        log.warning("ROADMAP invalid_level user=%s level=%s", user_id, level)
        raise HTTPException(
            status_code=400,
            detail=f"Level không hợp lệ trong hồ sơ. Vui lòng cập nhật onboarding.",
        )

    log.info("ROADMAP get user=%s level=%s total=%s", user_id, level, result["total_topics"])

    nodes = [RoadmapNode(**n) for n in result["nodes"]]

    return RoadmapOut(
        level=level or "",
        level_name=result["level_name"] or "",
        goal_label=result.get("goal_label") or "",
        total_topics=result["total_topics"],
        selected_topics=result["selected_topics"],
        nodes=nodes,
    )
