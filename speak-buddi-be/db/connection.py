# speak-buddi-be/db/connection.py
# ─── Kết nối DB nền cho SpeakBuddi (S1.1 scaffold → Activated S3.1) ──────────
#
# Phạm vi:
#   - Đọc DATABASE_URL từ .env, tạo SQLAlchemy async engine (PostgreSQL/asyncpg).
#   - Cung cấp get_db() Depends để routes dùng (S3.2+, S9.1+).
#   - Raise RuntimeError ngay khi khởi động nếu DATABASE_URL chưa set.
#
# Yêu cầu:
#   pip install asyncpg sqlalchemy
#   Set DATABASE_URL=postgresql+asyncpg://user:pass@host/db trong .env
#   Chạy schema: psql -U user -d speakbuddi -f db/schema_core.sql

import logging
import os
from collections.abc import AsyncGenerator

from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

load_dotenv()

log = logging.getLogger("speakbuddi.db")

DATABASE_URL: str | None = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    log.warning(
        "DATABASE_URL chưa được set trong .env — "
        "Ứng dụng sẽ không kết nối được với PostgreSQL."
    )
    raise RuntimeError(
        "DATABASE_URL chưa được set. "
        "Vui lòng thêm DATABASE_URL=postgresql+asyncpg://... vào file .env"
    )

engine = create_async_engine(
    DATABASE_URL,
    echo=False,       # đặt True để log SQL khi debug
    pool_size=5,
    max_overflow=10,
)

_AsyncSessionLocal: sessionmaker = sessionmaker(  # type: ignore[call-overload]
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

# Alias cho background jobs (S9.3 crawler scheduler)
async_session_factory = _AsyncSessionLocal


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI Depends — yield AsyncSession, commit khi thành công, rollback khi lỗi."""
    async with _AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
