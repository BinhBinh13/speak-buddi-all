# speak-buddi-be/db/connection.py
# ─── Kết nối DB cho SpeakBuddi ────────────────────────────────────────────────
#
# Cách kích hoạt:
#   1. pip install asyncpg sqlalchemy
#   2. Set DATABASE_URL=postgresql+asyncpg://user:pass@host/db trong .env
#   3. psql -U <user> -d speakbuddi -f db/schema_core.sql
#   4. (Tùy chọn) psql -U <user> -d speakbuddi -f db/seed_users.sql

import logging
import os

from dotenv import load_dotenv

load_dotenv()

log = logging.getLogger("speakbuddi.db")

DATABASE_URL: str | None = os.getenv("DATABASE_URL")

# ── Placeholder engine (dùng khi chưa cấu hình DB) ───────────────────────────

class _DummyEngine:
    """Engine giả — cho phép app khởi động mà không cần DB thật ở S1.1."""
    is_configured: bool = False

    def __repr__(self) -> str:
        return "<DummyEngine: DATABASE_URL not set — activate in S1.8>"


from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

if not DATABASE_URL:
    log.warning("DATABASE_URL chưa được set — dùng DummyEngine (chỉ chấp nhận ở môi trường dev/test).")
    engine: object = _DummyEngine()
else:
    engine = create_async_engine(
        DATABASE_URL,
        echo=False,       # đổi thành True để log SQL khi debug
        pool_size=5,
        max_overflow=10,
    )
    log.info("DB engine khởi tạo thành công → %s", DATABASE_URL.split("@")[-1])

_AsyncSessionLocal = sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
) if DATABASE_URL else None


async def get_db() -> AsyncSession:
    """FastAPI Depends — yield session, rollback on error, close after."""
    if _AsyncSessionLocal is None:
        log.error("get_db() gọi nhưng DATABASE_URL chưa set.")
        yield None
        return
    async with _AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
