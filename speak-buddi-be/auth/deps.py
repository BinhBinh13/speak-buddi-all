# speak-buddi-be/auth/deps.py
# ─── Auth dependency cho FastAPI Depends ──────────────────────────────────────
#
# Di chuyển từ main.py sang đây (BE-1 trong S3.2) để tách biệt auth logic
# khỏi route definitions.
#
# Cung cấp:
#   - _b64url(data: bytes) → str
#   - _verify(token: str) → dict     (raise 401 nếu sai / hết hạn)
#   - current_user(creds)  → dict    (FastAPI Depends)
#
# Không chứa _make_access/_make_refresh (chỉ dùng ở auth routes trong main.py).
# ─────────────────────────────────────────────────────────────────────────────

import os
import json
import time
import base64
import hashlib
import hmac

from dotenv import load_dotenv
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

load_dotenv()

JWT_SECRET: str = os.getenv("JWT_SECRET", "speakbuddi-secret-change-in-prod")

security = HTTPBearer(auto_error=False)


def _b64url(data: bytes) -> str:
    """Base64URL encode (no padding) — dùng cho JWT header/body/sig."""
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()


def _verify(token: str) -> dict:
    """
    Xác thực JWT HS256 tự ký và trả payload nếu hợp lệ.
    Raise HTTPException 401 nếu sai signature hoặc hết hạn.
    """
    try:
        h, b, s = token.split(".")
        expected = _b64url(
            hmac.new(
                JWT_SECRET.encode(),
                f"{h}.{b}".encode(),
                hashlib.sha256,
            ).digest()
        )
        if not hmac.compare_digest(s, expected):
            raise ValueError("bad signature")
        payload = json.loads(base64.urlsafe_b64decode(b + "=="))
        if payload.get("exp", 0) < time.time():
            raise ValueError("token expired")
        return payload
    except Exception as exc:
        raise HTTPException(status_code=401, detail=str(exc))


def current_user(
    creds: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    """
    FastAPI Depends — trả dict payload của access token hợp lệ.
    Chỉ chấp nhận token type='access' (hoặc legacy không có type).
    """
    if not creds:
        raise HTTPException(status_code=401, detail="Missing token")
    payload = _verify(creds.credentials)
    token_type = payload.get("type")
    if token_type is not None and token_type != "access":
        raise HTTPException(status_code=401, detail="Invalid token type")
    return payload
