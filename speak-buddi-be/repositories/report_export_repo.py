# speak-buddi-be/repositories/report_export_repo.py
# ─── Repository cho report_export_history (S11.3 — AC-12-03) ─────────────────

import json
from datetime import datetime, timezone

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


async def create_export(
    db: AsyncSession,
    admin_user_id: str,
    report_type: str,
    export_format: str,
    filter_params: dict,
) -> int:
    """Tạo bản ghi export trạng thái pending — trả id."""
    r = await db.execute(
        text("""
            INSERT INTO report_export_history (
                admin_user_id, report_type, export_format, filter_params, status
            )
            VALUES (
                CAST(:admin_id AS UUID),
                :report_type,
                :export_format,
                CAST(:filter_params AS jsonb),
                'pending'
            )
            RETURNING id
        """),
        {
            "admin_id": admin_user_id,
            "report_type": report_type,
            "export_format": export_format,
            "filter_params": json.dumps(filter_params),
        },
    )
    row = r.mappings().first()
    return int(row["id"]) if row else 0


async def mark_completed(
    db: AsyncSession,
    export_id: int,
    file_name: str,
) -> None:
    await db.execute(
        text("""
            UPDATE report_export_history
            SET status = 'completed',
                file_name = :file_name,
                completed_at = :completed_at
            WHERE id = :export_id
        """),
        {
            "export_id": export_id,
            "file_name": file_name,
            "completed_at": datetime.now(timezone.utc),
        },
    )


async def mark_failed(
    db: AsyncSession,
    export_id: int,
    error_message: str,
) -> None:
    msg = (error_message or "Lỗi không xác định")[:500]
    await db.execute(
        text("""
            UPDATE report_export_history
            SET status = 'failed',
                error_message = :error_message,
                completed_at = :completed_at
            WHERE id = :export_id
        """),
        {
            "export_id": export_id,
            "error_message": msg,
            "completed_at": datetime.now(timezone.utc),
        },
    )


async def list_exports(
    db: AsyncSession,
    *,
    limit: int = 20,
    offset: int = 0,
) -> tuple[list[dict], int]:
    """MVP: mọi admin xem toàn bộ lịch sử export."""
    count_r = await db.execute(text("SELECT COUNT(*)::int AS total FROM report_export_history"))
    total_row = count_r.mappings().first()
    total = int(total_row["total"]) if total_row else 0

    r = await db.execute(
        text("""
            SELECT id,
                   report_type,
                   export_format,
                   filter_params,
                   file_name,
                   status,
                   error_message,
                   created_at,
                   completed_at
            FROM report_export_history
            ORDER BY created_at DESC
            LIMIT :limit OFFSET :offset
        """),
        {"limit": limit, "offset": offset},
    )
    items = [dict(row) for row in r.mappings().all()]
    return items, total
