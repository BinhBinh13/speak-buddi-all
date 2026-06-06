# speak-buddi-be/db/connection.py
# ─── Kết nối DB nền cho SpeakBuddi (S1.1) ────────────────────────────────────
#
# Phạm vi S1.1:
#   - Đọc DATABASE_URL từ .env, tạo SQLAlchemy engine (async, PostgreSQL).
#   - Cung cấp get_db() Depends để routes sau này dùng (S1.8+).
#   - Auth vẫn dùng MOCK_USERS trong main.py; chưa nối DB thật (TODO: S1.8).
#
# Để ACTIVATE:
#   1. Cài driver: pip install asyncpg sqlalchemy
#   2. Set DATABASE_URL=postgresql+asyncpg://user:pass@host/db trong .env
#   3. Chạy schema: psql -U user -d speakbuddi -f db/schema_core.sql
#   4. Bỏ comment phần engine/session bên dưới và xoá DummyEngine placeholder.

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


engine: _DummyEngine | object = _DummyEngine()

# ── Kết nối thật (SQLAlchemy async) — bỏ comment khi S1.8+ sẵn sàng ──────────

# from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
# from sqlalchemy.orm import sessionmaker

# if not DATABASE_URL:
#     raise RuntimeError("DATABASE_URL chưa được set. Xem .env.example.")

# engine = create_async_engine(
#     DATABASE_URL,
#     echo=False,          # True để log SQL khi debug
#     pool_size=5,
#     max_overflow=10,
# )

# _AsyncSessionLocal = sessionmaker(
#     engine,
#     class_=AsyncSession,
#     expire_on_commit=False,
# )

# async def get_db() -> AsyncSession:
#     """FastAPI Depends — yield session, rollback on error, close after."""
#     async with _AsyncSessionLocal() as session:
#         try:
#             yield session
#             await session.commit()
#         except Exception:
#             await session.rollback()
#             raise
#         finally:
#             await session.close()

# ── Stub get_db (dùng cho S1.1 chưa có DB thật) ──────────────────────────────

async def get_db():  # type: ignore[return]
    """
    Stub Depends — trả về None đến khi DATABASE_URL được cấu hình (S1.8+).
    Không dùng trong production; thay bằng phiên bản async thật ở trên.
    """
    if DATABASE_URL:
        log.warning(
            "get_db() stub được gọi dù DATABASE_URL đã set — "
            "bỏ comment phần SQLAlchemy trong db/connection.py (TODO: S1.8)."
        )
    yield None
