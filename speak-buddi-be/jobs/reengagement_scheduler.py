# speak-buddi-be/jobs/reengagement_scheduler.py
# ─── APScheduler daily: email nhắc user quay lại sau N ngày không hoạt động ──

from __future__ import annotations

import logging

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

from core.config import REENGAGEMENT_INACTIVE_DAYS, REENGAGEMENT_SCHEDULER_ENABLED
from db.connection import async_session_factory
from repositories import user_repo
from services.email_service import send_reengagement_email

log = logging.getLogger("speakbuddi.reengagement.scheduler")
_scheduler: AsyncIOScheduler | None = None


async def _run_reengagement_check() -> None:
    log.info("Reengagement reminder check triggered (inactive_days=%s)", REENGAGEMENT_INACTIVE_DAYS)
    async with async_session_factory() as db:
        try:
            users = await user_repo.get_users_for_reengagement_reminder(db, REENGAGEMENT_INACTIVE_DAYS)
            for user in users:
                send_reengagement_email(user["email"], user.get("name", ""), REENGAGEMENT_INACTIVE_DAYS)
            log.info("Reengagement reminder sent to %s user(s)", len(users))
        except Exception:
            log.exception("Reengagement reminder check failed")


def start_reengagement_scheduler() -> AsyncIOScheduler | None:
    global _scheduler
    if not REENGAGEMENT_SCHEDULER_ENABLED:
        log.info("REENGAGEMENT_SCHEDULER_ENABLED=false — bỏ qua scheduler nhắc quay lại")
        return None
    if _scheduler is not None:
        return _scheduler

    _scheduler = AsyncIOScheduler()
    _scheduler.add_job(
        _run_reengagement_check,
        CronTrigger(hour=9, minute=0),
        id="reengagement_daily_check",
        replace_existing=True,
    )
    _scheduler.start()
    log.info("Reengagement scheduler started (hằng ngày 09:00)")
    return _scheduler


def stop_reengagement_scheduler() -> None:
    global _scheduler
    if _scheduler:
        _scheduler.shutdown(wait=False)
        _scheduler = None
