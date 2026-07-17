# speak-buddi-be/middleware/activity.py
# ─── Theo dõi last_active_at cho mọi request có Bearer token hợp lệ ──────────
# Bổ sung cho touch_last_active() gọi trực tiếp ở login/Google OAuth (không có
# Bearer token lúc đó) — middleware này bắt các request sau đó (mọi route dùng
# current_user), làm mốc cho email nhắc quay lại sau N ngày không hoạt động.
#
# Cache trong RAM (user_id -> lần touch gần nhất) để KHÔNG mở DB session ở mọi
# request — chỉ hit DB tối đa 1 lần/giờ/user, khớp với throttle trong
# user_repo.touch_last_active(). Thiếu cache này, tải đồng thời cao sẽ làm cạn
# connection pool (đã đo thực tế: 25 request đồng thời → timeout QueuePool)
# vì mỗi request tốn thêm 1 session DB ngoài session của route handler.

import logging
import time

from fastapi import Request

from auth.jwt import verify_token
from db.connection import async_session_factory
from repositories import user_repo

log = logging.getLogger("speakbuddi.activity")

_TOUCH_THROTTLE_SECONDS = 3600  # khớp INTERVAL '1 hour' trong touch_last_active()
_last_touch_cache: dict[str, float] = {}


async def track_last_active(request: Request, call_next):
    response = await call_next(request)

    auth_header = request.headers.get("authorization", "")
    if auth_header.lower().startswith("bearer "):
        try:
            payload = verify_token(auth_header[7:])
            user_id = payload.get("sub")
            if user_id and payload.get("type") == "access":
                now = time.monotonic()
                last = _last_touch_cache.get(user_id)
                if last is None or now - last >= _TOUCH_THROTTLE_SECONDS:
                    async with async_session_factory() as db:
                        await user_repo.touch_last_active(db, user_id)
                        await db.commit()
                    _last_touch_cache[user_id] = now
        except Exception:
            pass  # token hết hạn/sai — không ảnh hưởng response đã trả

    return response
