# speak-buddi-be/services/langeek_guardrail.py
# ─── Guardrail stub cho crawler Langeek (S9.3 — S9.4 mở rộng) ────────────────

from __future__ import annotations

import os

from core.config import LANGEEK_CRAWL_ENABLED


class GuardrailBlocked(Exception):
    def __init__(self, reason: str):
        self.reason = reason
        super().__init__(reason)


def check_crawl_permitted(*, source_enabled: bool) -> None:
    """
    Stub v1: env LANGEEK_CRAWL_ENABLED + content_source.is_enabled.
    S9.4 sẽ bổ sung robots.txt / retry / notify.
    """
    if not LANGEEK_CRAWL_ENABLED:
        raise GuardrailBlocked("Crawler bị tắt qua biến môi trường LANGEEK_CRAWL_ENABLED.")
    if not source_enabled:
        raise GuardrailBlocked("Nguồn crawl đang bị vô hiệu hóa trong cấu hình Admin.")


def should_use_fixture(explicit: bool | None = None) -> bool:
    if explicit is not None:
        return explicit
    return os.getenv("LANGEEK_USE_FIXTURE", "true").lower() in ("1", "true", "yes")
