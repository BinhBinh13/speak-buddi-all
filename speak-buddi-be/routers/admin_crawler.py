# speak-buddi-be/routers/admin_crawler.py
# ─── Admin Crawler API (S9.3 + S9.4 retry/notify/logs) ───────────────────────

from __future__ import annotations

import json
import logging

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from auth.deps import require_admin
from db.connection import get_db
from repositories import crawl_repo
from schemas.crawler import (
    CrawlJobDetailOut,
    CrawlJobListOut,
    CrawlJobOut,
    CrawlJobRunIn,
    CrawlJobStatsOut,
    CrawlLogListOut,
    CrawlLogOut,
    CrawlerConfigOut,
    CrawlerConfigUpdate,
    SyncStatusOut,
)
from services.crawler_job import run_sync

log = logging.getLogger("speakbuddi.admin_crawler")

router = APIRouter(
    prefix="/api/admin/crawler",
    tags=["admin-crawler"],
    dependencies=[Depends(require_admin)],
)


def _stats_from_row(row: dict) -> CrawlJobStatsOut:
    raw = row.get("stats_json") or {}
    if isinstance(raw, str):
        raw = json.loads(raw)
    return CrawlJobStatsOut(
        topics_upserted=int(raw.get("topics_upserted", 0)),
        words_upserted=int(raw.get("words_upserted", 0)),
        words_skipped_admin=int(raw.get("words_skipped_admin", 0)),
        words_disabled=int(raw.get("words_disabled", 0)),
        topics_skipped_conflict=int(raw.get("topics_skipped_conflict", 0)),
    )


def _job_out(row: dict) -> CrawlJobOut:
    return CrawlJobOut(
        id=row["id"],
        source_id=row["source_id"],
        trigger_type=row["trigger_type"],
        status=row["status"],
        started_at=row["started_at"],
        finished_at=row.get("finished_at"),
        stats=_stats_from_row(row),
        error_message=row.get("error_message"),
        retry_count=int(row.get("retry_count") or 0),
        retry_status=row.get("retry_status") or "none",
        next_retry_at=row.get("next_retry_at"),
    )


@router.get("/sync-status", response_model=SyncStatusOut)
async def get_sync_status(db: AsyncSession = Depends(get_db)):
    data = await crawl_repo.get_sync_status(db)
    return SyncStatusOut(**data)


@router.get("/config", response_model=CrawlerConfigOut)
async def get_config(db: AsyncSession = Depends(get_db)):
    source = await crawl_repo.get_default_source(db)
    if not source:
        raise HTTPException(status_code=404, detail="Chưa cấu hình crawler.")
    return CrawlerConfigOut(**source)


@router.put("/config", response_model=CrawlerConfigOut)
async def update_config(body: CrawlerConfigUpdate, db: AsyncSession = Depends(get_db)):
    source = await crawl_repo.get_default_source(db)
    if not source:
        raise HTTPException(status_code=404, detail="Chưa cấu hình crawler.")
    updated = await crawl_repo.update_source_config(
        db, source["id"], body.model_dump(exclude_unset=True)
    )
    if not updated:
        raise HTTPException(status_code=404, detail="Không cập nhật được cấu hình.")
    return CrawlerConfigOut(**updated)


@router.get("/jobs", response_model=CrawlJobListOut)
async def list_jobs(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
):
    rows, total = await crawl_repo.list_jobs(db, limit=limit, offset=offset)
    return CrawlJobListOut(items=[_job_out(r) for r in rows], total=total)


@router.get("/jobs/{job_id}", response_model=CrawlJobDetailOut)
async def get_job(job_id: str, db: AsyncSession = Depends(get_db)):
    row = await crawl_repo.get_job_by_id(db, job_id)
    if not row:
        raise HTTPException(status_code=404, detail="Không tìm thấy job.")
    base = _job_out(row)
    return CrawlJobDetailOut(**base.model_dump(), preview_json=row.get("preview_json"))


@router.get("/jobs/{job_id}/logs", response_model=CrawlLogListOut)
async def get_job_logs(job_id: str, db: AsyncSession = Depends(get_db)):
    row = await crawl_repo.get_job_by_id(db, job_id)
    if not row:
        raise HTTPException(status_code=404, detail="Không tìm thấy job.")
    logs = await crawl_repo.list_job_logs(db, job_id)
    return CrawlLogListOut(
        items=[
            CrawlLogOut(
                id=log["id"],
                job_id=log["job_id"],
                level_code=log.get("level_code"),
                topic_slug=log.get("topic_slug"),
                severity=log["severity"],
                message=log["message"],
                created_at=log["created_at"],
            )
            for log in logs
        ]
    )


@router.post("/jobs/{job_id}/retry", response_model=CrawlJobOut)
async def retry_job(job_id: str, db: AsyncSession = Depends(get_db)):
    job = await crawl_repo.get_job_by_id(db, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Không tìm thấy job.")
    if job["status"] != "failed":
        raise HTTPException(status_code=400, detail="Chỉ retry job đã thất bại.")

    running = await crawl_repo.get_running_job(db)
    if running:
        raise HTTPException(status_code=409, detail="Đã có job crawl đang chạy.")

    await crawl_repo.update_job_retry_state(
        db, job_id, retry_count=0, retry_status="none", next_retry_at=None
    )
    await crawl_repo.append_log(
        db, job_id, "Admin kích hoạt retry thủ công", severity="info"
    )

    result = await run_sync(db, trigger="retry")
    return _job_out(result)


@router.post("/jobs/run", response_model=CrawlJobOut)
async def run_crawl(body: CrawlJobRunIn | None = None, db: AsyncSession = Depends(get_db)):
    body = body or CrawlJobRunIn()
    running = await crawl_repo.get_running_job(db)
    if running:
        raise HTTPException(status_code=409, detail="Đã có job crawl đang chạy.")

    result = await run_sync(
        db,
        trigger="manual",
        dry_run=body.dry_run,
        level_code=body.level_code,
        use_fixture=body.use_fixture,
        simulate_fail=body.simulate_fail,
    )
    return _job_out(result)
