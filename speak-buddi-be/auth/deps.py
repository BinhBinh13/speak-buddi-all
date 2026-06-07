from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from auth.jwt import verify_token

security = HTTPBearer(auto_error=False)


def current_user(
    creds: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    """FastAPI Depends — trả payload của access token hợp lệ."""
    if not creds:
        raise HTTPException(status_code=401, detail="Missing token")
    payload = verify_token(creds.credentials)
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


def optional_current_user(
    creds: HTTPAuthorizationCredentials = Depends(security),
) -> dict | None:
    """Trả payload JWT nếu có token hợp lệ; None nếu không gửi hoặc token sai."""
    if not creds:
        return None
    try:
        payload = verify_token(creds.credentials)
        token_type = payload.get("type")
        if token_type is not None and token_type != "access":
            return None
        return payload
    except HTTPException:
        return None
