import hashlib
import hmac
import logging
import secrets
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from auth.deps import current_user
from auth.jwt import make_access_token, make_refresh_token, verify_token
from db.connection import get_db
from repositories import user_repo
from schemas.auth import (
    ForgotPasswordRequest,
    GoogleAuthRequest,
    LoginRequest,
    RefreshRequest,
    RegisterRequest,
    ResetPasswordRequest,
    user_to_dict,
)
from services.email_service import send_reset_email
from services.google_auth import verify_google_id_token
from utils.validators import validate_email, validate_password

log = logging.getLogger("speakbuddi.auth")

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register")
async def register(req: RegisterRequest, db: AsyncSession = Depends(get_db)):
    name  = req.name.strip()
    email = req.email.strip().lower()
    pw    = req.password

    if not name or not email or not pw:
        raise HTTPException(status_code=400, detail="Vui lòng điền đầy đủ thông tin.")
    if not validate_email(email):
        raise HTTPException(status_code=400, detail="Email không hợp lệ.")
    if not validate_password(pw):
        raise HTTPException(status_code=400, detail="Mật khẩu phải có ít nhất 8 ký tự và 1 chữ số.")

    if await user_repo.get_user_by_email(db, email):
        raise HTTPException(status_code=409, detail="Email đã được sử dụng.")

    pw_hash = hashlib.sha256(pw.encode()).hexdigest()
    user    = await user_repo.create_user(db, email, name, pw_hash)
    log.info("REGISTER new user id=%s", user["id"])

    return {
        "access_token":  make_access_token(user, is_paid=False),
        "refresh_token": make_refresh_token(user),
        "user": user_to_dict(user, is_paid=False),
    }


@router.post("/login")
async def login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    email = req.email.strip().lower() if req.email else ""
    pw    = req.password or ""
    if not email or not pw:
        raise HTTPException(status_code=400, detail="Vui lòng điền đầy đủ thông tin.")

    user    = await user_repo.get_user_by_email(db, email)
    pw_hash = hashlib.sha256(pw.encode()).hexdigest()
    # Dùng chung message để chống user-enumeration (AC-02-02)
    if (
        not user
        or not user.get("password_hash")
        or not hmac.compare_digest(pw_hash, user["password_hash"])
    ):
        raise HTTPException(status_code=401, detail="Email hoặc mật khẩu không đúng.")

    if user.get("status") == "suspended":
        raise HTTPException(status_code=403, detail="Tài khoản đã bị khóa.")

    is_paid = await user_repo.get_is_paid(db, user["id"])
    log.info("LOGIN ok user=%s", user["id"])
    return {
        "access_token":  make_access_token(user, is_paid),
        "refresh_token": make_refresh_token(user),
        "user": user_to_dict(user, is_paid),
    }


@router.post("/refresh")
async def refresh_token(req: RefreshRequest, db: AsyncSession = Depends(get_db)):
    try:
        payload = verify_token(req.refresh_token)
    except HTTPException:
        raise HTTPException(status_code=401, detail="Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.")

    if payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.")

    user = await user_repo.get_user_by_id(db, payload.get("sub", ""))
    if not user:
        raise HTTPException(status_code=401, detail="Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.")

    is_paid = await user_repo.get_is_paid(db, user["id"])
    log.info("REFRESH ok user=%s", user["id"])
    return {"access_token": make_access_token(user, is_paid)}


@router.get("/me")
async def me(user: dict = Depends(current_user), db: AsyncSession = Depends(get_db)):
    db_user = await user_repo.get_user_by_id(db, user.get("sub", ""))
    if not db_user:
        raise HTTPException(status_code=401, detail="Người dùng không tồn tại.")
    is_paid = await user_repo.get_is_paid(db, db_user["id"])
    return user_to_dict(db_user, is_paid)


@router.post("/google")
async def google_oauth(req: GoogleAuthRequest, db: AsyncSession = Depends(get_db)):
    google_payload = verify_google_id_token(req.id_token)

    google_sub = google_payload["sub"]
    raw_email  = google_payload.get("email", f"{google_sub}@google.oauth")
    email      = raw_email.lower()
    name       = google_payload.get("name", email.split("@")[0])

    # 3 nhánh: login trực tiếp / link / tạo mới (AC-02-03)
    user = await user_repo.get_user_by_oauth(db, "google", google_sub)
    if user is None:
        existing = await user_repo.get_user_by_email(db, email)
        if existing:
            await user_repo.link_oauth(db, existing["id"], "google", google_sub)
            user = existing
        else:
            user = await user_repo.create_user(db, email, name, None)
            await user_repo.link_oauth(db, user["id"], "google", google_sub)

    if user.get("status") == "suspended":
        raise HTTPException(status_code=403, detail="Tài khoản đã bị khóa.")

    is_paid = await user_repo.get_is_paid(db, user["id"])
    log.info("GOOGLE_AUTH ok user=%s", user["id"])
    return {
        "access_token":  make_access_token(user, is_paid),
        "refresh_token": make_refresh_token(user),
        "user": user_to_dict(user, is_paid),
    }


@router.post("/forgot-password")
async def forgot_password(req: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    email = req.email.strip().lower() if req.email else ""
    if not email or not validate_email(email):
        raise HTTPException(status_code=400, detail="Email không hợp lệ.")

    user = await user_repo.get_user_by_email(db, email)
    if user:
        raw_token  = secrets.token_urlsafe(32)
        token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
        await user_repo.create_reset_token(db, user["id"], token_hash)
        log.info("RESET_TOKEN created (không log email/token)")
        send_reset_email(email, raw_token)

    # Luôn trả 200 dù email tồn tại hay không (chống user enumeration — AC-02-04)
    return {"message": "Nếu email tồn tại trong hệ thống, chúng tôi đã gửi hướng dẫn đặt lại mật khẩu."}


@router.post("/reset-password")
async def reset_password(req: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    raw_token = req.token.strip() if req.token else ""
    new_pw    = req.new_password or ""

    if not raw_token:
        raise HTTPException(status_code=400, detail="Yêu cầu đặt lại mật khẩu không hợp lệ hoặc đã được sử dụng.")

    token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
    record     = await user_repo.get_reset_token(db, token_hash)
    if not record:
        raise HTTPException(status_code=400, detail="Yêu cầu đặt lại mật khẩu không hợp lệ hoặc đã được sử dụng.")

    expires_at = record["expires_at"]
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Yêu cầu đặt lại mật khẩu đã hết hạn. Vui lòng gửi lại yêu cầu.")

    if not validate_password(new_pw):
        raise HTTPException(status_code=400, detail="Mật khẩu phải có ít nhất 8 ký tự và 1 chữ số.")

    pw_hash = hashlib.sha256(new_pw.encode()).hexdigest()
    await user_repo.update_password(db, record["user_id"], pw_hash)
    await user_repo.use_reset_token(db, record["token_id"])
    log.info("RESET_PASSWORD ok user=%s", record["user_id"])
    return {"message": "Mật khẩu đã được cập nhật thành công."}
