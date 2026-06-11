# speak-buddi-be/routers/profile.py
# ─── Profile API routes (S2.3, S12.2) ───────────────────────────────────────
#
# Endpoints:
#   PATCH  /api/profile/level    → UpdateLevelOut
#   DELETE /api/profile/account  → DeleteAccountOut (S12.2)
#
# Guard: Depends(current_user) — yêu cầu đăng nhập (JWT hợp lệ).
# ─────────────────────────────────────────────────────────────────────────────

import hashlib
import hmac
import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from auth.deps import current_user
from db.connection import get_db
from repositories import user_repo
from schemas.profile import (
    ChangePasswordOut,
    ChangePasswordRequest,
    DeleteAccountOut,
    DeleteAccountRequest,
    UpdateGoalOut,
    UpdateGoalRequest,
    UpdateLearningOut,
    UpdateLearningRequest,
    UpdateLevelOut,
    UpdateLevelRequest,
    UpdateNameOut,
    UpdateNameRequest,
)
from services.roadmap_ai_service import generate_roadmap_sequence
from utils.validators import validate_password

log = logging.getLogger("speakbuddi.profile")

router = APIRouter(prefix="/api/profile", tags=["profile"])

VALID_LEVELS = {"A1", "A2", "B1", "B2", "C1", "C2"}
VALID_GOALS  = {"travel", "work", "communication"}


async def _regen_roadmap(db: AsyncSession, user_id: str, level: str, goal: str) -> bool:
    """Sinh lại roadmap_sequence sau khi đổi level hoặc goal. Degrade an toàn — không raise."""
    if not level or not goal:
        return False
    try:
        topics   = await user_repo.get_topics_by_level(db, level)
        sequence = await generate_roadmap_sequence(level, goal, topics)
        if sequence:
            await user_repo.update_roadmap_sequence(db, user_id, sequence)
            return True
    except Exception:
        log.warning("PROFILE regen_roadmap failed user=%s — fallback to NULL", user_id)
    return False


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

    # 2. Cập nhật DB (xóa roadmap_sequence cũ trong cùng query)
    result = await user_repo.update_level(db, user_id=user_id, level=level)

    if result is None:
        raise HTTPException(status_code=404, detail="Người dùng không tồn tại.")

    # 3. Re-gen roadmap với level mới + goal cũ (degrade an toàn)
    goal = result.get("learning_goal") or ""
    roadmap_generated = await _regen_roadmap(db, user_id, level, goal)

    log.info("PROFILE update_level user=%s level=%s regen=%s", user_id, level, roadmap_generated)

    return UpdateLevelOut(
        level=result["target_level"],
        onboarding_completed=result["target_level"] is not None,
    )


# ─── PATCH /api/profile/goal ──────────────────────────────────────────────────

@router.patch("/goal", response_model=UpdateGoalOut)
async def update_goal(
    req: UpdateGoalRequest,
    payload: dict = Depends(current_user),
    db: AsyncSession = Depends(get_db),
) -> UpdateGoalOut:
    """Cập nhật mục tiêu học tập và re-gen roadmap_sequence với level hiện tại."""
    goal = (req.learning_goal or "").strip().lower()
    if goal not in VALID_GOALS:
        raise HTTPException(status_code=400, detail="Mục tiêu không hợp lệ.")

    user_id = payload.get("sub", "")
    result  = await user_repo.update_goal(db, user_id=user_id, learning_goal=goal)

    if result is None:
        raise HTTPException(status_code=404, detail="Người dùng không tồn tại.")

    level = result.get("target_level") or ""
    roadmap_generated = await _regen_roadmap(db, user_id, level, goal)

    log.info("PROFILE update_goal user=%s goal=%s regen=%s", user_id, goal, roadmap_generated)

    return UpdateGoalOut(learning_goal=goal, roadmap_generated=roadmap_generated)


# ─── PATCH /api/profile/learning (level + goal cùng lúc, re-gen 1 lần) ────────

@router.patch("/learning", response_model=UpdateLearningOut)
async def update_learning(
    req: UpdateLearningRequest,
    payload: dict = Depends(current_user),
    db: AsyncSession = Depends(get_db),
) -> UpdateLearningOut:
    """Cập nhật trình độ + mục tiêu học tập cùng lúc, re-gen roadmap 1 lần duy nhất."""
    level = req.level.strip().upper()
    if level not in VALID_LEVELS:
        raise HTTPException(status_code=400, detail="⚠ Trình độ không hợp lệ. Vui lòng chọn từ A1 đến C2.")

    goal = (req.learning_goal or "").strip().lower()
    if goal not in VALID_GOALS:
        raise HTTPException(status_code=400, detail="Mục tiêu không hợp lệ.")

    user_id = payload.get("sub", "")
    result  = await user_repo.update_learning(db, user_id=user_id, level=level, learning_goal=goal)

    if result is None:
        raise HTTPException(status_code=404, detail="Người dùng không tồn tại.")

    roadmap_generated = await _regen_roadmap(db, user_id, level, goal)
    log.info("PROFILE update_learning user=%s level=%s goal=%s regen=%s", user_id, level, goal, roadmap_generated)

    return UpdateLearningOut(level=level, learning_goal=goal, roadmap_generated=roadmap_generated)


# ─── PATCH /api/profile/name ──────────────────────────────────────────────────

@router.patch("/name", response_model=UpdateNameOut)
async def update_name(
    req: UpdateNameRequest,
    payload: dict = Depends(current_user),
    db: AsyncSession = Depends(get_db),
) -> UpdateNameOut:
    """Cập nhật tên hiển thị trong user_profile."""
    name = (req.name or "").strip()
    if not name:
        raise HTTPException(status_code=400, detail="Tên không được để trống.")
    if len(name) > 80:
        raise HTTPException(status_code=400, detail="Tên không được vượt quá 80 ký tự.")

    user_id = payload.get("sub", "")
    updated = await user_repo.update_name(db, user_id=user_id, name=name)
    if updated is None:
        raise HTTPException(status_code=404, detail="Người dùng không tồn tại.")

    log.info("PROFILE update_name user=%s", user_id)
    return UpdateNameOut(name=updated)


# ─── PATCH /api/profile/password ──────────────────────────────────────────────

@router.patch("/password", response_model=ChangePasswordOut)
async def change_password(
    req: ChangePasswordRequest,
    payload: dict = Depends(current_user),
    db: AsyncSession = Depends(get_db),
) -> ChangePasswordOut:
    """
    Đổi hoặc đặt mật khẩu.
    - Có password_hash: bắt buộc current_password đúng.
    - OAuth-only (không password): cho phép đặt mật khẩu mới không cần current.
    """
    user_id = payload.get("sub", "")
    user = await user_repo.get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Người dùng không tồn tại.")

    new_pw = req.new_password or ""
    if not validate_password(new_pw):
        raise HTTPException(
            status_code=400,
            detail="Mật khẩu phải có ít nhất 8 ký tự và 1 chữ số.",
        )

    if user.get("password_hash"):
        current = req.current_password or ""
        if not current:
            raise HTTPException(status_code=400, detail="Vui lòng nhập mật khẩu hiện tại.")
        current_hash = hashlib.sha256(current.encode()).hexdigest()
        if not hmac.compare_digest(current_hash, user["password_hash"]):
            raise HTTPException(status_code=400, detail="Mật khẩu hiện tại không đúng.")

    pw_hash = hashlib.sha256(new_pw.encode()).hexdigest()
    await user_repo.update_password(db, user_id, pw_hash)
    await db.commit()

    log.info("PROFILE change_password user=%s", user_id)
    return ChangePasswordOut(
        message="Mật khẩu đã được cập nhật thành công.",
        has_password=True,
    )


# ─── DELETE /api/profile/account (S12.2) ──────────────────────────────────────

CONFIRM_DELETE_TEXT = "XOA"


@router.delete("/account", response_model=DeleteAccountOut)
async def delete_account(
    req: DeleteAccountRequest,
    payload: dict = Depends(current_user),
    db: AsyncSession = Depends(get_db),
) -> DeleteAccountOut:
    """
    Xóa dữ liệu cá nhân và vô hiệu hóa tài khoản (§4.6/§4.7).
    Yêu cầu confirm_text='XOA' và mật khẩu nếu tài khoản có password_hash.
    Admin không được tự xóa qua luồng này (BR07).
    """
    user_id = payload.get("sub", "")
    user = await user_repo.get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Người dùng không tồn tại.")

    if user.get("role") == "admin":
        raise HTTPException(
            status_code=403,
            detail="Tài khoản quản trị không thể tự xóa qua ứng dụng. Vui lòng liên hệ đội vận hành.",
        )

    if (req.confirm_text or "").strip() != CONFIRM_DELETE_TEXT:
        raise HTTPException(
            status_code=400,
            detail="Vui lòng nhập đúng cụm xác nhận XOA để tiếp tục.",
        )

    if user.get("password_hash"):
        pw = req.password or ""
        if not pw:
            raise HTTPException(
                status_code=400,
                detail="Vui lòng nhập mật khẩu để xác nhận xóa tài khoản.",
            )
        pw_hash = hashlib.sha256(pw.encode()).hexdigest()
        if not hmac.compare_digest(pw_hash, user["password_hash"]):
            raise HTTPException(status_code=400, detail="Mật khẩu không đúng.")

    ok = await user_repo.delete_user_personal_data(db, user_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Người dùng không tồn tại.")

    log.info("ACCOUNT_DELETE ok user=%s", user_id)
    return DeleteAccountOut(message="Tài khoản và dữ liệu cá nhân đã được xóa.")
