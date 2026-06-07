# speak-buddi-be/services/crawler_job.py
# ─── Orchestrate Langeek crawl job (S9.3 + S9.4 failure/retry) ───────────────

from __future__ import annotations

import json
import logging
import os
import subprocess
from pathlib import Path

from sqlalchemy.ext.asyncio import AsyncSession

from core.config import SCRAPE_ROOT, FIXTURE_BATCH_PATH
from repositories import crawl_repo
from services.admin_notification_service import notify_crawler_failure
from services.crawler_publish import publish_batch
from services.crawler_retry import schedule_next_retry
from services.langeek_guardrail import GuardrailBlocked, check_crawl_permitted, should_use_fixture
from services.langeek_mapping import batch_to_preview, parse_scrape_payload

log = logging.getLogger("speakbuddi.crawler")


def _load_fixture() -> dict:
    path = Path(FIXTURE_BATCH_PATH)
    if not path.is_file():
        raise FileNotFoundError(f"Fixture không tồn tại: {path}")
    return json.loads(path.read_text(encoding="utf-8"))


def _run_scraper_cli(
    level_code: str | None = None,
    *,
    use_fixture: bool = False,
    simulate_fail: bool = False,
    rate_limit_ms: int = 1000,
) -> dict:
    cli = Path(SCRAPE_ROOT) / "src" / "cli.js"
    if not cli.is_file():
        raise FileNotFoundError(f"Scraper CLI không tồn tại: {cli}")

    cmd = ["node", str(cli)]
    if use_fixture:
        cmd.append("--fixture")
    if simulate_fail:
        cmd.append("--fail")
    if level_code:
        cmd.extend(["--level", level_code.upper()])
    cmd.extend(["--rate-limit", str(rate_limit_ms)])

    env = os.environ.copy()
    if not use_fixture:
        env["LANGEEK_USE_FIXTURE"] = "false"

    result = subprocess.run(
        cmd,
        cwd=str(Path(SCRAPE_ROOT)),
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        timeout=900,
        check=False,
        env=env,
    )
    if result.returncode != 0:
        stderr = (result.stderr or result.stdout or "").strip()
        raise RuntimeError(stderr or "Scraper thất bại")

    stdout = (result.stdout or "").strip()
    json_start = stdout.find("{")
    if json_start < 0:
        raise RuntimeError("Scraper không trả JSON hợp lệ")
    return json.loads(stdout[json_start:])


async def _handle_failure(
    db: AsyncSession,
    job_id: str,
    source: dict,
    exc: Exception,
) -> dict:
    """
    S9.4 — KHÔNG publish / KHÔNG soft-disable; giữ cache active, retry, log, notify.
    """
    msg = str(exc)[:500]
    cache_active = await crawl_repo.compute_cache_active(db, source)
    last_success = source.get("last_success_at")
    failure_context = {
        "source_url": source.get("base_url"),
        "cache_active": cache_active,
        "last_success_at": last_success.isoformat() if last_success else None,
    }

    await crawl_repo.append_log(
        db,
        job_id,
        msg,
        severity="error",
        payload={
            **failure_context,
            "failure_reason": msg,
        },
    )

    finished = await crawl_repo.finish_job(
        db,
        job_id,
        status="failed",
        stats={},
        error_message=msg,
        retry_count=0,
        retry_status="none",
        failure_context=failure_context,
    )

    await schedule_next_retry(db, job_id, source, 0)

    job_after = await crawl_repo.get_job_by_id(db, job_id)
    retry_status = (job_after or {}).get("retry_status") or "none"
    retry_count = int((job_after or {}).get("retry_count") or 0)

    await notify_crawler_failure(
        db,
        source=source,
        job_id=job_id,
        reason=msg,
        retry_status=retry_status,
        retry_count=retry_count,
        cache_active=cache_active,
    )
    return finished or {"id": job_id, "status": "failed", "error_message": msg}


async def run_sync(
    db: AsyncSession,
    *,
    trigger: str = "manual",
    dry_run: bool = False,
    level_code: str | None = None,
    use_fixture: bool | None = None,
    simulate_fail: bool = False,
) -> dict:
    source = await crawl_repo.get_default_source(db)
    if not source:
        raise RuntimeError("Chưa cấu hình content_source — chạy schema_crawler.sql")

    check_crawl_permitted(source_enabled=bool(source.get("is_enabled")))

    job = await crawl_repo.create_job(db, source["id"], trigger)
    job_id = job["id"]

    try:
        if simulate_fail and should_use_fixture(use_fixture):
            raise RuntimeError("Simulated crawl failure (S9.4 test)")

        if should_use_fixture(use_fixture):
            payload = _load_fixture()
            await crawl_repo.append_log(
                db, job_id, "Dùng fixture batch (LANGEEK_USE_FIXTURE)", severity="info"
            )
        else:
            payload = _run_scraper_cli(
                level_code,
                use_fixture=False,
                simulate_fail=simulate_fail,
                rate_limit_ms=int(source.get("rate_limit_ms") or 1000),
            )
            await crawl_repo.append_log(
                db, job_id, "Scraper Playwright hoàn tất", severity="info"
            )

        batch = parse_scrape_payload(payload, level_filter=level_code)
        if not batch.topics:
            raise RuntimeError("Batch crawl rỗng — không có topic/từ hợp lệ")

        preview = batch_to_preview(batch)
        async with db.begin_nested():
            stats = await publish_batch(db, batch, job_id, dry_run=dry_run)
            if not dry_run:
                await crawl_repo.mark_source_success(db, source["id"])

        finished = await crawl_repo.finish_job(
            db,
            job_id,
            status="success",
            stats=stats,
            preview=preview,
            retry_status="none",
            retry_count=0,
            next_retry_at=None,
        )
        await crawl_repo.append_log(
            db,
            job_id,
            f"Crawl thành công — {stats['words_upserted']} từ, {stats['topics_upserted']} topic",
            severity="info",
            payload=stats,
        )
        return finished or job

    except GuardrailBlocked as e:
        return await _handle_failure(db, job_id, source, e)

    except Exception as e:
        log.exception("Crawl job %s failed", job_id)
        return await _handle_failure(db, job_id, source, e)
