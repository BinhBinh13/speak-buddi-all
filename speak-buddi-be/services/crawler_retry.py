# speak-buddi-be/services/crawler_retry.py
# ─── Retry policy cho crawler Langeek (S9.4) ───────────────────────────────────

from __future__ import annotations

from datetime import datetime, timedelta, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from repositories import crawl_repo


def should_retry(new_count: int, max_retries: int) -> bool:
    """new_count = số lần retry đã lên lịch; cho phép nếu new_count <= max_retries."""
    return new_count <= max_retries


async def schedule_next_retry(
    db: AsyncSession,
    job_id: str,
    source: dict,
    current_retry_count: int,
) -> bool:
    """
    Lên lịch retry cho job failed. Trả True nếu đã schedule, False nếu exhausted.
    """
    max_retries = int(source.get("max_retries") or 3)
    delay = int(source.get("retry_delay_seconds") or 300)
    new_count = current_retry_count + 1

    if not should_retry(new_count, max_retries):
        await crawl_repo.update_job_retry_state(
            db,
            job_id,
            retry_count=new_count,
            retry_status="exhausted",
            next_retry_at=None,
        )
        return False

    next_at = datetime.now(timezone.utc) + timedelta(seconds=delay)
    await crawl_repo.update_job_retry_state(
        db,
        job_id,
        retry_count=new_count,
        retry_status="scheduled",
        next_retry_at=next_at,
    )
    await crawl_repo.append_log(
        db,
        job_id,
        f"Đã lên lịch retry {new_count}/{max_retries} lúc {next_at.isoformat()}",
        severity="warn",
        payload={"retry_count": new_count, "max_retries": max_retries, "next_retry_at": next_at.isoformat()},
    )
    return True


async def run_pending_retries(db: AsyncSession) -> int:
    """Chạy các job failed đã đến hạn retry. Trả số job đã kick."""
    from services.crawler_job import run_sync

    pending = await crawl_repo.get_pending_retries(db)
    count = 0
    for job in pending:
        running = await crawl_repo.get_running_job(db)
        if running:
            break
        await crawl_repo.update_job_retry_state(
            db, job["id"], retry_status="pending", next_retry_at=None
        )
        await run_sync(db, trigger="retry")
        count += 1
    return count


async def cleanup_stale_running_jobs(db: AsyncSession, timeout_minutes: int = 30) -> int:
    """Job running quá lâu → failed; schedule retry nếu còn policy."""
    job_ids = await crawl_repo.cleanup_stale_running_jobs(db, timeout_minutes)
    source = await crawl_repo.get_default_source(db)
    if not source:
        return len(job_ids)
    for job_id in job_ids:
        await schedule_next_retry(db, job_id, source, 0)
    return len(job_ids)
