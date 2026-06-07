# speak-buddi-be/schemas/crawler.py
# ─── Pydantic schemas cho Admin Crawler API (S9.3 + S9.4) ────────────────────

from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class CrawlerConfigOut(BaseModel):
    id: str
    name: str
    base_url: str
    is_enabled: bool
    schedule_cron: str
    rate_limit_ms: int
    last_success_at: datetime | None = None
    compliance_note: str | None = None
    max_retries: int = 3
    retry_delay_seconds: int = 300
    notify_email: str | None = None


class CrawlerConfigUpdate(BaseModel):
    is_enabled: bool | None = None
    schedule_cron: str | None = Field(default=None, max_length=80)
    rate_limit_ms: int | None = Field(default=None, ge=200, le=10000)
    compliance_note: str | None = None
    max_retries: int | None = Field(default=None, ge=0, le=10)
    retry_delay_seconds: int | None = Field(default=None, ge=60, le=86400)
    notify_email: str | None = Field(default=None, max_length=255)


class CrawlJobRunIn(BaseModel):
    dry_run: bool = False
    level_code: str | None = Field(default=None, max_length=10)
    use_fixture: bool | None = None
    simulate_fail: bool = False


class CrawlJobStatsOut(BaseModel):
    topics_upserted: int = 0
    words_upserted: int = 0
    words_skipped_admin: int = 0
    words_disabled: int = 0
    topics_skipped_conflict: int = 0


class CrawlJobOut(BaseModel):
    id: str
    source_id: str
    trigger_type: str
    status: str
    started_at: datetime
    finished_at: datetime | None = None
    stats: CrawlJobStatsOut = Field(default_factory=CrawlJobStatsOut)
    error_message: str | None = None
    retry_count: int = 0
    retry_status: str = "none"
    next_retry_at: datetime | None = None


class CrawlJobDetailOut(CrawlJobOut):
    preview_json: dict[str, Any] | None = None


class CrawlLogOut(BaseModel):
    id: str
    job_id: str
    level_code: str | None = None
    topic_slug: str | None = None
    severity: str
    message: str
    created_at: datetime


class CrawlJobListOut(BaseModel):
    items: list[CrawlJobOut]
    total: int


class CrawlLogListOut(BaseModel):
    items: list[CrawlLogOut]


class SyncStatusOut(BaseModel):
    last_success_at: datetime | None = None
    last_job_status: str | None = None
    last_job_id: str | None = None
    schedule_cron: str
    is_enabled: bool
    cache_active: bool = False
    words_upserted_this_week: int = 0
    running_job_id: str | None = None
    last_failure_at: datetime | None = None
    last_failure_reason: str | None = None
    retry_status: str = "none"
    retry_count: int = 0
    next_retry_at: datetime | None = None
    active_word_count: int = 0
    source_url: str | None = None
