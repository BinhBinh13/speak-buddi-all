"""
migrate_and_seed_phonetics.py
1. Migrate topic + topic_word từ local → remote
2. Seed IPA phonetic cho tất cả từ thiếu phonetic (dùng eng_to_ipa offline)

Chạy: python scripts/migrate_and_seed_phonetics.py
"""

import asyncio
import asyncpg
import sys
import eng_to_ipa as ipa

LOCAL  = "postgresql://postgres:postgres@localhost:5432/speakbuddi"
REMOTE = "postgresql://postgres:sa123@103.146.23.106:5432/speakbuddi"

BATCH = 500  # rows per insert batch


def log(msg: str):
    sys.stdout.buffer.write((msg + "\n").encode("utf-8"))
    sys.stdout.flush()


# ─── STEP 1: Migrate ──────────────────────────────────────────────────────────

async def migrate(local, remote):
    log("\n══════════════════════════════════════")
    log("STEP 1 — Migrate topic + topic_word")
    log("══════════════════════════════════════")

    # Build level_id mapping: code → remote uuid
    remote_levels = await remote.fetch("SELECT id, code FROM level")
    local_levels  = await local.fetch("SELECT id, code FROM level")
    local_code  = {r["id"]: r["code"] for r in local_levels}
    remote_uuid = {r["code"]: r["id"] for r in remote_levels}
    level_map   = {lid: remote_uuid[local_code[lid]] for lid in local_code}
    log(f"Level mapping built: {len(level_map)} levels")

    # ── Topics ────────────────────────────────────────────────────────────────
    topics = await local.fetch(
        "SELECT id, level_id, name, slug, description, display_order, "
        "       difficulty, source, is_active, admin_locked "
        "FROM topic ORDER BY display_order"
    )
    log(f"Topics to migrate: {len(topics)}")

    existing_slugs = {r["slug"] for r in await remote.fetch("SELECT slug FROM topic")}
    new_topics = [t for t in topics if t["slug"] not in existing_slugs]
    log(f"  Already in remote: {len(topics) - len(new_topics)} | New: {len(new_topics)}")

    if new_topics:
        await remote.executemany(
            """INSERT INTO topic
               (id, level_id, name, slug, description, display_order,
                difficulty, source, is_active, admin_locked)
               VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
               ON CONFLICT (slug) DO NOTHING""",
            [
                (
                    t["id"],
                    level_map.get(t["level_id"]) if t["level_id"] else None,
                    t["name"], t["slug"], t["description"],
                    t["display_order"], t["difficulty"],
                    t["source"], t["is_active"], t["admin_locked"],
                )
                for t in new_topics
            ],
        )
        log(f"  ✓ Inserted {len(new_topics)} topics")

    # Build topic_id set in remote (all valid)
    remote_topic_ids = {r["id"] for r in await remote.fetch("SELECT id FROM topic")}

    # ── topic_word ─────────────────────────────────────────────────────────────
    words = await local.fetch(
        "SELECT id, topic_id, level_id, word, phonetic, meaning_vi, meaning_en, "
        "       example_sentence, grammar_note, audio_url, source, "
        "       display_order, is_active, admin_locked "
        "FROM topic_word ORDER BY topic_id, display_order"
    )
    log(f"\ntopic_word to migrate: {len(words)}")

    # Check existing words in remote
    existing_word_ids = {r["id"] for r in await remote.fetch("SELECT id FROM topic_word")}
    new_words = [w for w in words if w["id"] not in existing_word_ids
                 and w["topic_id"] in remote_topic_ids]
    log(f"  Already in remote: {len(existing_word_ids)} | New: {len(new_words)}")

    inserted = 0
    for i in range(0, len(new_words), BATCH):
        batch = new_words[i:i + BATCH]
        await remote.executemany(
            """INSERT INTO topic_word
               (id, topic_id, level_id, word, phonetic, meaning_vi, meaning_en,
                example_sentence, grammar_note, audio_url, source,
                display_order, is_active, admin_locked)
               VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
               ON CONFLICT (topic_id, word) DO NOTHING""",
            [
                (
                    w["id"],
                    w["topic_id"],
                    level_map.get(w["level_id"]) if w["level_id"] else None,
                    w["word"], w["phonetic"],
                    w["meaning_vi"], w["meaning_en"],
                    w["example_sentence"], w["grammar_note"],
                    w["audio_url"], w["source"],
                    w["display_order"], w["is_active"], w["admin_locked"],
                )
                for w in batch
            ],
        )
        inserted += len(batch)
        log(f"  Batch {i//BATCH + 1}: inserted {inserted}/{len(new_words)}")

    log(f"✓ topic_word migration done: {inserted} rows")


# ─── STEP 2: Seed phonetics ───────────────────────────────────────────────────

async def seed_phonetics(remote):
    log("\n══════════════════════════════════════")
    log("STEP 2 — Seed IPA phonetics (eng_to_ipa)")
    log("══════════════════════════════════════")

    rows = await remote.fetch(
        "SELECT id, word FROM topic_word "
        "WHERE phonetic IS NULL OR phonetic = '' "
        "ORDER BY word"
    )
    total = len(rows)
    log(f"Words missing phonetic: {total}")

    if total == 0:
        log("Nothing to do!")
        return

    updated = 0
    not_found = 0
    update_pairs = []

    for row in rows:
        word = row["word"]
        # eng_to_ipa converts multi-word phrases too
        result = ipa.convert(word)

        # '*' in result means word not found in CMU dict
        if "*" not in result and result.strip():
            # Wrap in slashes for IPA format
            phonetic = f"/{result}/"
            update_pairs.append((row["id"], phonetic))
            updated += 1
        else:
            # Try first word only for phrases
            first = word.split()[0] if " " in word else None
            if first:
                r2 = ipa.convert(first)
                if "*" not in r2 and r2.strip():
                    update_pairs.append((row["id"], f"/{r2}/"))
                    updated += 1
                    continue
            not_found += 1

    log(f"  Found IPA for : {updated}")
    log(f"  Not found     : {not_found}")

    # Bulk update in batches
    for i in range(0, len(update_pairs), BATCH):
        batch = update_pairs[i:i + BATCH]
        await remote.executemany(
            "UPDATE topic_word SET phonetic = $2, updated_at = NOW() WHERE id = $1",
            batch,
        )
        log(f"  Updated batch {i//BATCH + 1}: {min(i + BATCH, len(update_pairs))}/{len(update_pairs)}")

    log(f"✓ Phonetic seed done: {updated} words updated")


# ─── Main ─────────────────────────────────────────────────────────────────────

async def main():
    log("Connecting...")
    local  = await asyncpg.connect(LOCAL)
    remote = await asyncpg.connect(REMOTE)
    log("Connected to both DBs.")

    try:
        await migrate(local, remote)
        await seed_phonetics(remote)

        # Final stats
        log("\n══════════════════════════════════════")
        log("FINAL STATS (remote)")
        log("══════════════════════════════════════")
        total   = await remote.fetchval("SELECT COUNT(*) FROM topic_word")
        with_ph = await remote.fetchval(
            "SELECT COUNT(*) FROM topic_word WHERE phonetic IS NOT NULL AND phonetic != ''"
        )
        without = total - with_ph
        log(f"  Total words     : {total}")
        log(f"  With phonetic   : {with_ph}")
        log(f"  Without phonetic: {without}")

    finally:
        await local.close()
        await remote.close()
        log("\nDone.")


if __name__ == "__main__":
    asyncio.run(main())
