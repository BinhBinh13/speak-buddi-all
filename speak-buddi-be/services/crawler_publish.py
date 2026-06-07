# speak-buddi-be/services/crawler_publish.py

# ─── Auto-publish batch crawl vào DB (S9.3 + S9.5 admin_locked) ──────────────



from __future__ import annotations



from sqlalchemy.ext.asyncio import AsyncSession



from repositories import content_repo, crawl_repo

from services.langeek_mapping import CrawledBatch





async def publish_batch(

    db: AsyncSession,

    batch: CrawledBatch,

    job_id: str,

    *,

    dry_run: bool = False,

) -> dict:

    """

    Upsert topics/words source=langeek.

    Tôn trọng admin_locked (S9.5 — AC-13-06).

    """

    stats = {

        "topics_upserted": 0,

        "words_upserted": 0,

        "words_skipped_admin": 0,

        "words_disabled": 0,

        "topics_skipped_conflict": 0,

        "topics_skipped_locked": 0,

        "words_skipped_locked": 0,

    }



    if dry_run:

        stats["topics_upserted"] = len(batch.topics)

        stats["words_upserted"] = sum(len(t.words) for t in batch.topics)

        return stats



    for topic in batch.topics:

        level = await content_repo.get_level_by_code(db, topic.level_code)

        if not level:

            await crawl_repo.append_log(

                db,

                job_id,

                f"Level {topic.level_code} không tồn tại — bỏ qua topic {topic.slug}",

                severity="warn",

                level_code=topic.level_code,

                topic_slug=topic.slug,

            )

            continue



        upserted, skip = await content_repo.upsert_langeek_topic(

            db,

            level_id=level["id"],

            name=topic.name,

            slug=topic.slug,

            description=topic.description,

            display_order=topic.display_order,

        )

        if skip == "admin_conflict":

            stats["topics_skipped_conflict"] += 1

            await crawl_repo.append_log(

                db,

                job_id,

                f"Topic {topic.name!r} (slug {topic.slug}) trùng bản admin — bỏ qua",

                severity="warn",

                level_code=topic.level_code,

                topic_slug=topic.slug,

            )

            continue

        if skip == "admin_locked":

            stats["topics_skipped_locked"] += 1

            await crawl_repo.append_log(

                db,

                job_id,

                f"Topic {topic.slug} bị khóa bởi Admin — bỏ qua cập nhật",

                severity="info",

                level_code=topic.level_code,

                topic_slug=topic.slug,

            )

            if not upserted:

                continue

        if upserted and skip != "admin_locked":

            stats["topics_upserted"] += 1



        if not upserted:

            continue



        topic_id = upserted["id"]

        active_words: set[str] = set()



        for w in topic.words:

            word_row, word_skip = await content_repo.upsert_langeek_word(

                db,

                topic_id=topic_id,

                level_id=level["id"],

                word=w.word,

                phonetic=w.phonetic,

                meaning_vi=w.meaning_vi,

                meaning_en=w.meaning_en,

                example_sentence=w.example_sentence,

                display_order=w.display_order,

            )

            if word_skip == "admin_conflict":

                stats["words_skipped_admin"] += 1

                await crawl_repo.append_log(

                    db,

                    job_id,

                    f"Từ '{w.word}' thuộc admin trong topic {topic.slug} — bỏ qua",

                    severity="warn",

                    level_code=topic.level_code,

                    topic_slug=topic.slug,

                )

                continue

            if word_skip == "admin_locked":

                stats["words_skipped_locked"] += 1

                await crawl_repo.append_log(

                    db,

                    job_id,

                    f"Từ '{w.word}' bị khóa bởi Admin — bỏ qua cập nhật",

                    severity="info",

                    level_code=topic.level_code,

                    topic_slug=topic.slug,

                )

                continue

            if word_row:

                stats["words_upserted"] += 1

                active_words.add(w.word.lower())



        disabled = await content_repo.soft_disable_langeek_words_not_in_batch(

            db, topic_id, active_words

        )

        stats["words_disabled"] += disabled



    return stats

