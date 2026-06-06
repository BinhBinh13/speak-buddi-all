import logging

from fastapi import HTTPException
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token as google_id_token

from core.config import GOOGLE_CLIENT_ID

log = logging.getLogger("speakbuddi.google")


def verify_google_id_token(id_token: str) -> dict:
    """Xác thực Google id_token — raise 400/502 nếu lỗi."""
    if not GOOGLE_CLIENT_ID:
        raise RuntimeError("GOOGLE_CLIENT_ID not set in .env")
    try:
        return google_id_token.verify_oauth2_token(
            id_token, google_requests.Request(), GOOGLE_CLIENT_ID,
        )
    except ValueError:
        raise HTTPException(status_code=400, detail="id_token không hợp lệ hoặc hết hạn.")
    except Exception as exc:
        log.error("Google token verify error: %s", type(exc).__name__)
        raise HTTPException(status_code=502, detail="Lỗi xác thực với Google.")
