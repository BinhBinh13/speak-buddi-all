import asyncio
from sqlalchemy import text
from db.connection import engine

async def main():
    async with engine.connect() as conn:
        result = await conn.execute(text("SELECT * FROM payment_plan"))
        for row in result.fetchall():
            print(dict(row._mapping))

asyncio.run(main())