# speak-buddi-be/services/langeek_mapping.py
# ─── Map JSON scrape → normalized batch (S9.3) ───────────────────────────────

from __future__ import annotations

import re
import unicodedata
from dataclasses import dataclass, field
from typing import Any


VALID_LEVELS = {"A1", "A2", "B1", "B2", "C1", "C2"}


@dataclass
class CrawledWord:
    word: str
    phonetic: str | None
    meaning_vi: str
    meaning_en: str | None
    example_sentence: str | None
    display_order: int


@dataclass
class CrawledTopic:
    level_code: str
    name: str
    slug: str
    description: str | None
    display_order: int
    words: list[CrawledWord] = field(default_factory=list)


@dataclass
class CrawledBatch:
    source_url: str
    topics: list[CrawledTopic] = field(default_factory=list)


def slugify(text: str, prefix: str = "") -> str:
    """Sinh slug ổn định từ tên topic."""
    normalized = unicodedata.normalize("NFKD", text)
    ascii_text = normalized.encode("ascii", "ignore").decode("ascii")
    slug = re.sub(r"[^a-z0-9]+", "-", ascii_text.lower()).strip("-")
    if prefix:
        slug = f"{prefix}-{slug}" if slug else prefix
    return slug or "topic"


def parse_scrape_payload(payload: dict[str, Any], *, level_filter: str | None = None) -> CrawledBatch:
    """
    Parse JSON từ scraper hoặc fixture.
    Cấu trúc: { source_url, levels: [{ code, topics: [{ name, slug, words: [...] }] }] }
    """
    batch = CrawledBatch(source_url=payload.get("source_url", ""))
    levels = payload.get("levels") or []

    for level_block in levels:
        code = str(level_block.get("code", "")).upper()
        if code not in VALID_LEVELS:
            continue
        if level_filter and code != level_filter.upper():
            continue

        for topic_data in level_block.get("topics") or []:
            name = (topic_data.get("name") or "").strip()
            if not name:
                continue
            slug = (topic_data.get("slug") or "").strip()
            if not slug:
                slug = slugify(name, prefix=f"langeek-{code.lower()}")

            words: list[CrawledWord] = []
            for idx, w in enumerate(topic_data.get("words") or [], start=1):
                word = (w.get("word") or "").strip()
                meaning_vi = (w.get("meaning_vi") or "").strip()
                if not word or not meaning_vi:
                    continue
                words.append(
                    CrawledWord(
                        word=word,
                        phonetic=(w.get("phonetic") or None),
                        meaning_vi=meaning_vi,
                        meaning_en=(w.get("meaning_en") or None),
                        example_sentence=(w.get("example_sentence") or None),
                        display_order=int(w.get("display_order") or idx),
                    )
                )

            batch.topics.append(
                CrawledTopic(
                    level_code=code,
                    name=name,
                    slug=slug,
                    description=(topic_data.get("description") or None),
                    display_order=int(topic_data.get("display_order") or 0),
                    words=words,
                )
            )

    return batch


def batch_to_preview(batch: CrawledBatch, limit: int = 5) -> dict[str, Any]:
    """Preview JSON nhỏ gọn cho Admin UI."""
    sample = []
    for topic in batch.topics[:limit]:
        sample.append(
            {
                "level": topic.level_code,
                "topic": topic.name,
                "slug": topic.slug,
                "word_count": len(topic.words),
                "words": [
                    {
                        "word": w.word,
                        "meaning_vi": w.meaning_vi,
                        "cefr": topic.level_code,
                    }
                    for w in topic.words[:3]
                ],
            }
        )
    return {
        "source_url": batch.source_url,
        "topic_count": len(batch.topics),
        "word_count": sum(len(t.words) for t in batch.topics),
        "sample": sample,
    }
