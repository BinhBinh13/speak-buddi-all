# speak-buddi-be/jobs/crawler_scheduler.py
# ─── APScheduler weekly crawl + retry interval (S9.3 + S9.4) ─────────────────

from __future__ import annotations

import logging

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger

from core.config import CRAWLER_SCHEDULER_ENABLED
from db.connection import async_session_factory
from services.crawler_job import run_sync
from services.crawler_retry import cleanup_stale_running_jobs, run_pending_retries

log = logging.getLogger("speakbuddi.crawler.scheduler")
_scheduler: AsyncIOScheduler | None = None


async def _run_scheduled_crawl() -> None:
    log.info("Weekly crawler triggered")
    async with async_session_factory() as db:
        try:
            await run_sync(db, trigger="scheduled")
            await db.commit()
        except Exception:
            await db.rollback()
            log.exception("Scheduled crawl failed")


async def _run_retry_tick() -> None:
    async with async_session_factory() as db:
        try:
            cleaned = await cleanup_stale_running_jobs(db)
            if cleaned:
                log.info("Cleaned %s stale running crawl job(s)", cleaned)
            retried = await run_pending_retries(db)
            if retried:
                log.info("Kicked %s pending crawl retry job(s)", retried)
            await db.commit()
        except Exception:
            await db.rollback()
            log.exception("Crawler retry tick failed")


def start_crawler_scheduler() -> AsyncIOScheduler | None:
    global _scheduler
    if not CRAWLER_SCHEDULER_ENABLED:
        log.info("CRAWLER_SCHEDULER_ENABLED=false — bỏ qua scheduler tuần")
        return None
    if _scheduler is not None:
        return _scheduler

    _scheduler = AsyncIOScheduler()
    _scheduler.add_job(
        _run_scheduled_crawl,
        CronTrigger(day_of_week="sun", hour=3, minute=0),
        id="langeek_weekly_crawl",
        replace_existing=True,
    )
    _scheduler.add_job(
        _run_retry_tick,
        IntervalTrigger(minutes=3),
        id="langeek_crawl_retry_tick",
        replace_existing=True,
    )
    _scheduler.start()
    log.info("Crawler scheduler started (Chủ nhật 03:00 + retry mỗi 3 phút)")
    return _scheduler


def stop_crawler_scheduler() -> None:
    global _scheduler
    if _scheduler:
        _scheduler.shutdown(wait=False)
        _scheduler = None
