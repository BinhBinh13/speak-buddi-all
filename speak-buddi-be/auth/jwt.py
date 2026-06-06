import base64
import hashlib
import hmac
import json
import time

from fastapi import HTTPException

from core.config import ACCESS_TTL, JWT_SECRET, REFRESH_TTL


def _b64url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()


def _sign(payload: dict) -> str:
    header = _b64url(b'{"alg":"HS256","typ":"JWT"}')
    body   = _b64url(json.dumps(payload).encode())
    sig    = _b64url(hmac.new(JWT_SECRET.encode(), f"{header}.{body}".encode(), hashlib.sha256).digest())
    return f"{header}.{body}.{sig}"


def verify_token(token: str) -> dict:
    """Xác thực JWT HS256 tự ký — raise 401 nếu sai signature hoặc hết hạn."""
    try:
        h, b, s = token.split(".")
        expected = _b64url(
            hmac.new(JWT_SECRET.encode(), f"{h}.{b}".encode(), hashlib.sha256).digest()
        )
        if not hmac.compare_digest(s, expected):
            raise ValueError("bad signature")
        payload = json.loads(base64.urlsafe_b64decode(b + "=="))
        if payload.get("exp", 0) < time.time():
            raise ValueError("token expired")
        return payload
    except Exception as exc:
        raise HTTPException(status_code=401, detail=str(exc))


def make_access_token(user: dict, is_paid: bool = False) -> str:
    return _sign({
        "sub":     str(user["id"]),
        "email":   user["email"],
        "name":    user.get("name") or "",
        "role":    user.get("role", "student"),
        "is_paid": is_paid,
        "type":    "access",
        "exp":     int(time.time()) + ACCESS_TTL,
    })


def make_refresh_token(user: dict) -> str:
    return _sign({
        "sub":  str(user["id"]),
        "type": "refresh",
        "exp":  int(time.time()) + REFRESH_TTL,
    })
