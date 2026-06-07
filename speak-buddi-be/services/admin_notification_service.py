# speak-buddi-be/services/admin_notification_service.py
# ─── Thông báo Admin khi crawler lỗi (S9.4) ──────────────────────────────────

from __future__ import annotations

import logging
from typing import Any

from core.config import ADMIN_CRAWLER_NOTIFY_EMAIL, FRONTEND_URL
from repositories import crawl_repo
from services.email_service import send_crawler_failure_email
from sqlalchemy.ext.asyncio import AsyncSession

log = logging.getLogger("speakbuddi.admin_notify")


async def _resolve_admin_email(db: AsyncSession, source: dict) -> str | None:
    if source.get("notify_email"):
        return source["notify_email"]
    if ADMIN_CRAWLER_NOTIFY_EMAIL:
        return ADMIN_CRAWLER_NOTIFY_EMAIL
    return await crawl_repo.get_first_admin_email(db)


async def notify_crawler_failure(
    db: AsyncSession,
    *,
    source: dict,
    job_id: str,
    reason: str,
    retry_status: str,
    retry_count: int,
    cache_active: bool,
) -> None:
    """
    Gửi email Admin (nếu SMTP OK) + ghi log info trên job.
    §11.6: URL, reason, last success, retry status, cache status.
    """
    context: dict[str, Any] = {
        "source_url": source.get("base_url", ""),
        "failure_reason": reason[:500],
        "last_success_at": source.get("last_success_at"),
        "retry_status": retry_status,
        "retry_count": retry_count,
        "cache_active": cache_active,
        "admin_link": f"{FRONTEND_URL}/admin/crawler",
        "job_id": job_id,
    }

    await crawl_repo.append_log(
        db,
        job_id,
        "Đã ghi nhận lỗi crawl — thông báo Admin",
        severity="info",
        payload=context,
    )

    to_email = await _resolve_admin_email(db, source)
    if not to_email:
        log.warning("CRAWLER_NOTIFY skip: chưa có email Admin (notify_email / ADMIN_CRAWLER_NOTIFY_EMAIL / user admin)")
        return

    send_crawler_failure_email(to_email, context)
