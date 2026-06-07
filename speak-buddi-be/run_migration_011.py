"""One-off runner for migration 011 — conversation_transcript table."""
import asyncio
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()


async def main() -> None:
    import os

    import asyncpg

    db_url = os.getenv("DATABASE_URL", "").replace("postgresql+asyncpg://", "postgresql://")
    if not db_url:
        raise SystemExit("DATABASE_URL not set in .env")

    sql = Path(__file__).parent.joinpath("db/migrations/011_conversation_transcript.sql").read_text(
        encoding="utf-8"
    )
    conn = await asyncpg.connect(db_url)
    try:
        await conn.execute(sql)
        exists = await conn.fetchval(
            "SELECT to_regclass('public.conversation_transcript')"
        )
        print(f"Migration 011 OK — conversation_transcript = {exists}")
    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(main())
