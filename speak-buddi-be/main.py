import os
import io
import json
import time
import base64
import hashlib
import hmac
import logging
import re as _re
import secrets
import smtplib
from datetime import datetime, timedelta, timezone
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from functools import lru_cache
from urllib.parse import quote
from dotenv import load_dotenv
import anthropic
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from elevenlabs.client import ElevenLabs
from pydantic import BaseModel
from google.oauth2 import id_token as google_id_token
from google.auth.transport import requests as google_requests
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from db.connection import get_db

# ─── Config ───────────────────────────────────────────────────────────────────
load_dotenv()

logging.basicConfig(level=logging.INFO, format="%(asctime)s  %(levelname)s  %(message)s")
log = logging.getLogger("speakbuddi")

ANTHROPIC_API_KEY   = os.getenv("ANTHROPIC_API_KEY", "")
ELEVENLABS_API_KEY  = os.getenv("ELEVENLABS_API_KEY", "")
ELEVENLABS_VOICE_ID = os.getenv("ELEVENLABS_VOICE_ID", "pNInz6obpgDQGcFmaJgB")
JWT_SECRET          = os.getenv("JWT_SECRET", "speakbuddi-secret-change-in-prod")
ALLOWED_ORIGINS     = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000").split(",")
GOOGLE_CLIENT_ID    = os.getenv("GOOGLE_CLIENT_ID", "")
MAX_HISTORY_TURNS   = 10

# ── Gmail SMTP ─────────────────────────────────────────────────────────────────
SMTP_HOST       = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT       = int(os.getenv("SMTP_PORT", 587))
SMTP_USER       = os.getenv("SMTP_USER", "")
SMTP_PASS       = os.getenv("SMTP_PASS", "")
FRONTEND_URL    = os.getenv("FRONTEND_URL", "http://localhost:5173")
RESET_TOKEN_TTL = 30 * 60  # 30 phút (giây)

# ─── App ──────────────────────────────────────────────────────────────────────
app = FastAPI(title="SpeakBuddi API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Reply-Text"],
)

# ─── API Clients ──────────────────────────────────────────────────────────────
@lru_cache(maxsize=1)
def get_claude_client() -> anthropic.Anthropic:
    if not ANTHROPIC_API_KEY:
        raise RuntimeError("ANTHROPIC_API_KEY not set in .env")
    return anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)

@lru_cache(maxsize=1)
def get_elevenlabs_client() -> ElevenLabs:
    if not ELEVENLABS_API_KEY:
        raise RuntimeError("ELEVENLABS_API_KEY not set in .env")
    return ElevenLabs(api_key=ELEVENLABS_API_KEY)

# ─── JWT (minimal, no external lib) ──────────────────────────────────────────
ACCESS_TTL  = 15 * 60    # 15 phút
REFRESH_TTL = 7 * 86400  # 7 ngày

def _b64url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()

def _sign(payload: dict) -> str:
    header = _b64url(b'{"alg":"HS256","typ":"JWT"}')
    body   = _b64url(json.dumps(payload).encode())
    sig    = _b64url(hmac.new(JWT_SECRET.encode(), f"{header}.{body}".encode(), hashlib.sha256).digest())
    return f"{header}.{body}.{sig}"

def _verify(token: str) -> dict:
    try:
        h, b, s = token.split(".")
        expected = _b64url(hmac.new(JWT_SECRET.encode(), f"{h}.{b}".encode(), hashlib.sha256).digest())
        if not hmac.compare_digest(s, expected):
            raise ValueError("bad signature")
        payload = json.loads(base64.urlsafe_b64decode(b + "=="))
        if payload.get("exp", 0) < time.time():
            raise ValueError("token expired")
        return payload
    except Exception as exc:
        raise HTTPException(status_code=401, detail=str(exc))

def _make_access(user: dict, is_paid: bool = False) -> str:
    return _sign({
        "sub":     str(user["id"]),
        "email":   user["email"],
        "name":    user.get("name") or "",
        "role":    user.get("role", "student"),
        "is_paid": is_paid,
        "type":    "access",
        "exp":     int(time.time()) + ACCESS_TTL,
    })

def _make_refresh(user: dict) -> str:
    return _sign({
        "sub":  str(user["id"]),
        "type": "refresh",
        "exp":  int(time.time()) + REFRESH_TTL,
    })

def _user_response(user: dict, is_paid: bool = False) -> dict:
    return {
        "id":      str(user["id"]),
        "name":    user.get("name") or "",
        "email":   user["email"],
        "role":    user.get("role", "student"),
        "is_paid": is_paid,
        "level":   user.get("level"),
        "streak":  user.get("streak", 0),
        "goal":    user.get("goal"),
    }

# ─── Auth Depends ─────────────────────────────────────────────────────────────
security = HTTPBearer(auto_error=False)

def current_user(creds: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    if not creds:
        raise HTTPException(status_code=401, detail="Missing token")
    payload = _verify(creds.credentials)
    token_type = payload.get("type")
    if token_type is not None and token_type != "access":
        raise HTTPException(status_code=401, detail="Invalid token type")
    return payload

def require_admin(user: dict = Depends(current_user)) -> dict:
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Yêu cầu quyền Admin.")
    return user

def require_paid(user: dict = Depends(current_user)) -> dict:
    if not user.get("is_paid"):
        raise HTTPException(status_code=403, detail="Tính năng này yêu cầu gói Pro.")
    return user

def _check_db(db: AsyncSession | None) -> None:
    if db is None:
        raise HTTPException(
            status_code=503,
            detail="Database chưa được cấu hình. Set DATABASE_URL trong .env",
        )

# ─── DB helpers — Auth ────────────────────────────────────────────────────────
# SQL fragment dùng chung để SELECT user + profile
_USER_SELECT = """
    SELECT u.id::text,
           u.email,
           u.password_hash,
           u.role,
           u.status,
           COALESCE(p.name, '')    AS name,
           p.target_level          AS level,
           p.learning_goal         AS goal
    FROM   users u
    LEFT JOIN user_profile p ON p.user_id = u.id
"""

async def _db_get_user_by_email(db: AsyncSession, email: str) -> dict | None:
    r = await db.execute(
        text(f"{_USER_SELECT} WHERE LOWER(u.email) = LOWER(:email) AND u.status != 'deleted'"),
        {"email": email},
    )
    row = r.mappings().first()
    return dict(row) if row else None

async def _db_get_user_by_id(db: AsyncSession, user_id: str) -> dict | None:
    r = await db.execute(
        text(f"{_USER_SELECT} WHERE u.id = CAST(:id AS UUID) AND u.status != 'deleted'"),
        {"id": user_id},
    )
    row = r.mappings().first()
    return dict(row) if row else None

async def _db_get_user_by_oauth(
    db: AsyncSession, provider: str, provider_uid: str
) -> dict | None:
    r = await db.execute(
        text("""
            SELECT u.id::text,
                   u.email,
                   u.password_hash,
                   u.role,
                   u.status,
                   COALESCE(p.name, '') AS name,
                   p.target_level       AS level,
                   p.learning_goal      AS goal
            FROM   oauth_account oa
            JOIN   users u ON u.id = oa.user_id
            LEFT JOIN user_profile p ON p.user_id = u.id
            WHERE  oa.provider = :provider AND oa.provider_user_id = :uid
              AND  u.status != 'deleted'
        """),
        {"provider": provider, "uid": provider_uid},
    )
    row = r.mappings().first()
    return dict(row) if row else None

async def _db_get_is_paid(db: AsyncSession, user_id: str) -> bool:
    r = await db.execute(
        text("""
            SELECT 1 FROM user_subscription
            WHERE  user_id = CAST(:uid AS UUID)
              AND  status = 'active'
              AND  (expires_at IS NULL OR expires_at > NOW())
            LIMIT  1
        """),
        {"uid": user_id},
    )
    return r.first() is not None

async def _db_create_user(
    db: AsyncSession, email: str, name: str, password_hash: str | None
) -> dict:
    r = await db.execute(
        text("""
            INSERT INTO users (email, password_hash, role, status)
            VALUES (:email, :pw_hash, 'student', 'active')
            RETURNING id::text, email, password_hash, role, status
        """),
        {"email": email, "pw_hash": password_hash},
    )
    user_row = dict(r.mappings().first())
    await db.execute(
        text("INSERT INTO user_profile (user_id, name) VALUES (CAST(:uid AS UUID), :name)"),
        {"uid": user_row["id"], "name": name},
    )
    user_row.update({"name": name, "level": None, "goal": None})
    return user_row

async def _db_link_oauth(
    db: AsyncSession, user_id: str, provider: str, provider_uid: str
) -> None:
    await db.execute(
        text("""
            INSERT INTO oauth_account (user_id, provider, provider_user_id)
            VALUES (CAST(:uid AS UUID), :provider, :puid)
            ON CONFLICT (provider, provider_user_id) DO NOTHING
        """),
        {"uid": user_id, "provider": provider, "puid": provider_uid},
    )

async def _db_update_password(db: AsyncSession, user_id: str, pw_hash: str) -> None:
    await db.execute(
        text("UPDATE users SET password_hash = :pw_hash WHERE id = CAST(:uid AS UUID)"),
        {"pw_hash": pw_hash, "uid": user_id},
    )

async def _db_create_reset_token(
    db: AsyncSession, user_id: str, token_hash: str
) -> None:
    # Hủy token cũ chưa dùng của user này (one active token per user)
    await db.execute(
        text("DELETE FROM password_reset_token WHERE user_id = CAST(:uid AS UUID) AND NOT used"),
        {"uid": user_id},
    )
    expires_at = datetime.now(timezone.utc) + timedelta(seconds=RESET_TOKEN_TTL)
    await db.execute(
        text("""
            INSERT INTO password_reset_token (user_id, token_hash, expires_at)
            VALUES (CAST(:uid AS UUID), :hash, :exp)
        """),
        {"uid": user_id, "hash": token_hash, "exp": expires_at},
    )

async def _db_get_reset_token(db: AsyncSession, token_hash: str) -> dict | None:
    r = await db.execute(
        text("""
            SELECT prt.id::text     AS token_id,
                   prt.user_id::text,
                   prt.expires_at,
                   prt.used,
                   u.email
            FROM   password_reset_token prt
            JOIN   users u ON u.id = prt.user_id
            WHERE  prt.token_hash = :hash AND NOT prt.used
        """),
        {"hash": token_hash},
    )
    row = r.mappings().first()
    return dict(row) if row else None

async def _db_use_reset_token(db: AsyncSession, token_id: str) -> None:
    await db.execute(
        text("UPDATE password_reset_token SET used = TRUE WHERE id = CAST(:id AS UUID)"),
        {"id": token_id},
    )

# ─── Google token verify ──────────────────────────────────────────────────────
def _verify_google_id_token(token: str) -> dict:
    if not GOOGLE_CLIENT_ID:
        raise RuntimeError("GOOGLE_CLIENT_ID not set in .env")
    try:
        return google_id_token.verify_oauth2_token(
            token, google_requests.Request(), GOOGLE_CLIENT_ID,
        )
    except ValueError:
        raise HTTPException(status_code=400, detail="id_token không hợp lệ hoặc hết hạn.")
    except Exception as exc:
        log.error("Google token verify error: %s", type(exc).__name__)
        raise HTTPException(status_code=502, detail="Lỗi xác thực với Google.")

# ─── Input validation helpers ─────────────────────────────────────────────────
def _validate_email(email: str) -> bool:
    return bool(_re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", email))

def _validate_password(pw: str) -> bool:
    return len(pw) >= 8 and any(c.isdigit() for c in pw)

# ─── Pydantic schemas ─────────────────────────────────────────────────────────
class TopicData(BaseModel):
    label:         str
    words:         list[str] | None = None
    grammarTopics: list[str] | None = None

class HistoryMessage(BaseModel):
    role:    str   # "user" | "assistant"
    content: str

class SpeakRequest(BaseModel):
    text:    str
    context: str | None           = None
    topic:   TopicData | None     = None
    history: list[HistoryMessage] = []

class TTSRequest(BaseModel):
    text: str

class LoginRequest(BaseModel):
    email:    str
    password: str

class RegisterRequest(BaseModel):
    name:     str
    email:    str
    password: str

class RefreshRequest(BaseModel):
    refresh_token: str

class GoogleAuthRequest(BaseModel):
    id_token: str

class ForgotPasswordRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    token:        str
    new_password: str

# ─── TTS helper ───────────────────────────────────────────────────────────────
def text_to_audio_bytes(text_: str) -> bytes:
    client = get_elevenlabs_client()
    audio_chunks = client.text_to_speech.convert(
        voice_id=ELEVENLABS_VOICE_ID,
        text=text_,
        model_id="eleven_multilingual_v2",
        output_format="mp3_44100_128",
    )
    return b"".join(audio_chunks)

# ─── Claude helper ────────────────────────────────────────────────────────────
_PROMPT_BASE = """You are SpeakBuddi AI — a friendly English speaking coach.

Rules:
- Always reply in English only.
- Keep it SHORT: 2-3 sentences max — this is a voice conversation.
- End with a short question to keep the conversation going.
- Natural, friendly tone.
- If the user makes a grammar mistake, gently correct it once.
- NO markdown, bullet points, or special characters — plain prose only."""

def _build_system_prompt(topic: TopicData | None, context: str | None) -> str:
    if context and context.startswith("GREETING_MODE:"):
        vocab   = ", ".join(topic.words[:6])         if topic and topic.words         else ""
        label   = topic.label if topic else "bài học này"
        return f"""You are SpeakBuddi AI — a friendly English speaking coach.

Your task: Generate an OPENING GREETING for the lesson "{label}".

The greeting should:
1. Welcome the user and introduce the topic "{label}" (1 sentence).
2. Mention 2-3 key words to practice: {vocab if vocab else "related vocabulary"}.
3. Ask an opening question to start the conversation (1 sentence).

Rules: English only, NO markdown, max 4 sentences, natural tone."""

    if topic:
        vocab   = ", ".join(topic.words[:8])     if topic.words         else ""
        grammar = ", ".join(topic.grammarTopics) if topic.grammarTopics else ""
        extra   = f"""

Bài học đang luyện: "{topic.label}"
{f"Từ vựng cần dùng trong hội thoại: {vocab}" if vocab else ""}
{f"Ngữ pháp cần luyện tập: {grammar}" if grammar else ""}

Nhiệm vụ: tự nhiên lồng ghép các từ vựng và cấu trúc ngữ pháp trên vào câu hỏi để người học thực hành."""
        return _PROMPT_BASE + extra

    if context:
        return _PROMPT_BASE + f'\n\nChủ đề tự do người dùng chọn: "{context}". Hãy dẫn dắt hội thoại xung quanh chủ đề này.'

    return _PROMPT_BASE

def _trim_history(history: list[HistoryMessage]) -> list[HistoryMessage]:
    max_msgs = MAX_HISTORY_TURNS * 2
    trimmed  = history[-max_msgs:] if len(history) > max_msgs else history
    if trimmed and trimmed[0].role == "assistant":
        trimmed = trimmed[1:]
    return trimmed

def get_ai_reply(
    user_text: str,
    context:   str | None,
    topic:     TopicData | None,
    history:   list[HistoryMessage],
) -> str:
    client          = get_claude_client()
    system_msg      = _build_system_prompt(topic, context)
    trimmed_history = _trim_history(history)
    messages = [
        {"role": msg.role, "content": msg.content}
        for msg in trimmed_history
    ] + [{"role": "user", "content": user_text}]

    log.info("HISTORY  %d messages sent to Claude", len(messages))
    message = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=200,
        system=system_msg,
        messages=messages,
    )
    return message.content[0].text.strip()

# ─── Email helper ─────────────────────────────────────────────────────────────
def _send_reset_email(to_email: str, token: str) -> None:
    if not SMTP_USER or not SMTP_PASS:
        log.warning("RESET_EMAIL skip: SMTP chưa cấu hình — set SMTP_USER và SMTP_PASS trong .env")
        return

    reset_link = f"{FRONTEND_URL}/reset-password?token={token}"
    msg = MIMEMultipart("alternative")
    msg["Subject"] = "Đặt lại mật khẩu SpeakBuddi"
    msg["From"]    = SMTP_USER
    msg["To"]      = to_email

    html_body = f"""
<div style="font-family:'Be Vietnam Pro',Arial,sans-serif;max-width:520px;margin:auto;padding:32px;background:#fcf8ff;border-radius:12px;">
  <h2 style="color:#3525cd;margin-bottom:8px;">SpeakBuddi</h2>
  <h3 style="color:#1b1b24;">Đặt lại mật khẩu</h3>
  <p style="color:#464555;">Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.</p>
  <p style="color:#464555;">Link này có hiệu lực trong <strong>30 phút</strong>.</p>
  <a href="{reset_link}"
     style="display:inline-block;margin:16px 0;padding:12px 28px;background:#3525cd;color:#fff;border-radius:12px;text-decoration:none;font-weight:600;">
    Đặt lại mật khẩu
  </a>
  <p style="color:#777587;font-size:13px;">
    Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này.
  </p>
  <hr style="border-color:#c7c4d8;margin-top:24px;"/>
  <p style="color:#777587;font-size:12px;">© 2024 SpeakBuddi. Nâng tầm tiếng Anh của người Việt.</p>
</div>
"""
    msg.attach(MIMEText(html_body, "html", "utf-8"))
    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.ehlo()
            server.starttls()
            server.login(SMTP_USER, SMTP_PASS)
            server.sendmail(SMTP_USER, to_email, msg.as_string())
        log.info("RESET_EMAIL sent via Gmail SMTP (không log email người nhận)")
    except smtplib.SMTPAuthenticationError:
        log.error("RESET_EMAIL auth failed: kiểm tra SMTP_USER và App Password")
    except Exception as exc:
        log.error("RESET_EMAIL error: %s", type(exc).__name__)

# ─── Routes — Health / AI ─────────────────────────────────────────────────────
@app.get("/health")
def health():
    return {"status": "ok", "service": "speakbuddi-backend"}


@app.post("/speak")
async def speak(req: SpeakRequest):
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="Empty text")

    mode = f"topic:{req.topic.label}" if req.topic else f"free:{req.context}"
    log.info("SPEAK  mode=%s  text=%r  history_len=%d", mode, req.text[:80], len(req.history))

    try:
        reply_text = get_ai_reply(req.text, req.context, req.topic, req.history)
    except Exception as exc:
        log.error("Claude error: %s", exc)
        raise HTTPException(status_code=502, detail="AI service error")

    try:
        audio_bytes = text_to_audio_bytes(reply_text)
    except Exception as exc:
        log.error("TTS error: %s", exc)
        raise HTTPException(status_code=502, detail="TTS service error")

    log.info("REPLY  %r", reply_text[:120])
    return StreamingResponse(
        io.BytesIO(audio_bytes),
        media_type="audio/mpeg",
        headers={"X-Reply-Text": quote(reply_text, safe="")},
    )


@app.post("/tts")
async def tts(req: TTSRequest):
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="Empty text")
    log.info("TTS  text=%r", req.text[:80])
    try:
        audio_bytes = text_to_audio_bytes(req.text)
    except Exception as exc:
        log.error("TTS error: %s", exc)
        raise HTTPException(status_code=502, detail="TTS service error")
    return StreamingResponse(io.BytesIO(audio_bytes), media_type="audio/mpeg")


# ─── Routes — Auth ────────────────────────────────────────────────────────────
@app.post("/api/auth/register")
async def register(req: RegisterRequest, db: AsyncSession = Depends(get_db)):
    _check_db(db)
    name  = req.name.strip()
    email = req.email.strip().lower()
    pw    = req.password

    if not name or not email or not pw:
        raise HTTPException(status_code=400, detail="Vui lòng điền đầy đủ thông tin.")
    if not _validate_email(email):
        raise HTTPException(status_code=400, detail="Email không hợp lệ.")
    if not _validate_password(pw):
        raise HTTPException(status_code=400, detail="Mật khẩu phải có ít nhất 8 ký tự và 1 chữ số.")

    existing = await _db_get_user_by_email(db, email)
    if existing:
        raise HTTPException(status_code=409, detail="Email đã được sử dụng.")

    pw_hash = hashlib.sha256(pw.encode()).hexdigest()
    user    = await _db_create_user(db, email, name, pw_hash)
    log.info("REGISTER new user id=%s", user["id"])

    access_token  = _make_access(user, is_paid=False)
    refresh_token = _make_refresh(user)
    return {
        "access_token":  access_token,
        "refresh_token": refresh_token,
        "user": _user_response(user, is_paid=False),
    }


@app.post("/api/auth/login")
async def login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    _check_db(db)
    email = req.email.strip().lower() if req.email else ""
    pw    = req.password or ""
    if not email or not pw:
        raise HTTPException(status_code=400, detail="Vui lòng điền đầy đủ thông tin.")

    user    = await _db_get_user_by_email(db, email)
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

    is_paid       = await _db_get_is_paid(db, user["id"])
    access_token  = _make_access(user, is_paid)
    refresh_token = _make_refresh(user)
    log.info("LOGIN ok user=%s", user["id"])  # không log email/password/token
    return {
        "access_token":  access_token,
        "refresh_token": refresh_token,
        "user": _user_response(user, is_paid),
    }


@app.post("/api/auth/refresh")
async def refresh_token(req: RefreshRequest, db: AsyncSession = Depends(get_db)):
    _check_db(db)
    try:
        payload = _verify(req.refresh_token)
    except HTTPException:
        raise HTTPException(
            status_code=401,
            detail="Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.",
        )

    if payload.get("type") != "refresh":
        raise HTTPException(
            status_code=401,
            detail="Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.",
        )

    user = await _db_get_user_by_id(db, payload.get("sub", ""))
    if not user:
        raise HTTPException(
            status_code=401,
            detail="Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.",
        )

    is_paid    = await _db_get_is_paid(db, user["id"])
    new_access = _make_access(user, is_paid)
    log.info("REFRESH ok user=%s", user["id"])
    return {"access_token": new_access}


@app.get("/api/auth/me")
async def me(user: dict = Depends(current_user), db: AsyncSession = Depends(get_db)):
    _check_db(db)
    db_user = await _db_get_user_by_id(db, user.get("sub", ""))
    if not db_user:
        raise HTTPException(status_code=401, detail="Người dùng không tồn tại.")
    is_paid = await _db_get_is_paid(db, db_user["id"])
    return _user_response(db_user, is_paid)


@app.post("/api/auth/google")
async def google_oauth(req: GoogleAuthRequest, db: AsyncSession = Depends(get_db)):
    _check_db(db)
    google_payload = _verify_google_id_token(req.id_token)

    google_sub = google_payload["sub"]
    raw_email  = google_payload.get("email", f"{google_sub}@google.oauth")
    email      = raw_email.lower()
    name       = google_payload.get("name", email.split("@")[0])

    # 3 nhánh: login trực tiếp / link / tạo mới (AC-02-03)
    user = await _db_get_user_by_oauth(db, "google", google_sub)
    if user is None:
        existing = await _db_get_user_by_email(db, email)
        if existing:
            await _db_link_oauth(db, existing["id"], "google", google_sub)
            user = existing
        else:
            user = await _db_create_user(db, email, name, None)
            await _db_link_oauth(db, user["id"], "google", google_sub)

    if user.get("status") == "suspended":
        raise HTTPException(status_code=403, detail="Tài khoản đã bị khóa.")

    is_paid       = await _db_get_is_paid(db, user["id"])
    access_token  = _make_access(user, is_paid)
    refresh_token = _make_refresh(user)
    log.info("GOOGLE_AUTH ok user=%s", user["id"])
    return {
        "access_token":  access_token,
        "refresh_token": refresh_token,
        "user": _user_response(user, is_paid),
    }


@app.post("/api/auth/forgot-password")
async def forgot_password(req: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    _check_db(db)
    email = req.email.strip().lower() if req.email else ""
    if not email or not _validate_email(email):
        raise HTTPException(status_code=400, detail="Email không hợp lệ.")

    user = await _db_get_user_by_email(db, email)
    if user:
        raw_token  = secrets.token_urlsafe(32)
        token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
        await _db_create_reset_token(db, user["id"], token_hash)
        log.info("RESET_TOKEN created (không log email/token)")
        _send_reset_email(email, raw_token)

    # Luôn trả 200 dù email tồn tại hay không (chống user enumeration — AC-02-04)
    return {"message": "Nếu email tồn tại trong hệ thống, chúng tôi đã gửi hướng dẫn đặt lại mật khẩu."}


@app.post("/api/auth/reset-password")
async def reset_password(req: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    _check_db(db)
    raw_token = req.token.strip() if req.token else ""
    new_pw    = req.new_password or ""

    if not raw_token:
        raise HTTPException(
            status_code=400,
            detail="Yêu cầu đặt lại mật khẩu không hợp lệ hoặc đã được sử dụng.",
        )

    token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
    record     = await _db_get_reset_token(db, token_hash)
    if not record:
        raise HTTPException(
            status_code=400,
            detail="Yêu cầu đặt lại mật khẩu không hợp lệ hoặc đã được sử dụng.",
        )

    # Kiểm tra hết hạn (expires_at từ DB có timezone)
    expires_at = record["expires_at"]
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(
            status_code=400,
            detail="Yêu cầu đặt lại mật khẩu đã hết hạn. Vui lòng gửi lại yêu cầu.",
        )

    if not _validate_password(new_pw):
        raise HTTPException(
            status_code=400,
            detail="Mật khẩu phải có ít nhất 8 ký tự và 1 chữ số.",
        )

    pw_hash = hashlib.sha256(new_pw.encode()).hexdigest()
    await _db_update_password(db, record["user_id"], pw_hash)
    await _db_use_reset_token(db, record["token_id"])
    log.info("RESET_PASSWORD ok user=%s", record["user_id"])
    return {"message": "Mật khẩu đã được cập nhật thành công."}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
