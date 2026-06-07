# speak-buddi-be/repositories/crawl_repo.py
# ─── Repository cho crawler Langeek (S9.3 + S9.4) ────────────────────────────

from __future__ import annotations

import json
from typing import Any

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

_SOURCE_SELECT = """
    id::text, name, base_url, is_enabled, schedule_cron,
    rate_limit_ms, last_success_at, robots_checked_at, compliance_note,
    max_retries, retry_delay_seconds, notify_email
"""

_JOB_SELECT = """
    id::text, source_id::text, trigger_type, status,
    started_at, finished_at, stats_json, preview_json, error_message,
    retry_count, retry_status, next_retry_at, failure_context
"""


async def get_active_source(db: AsyncSession) -> dict | None:
    r = await db.execute(
        text(f"""
            SELECT {_SOURCE_SELECT}
            FROM   content_source
            WHERE  is_enabled = TRUE
            ORDER  BY created_at ASC
            LIMIT  1
        """)
    )
    row = r.mappings().first()
    return dict(row) if row else None


async def get_source_by_id(db: AsyncSession, source_id: str) -> dict | None:
    r = await db.execute(
        text(f"""
            SELECT {_SOURCE_SELECT}
            FROM   content_source
            WHERE  id = CAST(:id AS UUID)
        """),
        {"id": source_id},
    )
    row = r.mappings().first()
    return dict(row) if row else None


async def get_default_source(db: AsyncSession) -> dict | None:
    r = await db.execute(
        text(f"""
            SELECT {_SOURCE_SELECT}
            FROM   content_source
            ORDER  BY created_at ASC
            LIMIT  1
        """)
    )
    row = r.mappings().first()
    return dict(row) if row else None


async def get_first_admin_email(db: AsyncSession) -> str | None:
    r = await db.execute(
        text("""
            SELECT email FROM users
            WHERE  role = 'admin' AND email IS NOT NULL
            ORDER  BY created_at ASC
            LIMIT  1
        """)
    )
    row = r.first()
    return row[0] if row else None


async def update_source_config(db: AsyncSession, source_id: str, data: dict) -> dict | None:
    allowed = (
        "is_enabled", "schedule_cron", "rate_limit_ms", "compliance_note",
        "max_retries", "retry_delay_seconds", "notify_email",
    )
    fields = []
    params: dict[str, Any] = {"id": source_id}
    for key in allowed:
        if key in data and data[key] is not None:
            fields.append(f"{key} = :{key}")
            params[key] = data[key]
    if not fields:
        return await get_source_by_id(db, source_id)
    fields.append("updated_at = NOW()")
    sql = f"""
        UPDATE content_source
        SET    {', '.join(fields)}
        WHERE  id = CAST(:id AS UUID)
        RETURNING {_SOURCE_SELECT}
    """
    r = await db.execute(text(sql), params)
    row = r.mappings().first()
    return dict(row) if row else None


async def mark_source_success(db: AsyncSession, source_id: str) -> None:
    await db.execute(
        text("""
            UPDATE content_source
            SET    last_success_at = NOW(), updated_at = NOW()
            WHERE  id = CAST(:id AS UUID)
        """),
        {"id": source_id},
    )


async def count_active_cached_words(db: AsyncSession) -> int:
    r = await db.execute(
        text("""
            SELECT COUNT(*) FROM topic_word
            WHERE  is_active = TRUE
              AND  source IN ('langeek', 'admin')
        """)
    )
    return int(r.scalar_one() or 0)


async def compute_cache_active(db: AsyncSession, source: dict | None) -> bool:
    if not source or not source.get("last_success_at"):
        return False
    return (await count_active_cached_words(db)) > 0


async def create_job(db: AsyncSession, source_id: str, trigger: str) -> dict:
    r = await db.execute(
        text(f"""
            INSERT INTO content_crawl_job (source_id, trigger_type, status)
            VALUES (CAST(:source_id AS UUID), :trigger, 'running')
            RETURNING {_JOB_SELECT}
        """),
        {"source_id": source_id, "trigger": trigger},
    )
    return dict(r.mappings().first())


async def finish_job(
    db: AsyncSession,
    job_id: str,
    status: str,
    stats: dict | None = None,
    preview: dict | None = None,
    error_message: str | None = None,
    *,
    retry_count: int | None = None,
    retry_status: str | None = None,
    next_retry_at=None,
    failure_context: dict | None = None,
) -> dict | None:
    extra_sets = []
    params: dict[str, Any] = {
        "job_id": job_id,
        "status": status,
        "stats": json.dumps(stats or {}),
        "preview": json.dumps(preview) if preview else None,
        "error_message": error_message,
    }
    if retry_count is not None:
        extra_sets.append("retry_count = :retry_count")
        params["retry_count"] = retry_count
    if retry_status is not None:
        extra_sets.append("retry_status = :retry_status")
        params["retry_status"] = retry_status
    if next_retry_at is not None:
        extra_sets.append("next_retry_at = :next_retry_at")
        params["next_retry_at"] = next_retry_at
    elif next_retry_at is None and retry_status in ("none", "exhausted", "pending"):
        extra_sets.append("next_retry_at = NULL")
    if failure_context is not None:
        extra_sets.append("failure_context = CAST(:failure_context AS jsonb)")
        params["failure_context"] = json.dumps(failure_context)

    extra_sql = (", " + ", ".join(extra_sets)) if extra_sets else ""
    r = await db.execute(
        text(f"""
            UPDATE content_crawl_job
            SET    status = :status,
                   finished_at = NOW(),
                   stats_json = CAST(:stats AS jsonb),
                   preview_json = CAST(:preview AS jsonb),
                   error_message = :error_message
                   {extra_sql}
            WHERE  id = CAST(:job_id AS UUID)
            RETURNING {_JOB_SELECT}
        """),
        params,
    )
    row = r.mappings().first()
    return dict(row) if row else None


async def update_job_retry_state(
    db: AsyncSession,
    job_id: str,
    *,
    retry_count: int | None = None,
    retry_status: str | None = None,
    next_retry_at=None,
) -> None:
    sets = []
    params: dict[str, Any] = {"job_id": job_id}
    if retry_count is not None:
        sets.append("retry_count = :retry_count")
        params["retry_count"] = retry_count
    if retry_status is not None:
        sets.append("retry_status = :retry_status")
        params["retry_status"] = retry_status
    if next_retry_at is not None:
        sets.append("next_retry_at = :next_retry_at")
        params["next_retry_at"] = next_retry_at
    elif next_retry_at is None and retry_status in ("pending", "exhausted", "none"):
        sets.append("next_retry_at = NULL")
    if not sets:
        return
    await db.execute(
        text(f"""
            UPDATE content_crawl_job SET {', '.join(sets)}
            WHERE id = CAST(:job_id AS UUID)
        """),
        params,
    )


async def append_log(
    db: AsyncSession,
    job_id: str,
    message: str,
    *,
    severity: str = "info",
    level_code: str | None = None,
    topic_slug: str | None = None,
    payload: dict | None = None,
) -> None:
    await db.execute(
        text("""
            INSERT INTO content_crawl_log
                (job_id, level_code, topic_slug, severity, message, payload_json)
            VALUES
                (CAST(:job_id AS UUID), :level_code, :topic_slug, :severity, :message,
                 CAST(:payload AS jsonb))
        """),
        {
            "job_id": job_id,
            "level_code": level_code,
            "topic_slug": topic_slug,
            "severity": severity,
            "message": message,
            "payload": json.dumps(payload) if payload else None,
        },
    )


async def get_job_by_id(db: AsyncSession, job_id: str) -> dict | None:
    r = await db.execute(
        text(f"""
            SELECT {_JOB_SELECT}
            FROM   content_crawl_job
            WHERE  id = CAST(:job_id AS UUID)
        """),
        {"job_id": job_id},
    )
    row = r.mappings().first()
    return dict(row) if row else None


async def list_jobs(db: AsyncSession, limit: int = 20, offset: int = 0) -> tuple[list[dict], int]:
    count_r = await db.execute(text("SELECT COUNT(*) AS c FROM content_crawl_job"))
    total = int(count_r.scalar_one())
    r = await db.execute(
        text(f"""
            SELECT id::text, source_id::text, trigger_type, status,
                   started_at, finished_at, stats_json, error_message,
                   retry_count, retry_status, next_retry_at
            FROM   content_crawl_job
            ORDER  BY started_at DESC
            LIMIT  :limit OFFSET :offset
        """),
        {"limit": limit, "offset": offset},
    )
    return [dict(row) for row in r.mappings().all()], total


async def list_job_logs(db: AsyncSession, job_id: str) -> list[dict]:
    r = await db.execute(
        text("""
            SELECT id::text, job_id::text, level_code, topic_slug,
                   severity, message, created_at, payload_json
            FROM   content_crawl_log
            WHERE  job_id = CAST(:job_id AS UUID)
            ORDER  BY created_at ASC
        """),
        {"job_id": job_id},
    )
    return [dict(row) for row in r.mappings().all()]


async def get_running_job(db: AsyncSession) -> dict | None:
    r = await db.execute(
        text("""
            SELECT id::text, source_id::text, trigger_type, status, started_at
            FROM   content_crawl_job
            WHERE  status = 'running'
            ORDER  BY started_at DESC
            LIMIT  1
        """)
    )
    row = r.mappings().first()
    return dict(row) if row else None


async def get_pending_retries(db: AsyncSession, limit: int = 5) -> list[dict]:
    r = await db.execute(
        text(f"""
            SELECT {_JOB_SELECT}
            FROM   content_crawl_job
            WHERE  status = 'failed'
              AND  retry_status = 'scheduled'
              AND  next_retry_at IS NOT NULL
              AND  next_retry_at <= NOW()
            ORDER  BY next_retry_at ASC
            LIMIT  :limit
        """),
        {"limit": limit},
    )
    return [dict(row) for row in r.mappings().all()]


async def cleanup_stale_running_jobs(db: AsyncSession, timeout_minutes: int = 30) -> list[str]:
    r = await db.execute(
        text("""
            UPDATE content_crawl_job
            SET    status = 'failed',
                   finished_at = NOW(),
                   error_message = 'Job timeout — stale running (S9.4)',
                   retry_status = 'none',
                   retry_count = 0
            WHERE  status = 'running'
              AND  started_at < NOW() - (:mins || ' minutes')::interval
            RETURNING id::text
        """),
        {"mins": str(timeout_minutes)},
    )
    return [row[0] for row in r.all()]


async def get_sync_status(db: AsyncSession) -> dict:
    source = await get_default_source(db)
    cache_active = await compute_cache_active(db, source)

    latest_r = await db.execute(
        text("""
            SELECT id::text, status, started_at, finished_at, stats_json,
                   error_message, retry_count, retry_status, next_retry_at
            FROM   content_crawl_job
            ORDER  BY started_at DESC
            LIMIT  1
        """)
    )
    latest = latest_r.mappings().first()
    latest_d = dict(latest) if latest else {}

    last_failed_r = await db.execute(
        text("""
            SELECT started_at, error_message, retry_status, retry_count, next_retry_at
            FROM   content_crawl_job
            WHERE  status = 'failed'
            ORDER  BY finished_at DESC NULLS LAST
            LIMIT  1
        """)
    )
    last_failed = last_failed_r.mappings().first()
    last_failed_d = dict(last_failed) if last_failed else {}

    running = await get_running_job(db)

    week_r = await db.execute(
        text("""
            SELECT COALESCE(SUM((stats_json->>'words_upserted')::int), 0) AS words_week
            FROM   content_crawl_job
            WHERE  status = 'success'
              AND  started_at >= date_trunc('week', NOW())
        """)
    )
    words_week = int(week_r.scalar_one() or 0)
    active_words = await count_active_cached_words(db)

    return {
        "last_success_at": source.get("last_success_at") if source else None,
        "last_job_status": latest_d.get("status"),
        "last_job_id": latest_d.get("id"),
        "schedule_cron": source.get("schedule_cron", "0 3 * * 0") if source else "0 3 * * 0",
        "is_enabled": bool(source.get("is_enabled")) if source else False,
        "cache_active": cache_active,
        "words_upserted_this_week": words_week,
        "running_job_id": running["id"] if running else None,
        "last_failure_at": last_failed_d.get("started_at"),
        "last_failure_reason": last_failed_d.get("error_message"),
        "retry_status": last_failed_d.get("retry_status") or latest_d.get("retry_status") or "none",
        "retry_count": int(last_failed_d.get("retry_count") or latest_d.get("retry_count") or 0),
        "next_retry_at": last_failed_d.get("next_retry_at") or latest_d.get("next_retry_at"),
        "active_word_count": active_words,
        "source_url": source.get("base_url") if source else None,
    }
