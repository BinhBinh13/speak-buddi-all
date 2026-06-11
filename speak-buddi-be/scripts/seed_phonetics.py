"""
seed_phonetics.py — Tự động fetch IPA phonetic từ Free Dictionary API
và cập nhật vào bảng topic_word trong PostgreSQL.

Chạy: python scripts/seed_phonetics.py
Env:  DATABASE_URL (mặc định localhost)

API:  https://api.dictionaryapi.dev/api/v2/entries/en/<word>
Rate: ~0.3s delay giữa các request để tránh bị block
"""

import asyncio
import asyncpg
import aiohttp
import json
import sys
import time
from pathlib import Path

DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/speakbuddi"
API_BASE = "https://api.dictionaryapi.dev/api/v2/entries/en"
BATCH_SIZE = 50
DELAY_BETWEEN_REQUESTS = 0.3  # seconds
DELAY_BETWEEN_BATCHES = 2.0   # seconds

# Cache file để không fetch lại nếu script bị gián đoạn
CACHE_FILE = Path(__file__).parent / "phonetic_cache.json"


def load_cache():
    if CACHE_FILE.exists():
        with open(CACHE_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}


def save_cache(cache):
    with open(CACHE_FILE, "w", encoding="utf-8") as f:
        json.dump(cache, f, ensure_ascii=False, indent=2)


async def fetch_phonetic(session: aiohttp.ClientSession, word: str, cache: dict) -> str | None:
    """
    Fetch IPA phonetic cho một từ.
    Trả về chuỗi IPA (vd: '/həˈloʊ/') hoặc None nếu không tìm thấy.
    """
    if word in cache:
        return cache[word]

    # Multi-word phrases (vd: "good morning") — thử lookup từ đầu tiên
    lookup_word = word.split()[0] if " " in word else word

    try:
        url = f"{API_BASE}/{lookup_word.lower()}"
        async with session.get(url, timeout=aiohttp.ClientTimeout(total=10)) as resp:
            if resp.status == 200:
                data = await resp.json()
                # Lấy phonetic đầu tiên tìm thấy
                phonetic = None
                for entry in data:
                    # Ưu tiên phonetics array có text
                    for ph in entry.get("phonetics", []):
                        if ph.get("text"):
                            phonetic = ph["text"]
                            break
                    if phonetic:
                        break
                    # Fallback: phonetic field trực tiếp
                    if entry.get("phonetic"):
                        phonetic = entry["phonetic"]
                        break

                cache[word] = phonetic
                return phonetic
            else:
                cache[word] = None
                return None
    except Exception:
        return None  # Không cache lỗi network để retry sau


async def main():
    print("=" * 60)
    print("Seed IPA Phonetics for topic_word")
    print("=" * 60)

    # Load cache
    cache = load_cache()
    print(f"Cache loaded: {len(cache)} entries")

    # Connect DB
    conn = await asyncpg.connect(DATABASE_URL)
    print(f"Connected to DB: {DATABASE_URL}\n")

    # Lấy tất cả từ thiếu phonetic
    rows = await conn.fetch(
        "SELECT id, word FROM topic_word WHERE phonetic IS NULL OR phonetic = '' ORDER BY word"
    )
    total = len(rows)
    print(f"Words missing phonetic: {total}")

    if total == 0:
        print("Nothing to do!")
        await conn.close()
        return

    # Thống kê từ đã có trong cache
    cached_count = sum(1 for r in rows if r["word"] in cache)
    print(f"Already cached: {cached_count}")
    print(f"Need API fetch: {total - cached_count}")
    print()

    updated = 0
    not_found = 0
    errors = 0

    async with aiohttp.ClientSession() as session:
        for batch_start in range(0, total, BATCH_SIZE):
            batch = rows[batch_start : batch_start + BATCH_SIZE]
            batch_num = batch_start // BATCH_SIZE + 1
            total_batches = (total + BATCH_SIZE - 1) // BATCH_SIZE

            print(f"Batch {batch_num}/{total_batches} ({batch_start+1}–{min(batch_start+BATCH_SIZE, total)}/{total})")

            updates = []  # (id, phonetic)

            for row in batch:
                word = row["word"]
                phonetic = await fetch_phonetic(session, word, cache)

                if phonetic:
                    updates.append((row["id"], phonetic))
                    updated += 1
                else:
                    not_found += 1

                # Rate limiting
                await asyncio.sleep(DELAY_BETWEEN_REQUESTS)

            # Bulk update trong batch
            if updates:
                await conn.executemany(
                    "UPDATE topic_word SET phonetic = $2, updated_at = NOW() WHERE id = $1",
                    updates,
                )
                print(f"  ✓ Updated {len(updates)} words")

            # Save cache sau mỗi batch
            save_cache(cache)

            # Delay giữa batches
            if batch_start + BATCH_SIZE < total:
                await asyncio.sleep(DELAY_BETWEEN_BATCHES)

    await conn.close()

    print()
    print("=" * 60)
    print(f"DONE")
    print(f"  Updated with phonetic : {updated}")
    print(f"  Not found in API      : {not_found}")
    print(f"  Errors                : {errors}")
    print(f"  Cache saved to        : {CACHE_FILE}")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(main())
