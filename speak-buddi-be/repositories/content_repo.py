# speak-buddi-be/repositories/content_repo.py
# ─── Repository layer cho nhóm Content (Topic / TopicWord / Tag) — Admin S9.1 ─
#
# Phạm vi S9.1: raw SQL + text(), async, nhận AsyncSession
# Pattern: bám sát repositories/quiz_repo.py + SQL trong routers/learning.py
#
# Dùng ở:
#   S9.1 — list/create/update topic, list/create/update word, check trùng (AC-13-02)
#   S9.2 — soft delete (mở rộng thêm sau)
# ─────────────────────────────────────────────────────────────────────────────

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


# ═══════════════════════════════════════════════════════════════════════════════
# topic
# ═══════════════════════════════════════════════════════════════════════════════

async def list_topics(
    db: AsyncSession,
    search: str | None = None,
    level_id: str | None = None,
    include_inactive: bool = False,
) -> list[dict]:
    """
    Danh sách topic cho Admin (kèm word_count).
    search: lọc theo name/slug (ILIKE); level_id: lọc theo level; include_inactive:
    True → trả cả topic đã soft-delete (is_active=false), dùng cho trang quản trị.
    """
    conditions = []
    params: dict = {}

    if not include_inactive:
        conditions.append("t.is_active = TRUE")
    if search:
        conditions.append("(t.name ILIKE :search OR t.slug ILIKE :search)")
        params["search"] = f"%{search}%"
    if level_id:
        conditions.append("t.level_id = CAST(:level_id AS UUID)")
        params["level_id"] = level_id

    where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""
    sql = f"""
        SELECT t.id::text,
               t.level_id::text,
               l.code AS level_code,
               t.name,
               t.slug,
               t.description,
               t.display_order,
               t.source,
               t.is_active,
               COALESCE(t.admin_locked, FALSE) AS admin_locked,
               t.created_at,
               COUNT(tw.id) FILTER (WHERE tw.is_active = TRUE) AS word_count
        FROM   topic t
        LEFT JOIN level l ON l.id = t.level_id
        LEFT JOIN topic_word tw ON tw.topic_id = t.id
        {where_clause}
        GROUP  BY t.id, l.code
        ORDER  BY t.display_order ASC, t.name ASC
    """
    r = await db.execute(text(sql), params)
    return [dict(row) for row in r.mappings().all()]


async def get_topic_by_id(db: AsyncSession, topic_id: str) -> dict | None:
    """Lấy 1 topic theo id (kể cả is_active=false để admin sửa)."""
    r = await db.execute(
        text("""
            SELECT t.id::text,
                   t.level_id::text,
                   l.code AS level_code,
                   t.name,
                   t.slug,
                   t.description,
                   t.display_order,
                   t.source,
                   t.is_active,
                   COALESCE(t.admin_locked, FALSE) AS admin_locked,
                   t.created_at
            FROM   topic t
            LEFT JOIN level l ON l.id = t.level_id
            WHERE  t.id = CAST(:topic_id AS UUID)
        """),
        {"topic_id": topic_id},
    )
    row = r.mappings().first()
    return dict(row) if row else None


async def topic_name_exists(db: AsyncSession, name: str, exclude_id: str | None = None) -> bool:
    """Kiểm tra trùng tên topic (case-insensitive) — AC-13-02 / uq_topic_name."""
    sql = "SELECT 1 FROM topic WHERE LOWER(name) = LOWER(:name)"
    params: dict = {"name": name}
    if exclude_id:
        sql += " AND id != CAST(:exclude_id AS UUID)"
        params["exclude_id"] = exclude_id
    r = await db.execute(text(sql + " LIMIT 1"), params)
    return r.first() is not None


async def topic_slug_exists(db: AsyncSession, slug: str, exclude_id: str | None = None) -> bool:
    """Kiểm tra trùng slug topic (case-insensitive) — AC-13-02 / uq_topic_slug."""
    sql = "SELECT 1 FROM topic WHERE LOWER(slug) = LOWER(:slug)"
    params: dict = {"slug": slug}
    if exclude_id:
        sql += " AND id != CAST(:exclude_id AS UUID)"
        params["exclude_id"] = exclude_id
    r = await db.execute(text(sql + " LIMIT 1"), params)
    return r.first() is not None


async def create_topic(db: AsyncSession, data: dict) -> dict:
    """
    Tạo topic mới (Admin S9.1).
    data keys: name, slug, level_id (nullable), description (nullable), display_order
    source mặc định 'admin' (phân biệt với 'langeek' — S9.3).
    """
    r = await db.execute(
        text("""
            INSERT INTO topic
                (level_id, name, slug, description, display_order, source)
            VALUES
                (
                    CAST(:level_id AS UUID),
                    :name,
                    :slug,
                    :description,
                    :display_order,
                    'admin'
                )
            RETURNING id::text,
                      level_id::text,
                      name,
                      slug,
                      description,
                      display_order,
                      source,
                      is_active,
                      created_at
        """),
        {
            "level_id":      data.get("level_id"),
            "name":          data["name"],
            "slug":          data["slug"],
            "description":   data.get("description"),
            "display_order": data.get("display_order", 0),
        },
    )
    row = dict(r.mappings().first())
    row["level_code"] = None
    return row


async def update_topic(db: AsyncSession, topic_id: str, data: dict) -> dict | None:
    """Cập nhật topic (Admin S9.1). Trả None nếu không tìm thấy."""
    r = await db.execute(
        text("""
            UPDATE topic
            SET    level_id      = CAST(:level_id AS UUID),
                   name          = :name,
                   slug          = :slug,
                   description   = :description,
                   display_order = :display_order,
                   admin_locked  = CASE WHEN source = 'langeek' THEN TRUE ELSE admin_locked END
            WHERE  id = CAST(:topic_id AS UUID)
            RETURNING id::text,
                      level_id::text,
                      name,
                      slug,
                      description,
                      display_order,
                      source,
                      is_active,
                      COALESCE(admin_locked, FALSE) AS admin_locked,
                      created_at
        """),
        {
            "topic_id":      topic_id,
            "level_id":      data.get("level_id"),
            "name":          data["name"],
            "slug":          data["slug"],
            "description":   data.get("description"),
            "display_order": data.get("display_order", 0),
        },
    )
    row = r.mappings().first()
    if row is None:
        return None
    out = dict(row)
    out["level_code"] = None
    return out


# ═══════════════════════════════════════════════════════════════════════════════
# topic_word
# ═══════════════════════════════════════════════════════════════════════════════

async def list_words(
    db: AsyncSession,
    search: str | None = None,
    topic_id: str | None = None,
    level_id: str | None = None,
    include_inactive: bool = False,
    limit: int = 20,
    offset: int = 0,
) -> tuple[list[dict], int]:
    """
    Danh sách từ vựng cho Admin (kèm topic name + level code), có phân trang.
    Trả (rows, total_count).
    search: lọc theo word/phonetic/meaning_vi (ILIKE).
    """
    conditions = []
    params: dict = {"limit": limit, "offset": offset}

    if not include_inactive:
        conditions.append("tw.is_active = TRUE")
    if search:
        conditions.append(
            "(tw.word ILIKE :search OR tw.phonetic ILIKE :search OR tw.meaning_vi ILIKE :search)"
        )
        params["search"] = f"%{search}%"
    if topic_id:
        conditions.append("tw.topic_id = CAST(:topic_id AS UUID)")
        params["topic_id"] = topic_id
    if level_id:
        conditions.append("tw.level_id = CAST(:level_id AS UUID)")
        params["level_id"] = level_id

    where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""

    count_sql = f"SELECT COUNT(*) FROM topic_word tw {where_clause}"
    count_r = await db.execute(text(count_sql), params)
    total = count_r.scalar() or 0

    sql = f"""
        SELECT tw.id::text,
               tw.topic_id::text,
               t.name AS topic_name,
               tw.level_id::text,
               l.code AS level_code,
               tw.word,
               tw.phonetic,
               tw.meaning_vi,
               tw.meaning_en,
               tw.example_sentence,
               tw.grammar_note,
               tw.audio_url,
               tw.display_order,
               tw.source,
               tw.is_active,
               COALESCE(tw.admin_locked, FALSE) AS admin_locked,
               tw.created_by::text,
               tw.created_at
        FROM   topic_word tw
        LEFT JOIN topic t ON t.id = tw.topic_id
        LEFT JOIN level l ON l.id = tw.level_id
        {where_clause}
        ORDER  BY tw.created_at DESC
        LIMIT  :limit OFFSET :offset
    """
    r = await db.execute(text(sql), params)
    rows = [dict(row) for row in r.mappings().all()]
    return rows, total


async def get_word_by_id(db: AsyncSession, word_id: str) -> dict | None:
    """Lấy 1 từ vựng theo id kèm tag_ids — phục vụ prefill form sửa."""
    r = await db.execute(
        text("""
            SELECT tw.id::text,
                   tw.topic_id::text,
                   t.name AS topic_name,
                   tw.level_id::text,
                   l.code AS level_code,
                   tw.word,
                   tw.phonetic,
                   tw.meaning_vi,
                   tw.meaning_en,
                   tw.example_sentence,
                   tw.grammar_note,
                   tw.audio_url,
                   tw.display_order,
                   tw.source,
                   tw.is_active,
                   COALESCE(tw.admin_locked, FALSE) AS admin_locked,
                   tw.created_by::text,
                   tw.created_at
            FROM   topic_word tw
            LEFT JOIN topic t ON t.id = tw.topic_id
            LEFT JOIN level l ON l.id = tw.level_id
            WHERE  tw.id = CAST(:word_id AS UUID)
        """),
        {"word_id": word_id},
    )
    row = r.mappings().first()
    if row is None:
        return None
    word = dict(row)

    tag_r = await db.execute(
        text("SELECT tag_id::text FROM topic_word_tag WHERE topic_word_id = CAST(:wid AS UUID)"),
        {"wid": word_id},
    )
    word["tag_ids"] = [row["tag_id"] for row in tag_r.mappings().all()]
    return word


async def word_exists_in_topic(
    db: AsyncSession, topic_id: str, word: str, exclude_id: str | None = None
) -> bool:
    """Kiểm tra trùng từ trong cùng topic (case-insensitive) — AC-13-02 / UNIQUE(topic_id, word)."""
    sql = (
        "SELECT 1 FROM topic_word "
        "WHERE topic_id = CAST(:topic_id AS UUID) AND LOWER(word) = LOWER(:word)"
    )
    params: dict = {"topic_id": topic_id, "word": word}
    if exclude_id:
        sql += " AND id != CAST(:exclude_id AS UUID)"
        params["exclude_id"] = exclude_id
    r = await db.execute(text(sql + " LIMIT 1"), params)
    return r.first() is not None


async def create_word(db: AsyncSession, data: dict, created_by: str | None) -> dict:
    """
    Tạo từ vựng mới trong topic (Admin S9.1).
    data keys: topic_id, level_id?, word, phonetic?, meaning_vi, meaning_en?,
               example_sentence?, grammar_note?, audio_url?, display_order, tag_ids
    source mặc định 'admin'; created_by = sub của admin hiện tại.
    """
    r = await db.execute(
        text("""
            INSERT INTO topic_word
                (topic_id, level_id, word, phonetic, meaning_vi, meaning_en,
                 example_sentence, grammar_note, audio_url, display_order,
                 source, created_by)
            VALUES
                (
                    CAST(:topic_id AS UUID),
                    CAST(:level_id AS UUID),
                    :word, :phonetic, :meaning_vi, :meaning_en,
                    :example_sentence, :grammar_note, :audio_url, :display_order,
                    'admin', CAST(:created_by AS UUID)
                )
            RETURNING id::text,
                      topic_id::text,
                      level_id::text,
                      word, phonetic, meaning_vi, meaning_en,
                      example_sentence, grammar_note, audio_url,
                      display_order, source, is_active,
                      created_by::text, created_at
        """),
        {
            "topic_id":         data["topic_id"],
            "level_id":         data.get("level_id"),
            "word":             data["word"],
            "phonetic":         data.get("phonetic"),
            "meaning_vi":       data["meaning_vi"],
            "meaning_en":       data.get("meaning_en"),
            "example_sentence": data.get("example_sentence"),
            "grammar_note":     data.get("grammar_note"),
            "audio_url":        data.get("audio_url"),
            "display_order":    data.get("display_order", 0),
            "created_by":       created_by,
        },
    )
    word = dict(r.mappings().first())
    await _sync_word_tags(db, word["id"], data.get("tag_ids", []))
    word["tag_ids"] = data.get("tag_ids", [])
    word["topic_name"] = None
    word["level_code"] = None
    return word


async def update_word(db: AsyncSession, word_id: str, data: dict) -> dict | None:
    """Cập nhật từ vựng (Admin S9.1). Trả None nếu không tìm thấy."""
    r = await db.execute(
        text("""
            UPDATE topic_word
            SET    topic_id         = CAST(:topic_id AS UUID),
                   level_id         = CAST(:level_id AS UUID),
                   word             = :word,
                   phonetic         = :phonetic,
                   meaning_vi       = :meaning_vi,
                   meaning_en       = :meaning_en,
                   example_sentence = :example_sentence,
                   grammar_note     = :grammar_note,
                   audio_url        = :audio_url,
                   display_order    = :display_order,
                   admin_locked     = CASE WHEN source = 'langeek' THEN TRUE ELSE admin_locked END
            WHERE  id = CAST(:word_id AS UUID)
            RETURNING id::text,
                      topic_id::text,
                      level_id::text,
                      word, phonetic, meaning_vi, meaning_en,
                      example_sentence, grammar_note, audio_url,
                      display_order, source, is_active,
                      COALESCE(admin_locked, FALSE) AS admin_locked,
                      created_by::text, created_at
        """),
        {
            "word_id":          word_id,
            "topic_id":         data["topic_id"],
            "level_id":         data.get("level_id"),
            "word":             data["word"],
            "phonetic":         data.get("phonetic"),
            "meaning_vi":       data["meaning_vi"],
            "meaning_en":       data.get("meaning_en"),
            "example_sentence": data.get("example_sentence"),
            "grammar_note":     data.get("grammar_note"),
            "audio_url":        data.get("audio_url"),
            "display_order":    data.get("display_order", 0),
        },
    )
    row = r.mappings().first()
    if row is None:
        return None
    word = dict(row)
    await _sync_word_tags(db, word_id, data.get("tag_ids", []))
    word["tag_ids"] = data.get("tag_ids", [])
    word["topic_name"] = None
    word["level_code"] = None
    return word


async def _sync_word_tags(db: AsyncSession, word_id: str, tag_ids: list[str]) -> None:
    """
    Đồng bộ M:N topic_word_tag theo danh sách tag_ids gửi lên (replace toàn bộ).
    """
    await db.execute(
        text("DELETE FROM topic_word_tag WHERE topic_word_id = CAST(:wid AS UUID)"),
        {"wid": word_id},
    )
    for tag_id in tag_ids:
        await db.execute(
            text("""
                INSERT INTO topic_word_tag (topic_word_id, tag_id)
                VALUES (CAST(:wid AS UUID), CAST(:tid AS UUID))
                ON CONFLICT DO NOTHING
            """),
            {"wid": word_id, "tid": str(tag_id)},
        )


async def soft_delete_topic(db: AsyncSession, topic_id: str) -> bool:
    """Soft-delete topic + admin lock (Admin S9.2/S9.5 — AC-13-03 / AC-13-06)."""
    r = await db.execute(
        text("""
            UPDATE topic
            SET    is_active = FALSE,
                   admin_locked = TRUE
            WHERE  id = CAST(:topic_id AS UUID)
        """),
        {"topic_id": topic_id},
    )
    return r.rowcount > 0


async def soft_delete_word(db: AsyncSession, word_id: str) -> bool:
    """Soft-delete topic_word + admin lock (Admin S9.2/S9.5)."""
    r = await db.execute(
        text("""
            UPDATE topic_word
            SET    is_active = FALSE,
                   admin_locked = TRUE
            WHERE  id = CAST(:word_id AS UUID)
        """),
        {"word_id": word_id},
    )
    return r.rowcount > 0


async def enable_topic(db: AsyncSession, topic_id: str) -> dict | None:
    """Re-enable topic — clear admin lock (S9.5)."""
    r = await db.execute(
        text("""
            UPDATE topic
            SET    is_active = TRUE,
                   admin_locked = FALSE
            WHERE  id = CAST(:topic_id AS UUID)
            RETURNING id::text, level_id::text, name, slug, description,
                      display_order, source, is_active,
                      COALESCE(admin_locked, FALSE) AS admin_locked,
                      created_at
        """),
        {"topic_id": topic_id},
    )
    row = r.mappings().first()
    if row is None:
        return None
    out = dict(row)
    out["level_code"] = None
    return out


async def enable_word(db: AsyncSession, word_id: str) -> dict | None:
    """Re-enable word — clear admin lock (S9.5)."""
    r = await db.execute(
        text("""
            UPDATE topic_word
            SET    is_active = TRUE,
                   admin_locked = FALSE
            WHERE  id = CAST(:word_id AS UUID)
            RETURNING id::text, topic_id::text, level_id::text,
                      word, phonetic, meaning_vi, meaning_en,
                      example_sentence, grammar_note, audio_url,
                      display_order, source, is_active,
                      COALESCE(admin_locked, FALSE) AS admin_locked,
                      created_by::text, created_at
        """),
        {"word_id": word_id},
    )
    row = r.mappings().first()
    if row is None:
        return None
    word = dict(row)
    word["topic_name"] = None
    word["level_code"] = None
    word["tag_ids"] = []
    return word


async def soft_disable_langeek_word_crawler(db: AsyncSession, word_id: str) -> bool:
    """Crawler batch disable — không set admin_locked (S9.5)."""
    r = await db.execute(
        text("""
            UPDATE topic_word
            SET    is_active = FALSE,
                   updated_at = NOW()
            WHERE  id = CAST(:word_id AS UUID)
              AND  admin_locked = FALSE
        """),
        {"word_id": word_id},
    )
    return r.rowcount > 0


# ═══════════════════════════════════════════════════════════════════════════════
# level (đọc — dùng cho dropdown trong form Admin)
# ═══════════════════════════════════════════════════════════════════════════════

async def list_levels(db: AsyncSession) -> list[dict]:
    """Danh sách 6 level A1–C2 — dùng cho dropdown chọn level trong form Admin."""
    r = await db.execute(
        text("SELECT id::text, code, name, display_order FROM level ORDER BY display_order")
    )
    return [dict(row) for row in r.mappings().all()]


async def get_level_by_code(db: AsyncSession, code: str) -> dict | None:
    """Lookup level theo code A1–C2 (crawler S9.3)."""
    r = await db.execute(
        text("""
            SELECT id::text, code, name, display_order
            FROM   level
            WHERE  UPPER(code) = UPPER(:code)
            LIMIT  1
        """),
        {"code": code},
    )
    row = r.mappings().first()
    return dict(row) if row else None


async def get_topic_by_slug(db: AsyncSession, slug: str) -> dict | None:
    r = await db.execute(
        text("""
            SELECT id::text, level_id::text, name, slug, description,
                   display_order, source, is_active,
                   COALESCE(admin_locked, FALSE) AS admin_locked
            FROM   topic
            WHERE  slug = :slug
            LIMIT  1
        """),
        {"slug": slug},
    )
    row = r.mappings().first()
    return dict(row) if row else None


async def upsert_langeek_topic(
    db: AsyncSession,
    *,
    level_id: str,
    name: str,
    slug: str,
    description: str | None,
    display_order: int,
) -> tuple[dict | None, str | None]:
    """
    Upsert topic từ crawler Langeek (S9.3 + S9.5 admin_locked).
    Trả (topic, skip_reason). skip_reason: admin_conflict | admin_locked.
    """
    existing = await get_topic_by_slug(db, slug)
    if existing:
        if existing.get("source") == "admin":
            return None, "admin_conflict"
        if existing.get("admin_locked"):
            return existing, "admin_locked"
        r = await db.execute(
            text("""
                UPDATE topic
                SET    level_id = CAST(:level_id AS UUID),
                       name = :name,
                       description = :description,
                       display_order = :display_order,
                       is_active = TRUE,
                       updated_at = NOW()
                WHERE  id = CAST(:id AS UUID)
                  AND  admin_locked = FALSE
                RETURNING id::text, level_id::text, name, slug, description,
                          display_order, source, is_active,
                          COALESCE(admin_locked, FALSE) AS admin_locked
            """),
            {
                "id": existing["id"],
                "level_id": level_id,
                "name": name,
                "description": description,
                "display_order": display_order,
            },
        )
        row = r.mappings().first()
        if row is None:
            return existing, "admin_locked"
        return dict(row), None

    r = await db.execute(
        text("""
            INSERT INTO topic
                (level_id, name, slug, description, display_order, source, is_active)
            VALUES
                (CAST(:level_id AS UUID), :name, :slug, :description, :display_order,
                 'langeek', TRUE)
            RETURNING id::text, level_id::text, name, slug, description,
                      display_order, source, is_active
        """),
        {
            "level_id": level_id,
            "name": name,
            "slug": slug,
            "description": description,
            "display_order": display_order,
        },
    )
    return dict(r.mappings().first()), None


async def get_word_in_topic(db: AsyncSession, topic_id: str, word: str) -> dict | None:
    r = await db.execute(
        text("""
            SELECT id::text, topic_id::text, word, source, is_active,
                   COALESCE(admin_locked, FALSE) AS admin_locked
            FROM   topic_word
            WHERE  topic_id = CAST(:topic_id AS UUID)
              AND  LOWER(word) = LOWER(:word)
            LIMIT  1
        """),
        {"topic_id": topic_id, "word": word},
    )
    row = r.mappings().first()
    return dict(row) if row else None


async def upsert_langeek_word(
    db: AsyncSession,
    *,
    topic_id: str,
    level_id: str,
    word: str,
    phonetic: str | None,
    meaning_vi: str,
    meaning_en: str | None,
    example_sentence: str | None,
    display_order: int,
) -> tuple[dict | None, str | None]:
    """
    Upsert từ Langeek (S9.3 + S9.5 admin_locked).
    Trả (word, skip_reason): admin_conflict | admin_locked.
    """
    existing = await get_word_in_topic(db, topic_id, word)
    if existing:
        if existing.get("source") == "admin":
            return None, "admin_conflict"
        if existing.get("admin_locked"):
            return existing, "admin_locked"
        r = await db.execute(
            text("""
                UPDATE topic_word
                SET    level_id = CAST(:level_id AS UUID),
                       phonetic = :phonetic,
                       meaning_vi = :meaning_vi,
                       meaning_en = :meaning_en,
                       example_sentence = :example_sentence,
                       display_order = :display_order,
                       is_active = TRUE,
                       updated_at = NOW()
                WHERE  id = CAST(:id AS UUID)
                  AND  admin_locked = FALSE
                RETURNING id::text, topic_id::text, word, source, is_active,
                          COALESCE(admin_locked, FALSE) AS admin_locked
            """),
            {
                "id": existing["id"],
                "level_id": level_id,
                "phonetic": phonetic,
                "meaning_vi": meaning_vi,
                "meaning_en": meaning_en,
                "example_sentence": example_sentence,
                "display_order": display_order,
            },
        )
        row = r.mappings().first()
        if row is None:
            return existing, "admin_locked"
        return dict(row), None

    r = await db.execute(
        text("""
            INSERT INTO topic_word
                (topic_id, level_id, word, phonetic, meaning_vi, meaning_en,
                 example_sentence, display_order, source, is_active, created_by)
            VALUES
                (CAST(:topic_id AS UUID), CAST(:level_id AS UUID), :word, :phonetic,
                 :meaning_vi, :meaning_en, :example_sentence, :display_order,
                 'langeek', TRUE, NULL)
            RETURNING id::text, topic_id::text, word, source, is_active
        """),
        {
            "topic_id": topic_id,
            "level_id": level_id,
            "word": word,
            "phonetic": phonetic,
            "meaning_vi": meaning_vi,
            "meaning_en": meaning_en,
            "example_sentence": example_sentence,
            "display_order": display_order,
        },
    )
    return dict(r.mappings().first()), None


async def soft_disable_langeek_words_not_in_batch(
    db: AsyncSession,
    topic_id: str,
    active_words: set[str],
) -> int:
    """
    Soft-disable từ Langeek không còn trong batch (S3.4).
    Bỏ qua từ admin_locked (S9.5 — Admin disable/edit).
    """
    r = await db.execute(
        text("""
            SELECT id::text, LOWER(word) AS w,
                   COALESCE(admin_locked, FALSE) AS admin_locked
            FROM   topic_word
            WHERE  topic_id = CAST(:topic_id AS UUID)
              AND  source = 'langeek'
              AND  is_active = TRUE
        """),
        {"topic_id": topic_id},
    )
    rows = r.mappings().all()
    disabled = 0
    normalized = {w.lower() for w in active_words}
    for row in rows:
        if row["admin_locked"]:
            continue
        if row["w"] not in normalized:
            ok = await soft_disable_langeek_word_crawler(db, row["id"])
            if ok:
                disabled += 1
    return disabled
