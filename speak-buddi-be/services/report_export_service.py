# speak-buddi-be/services/report_export_service.py
# ─── Orchestrate export báo cáo admin (S11.3 — AC-12-03) ─────────────────────

from __future__ import annotations

from datetime import date, datetime
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from repositories import analytics_repo
from services.export_builders import REPORT_LABELS, build_pdf, build_xlsx

CONTENT_TYPES = {
    "xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "pdf": "application/pdf",
}


def build_file_name(report_type: str, export_format: str, from_date: date, to_date: date) -> str:
    return f"speakbuddi-{report_type}-{from_date.isoformat()}-{to_date.isoformat()}.{export_format}"


def _fmt_dt(value: datetime | None) -> str:
    if not value:
        return ""
    if isinstance(value, datetime):
        return value.strftime("%Y-%m-%d %H:%M")
    return str(value)


async def _collect_payload(
    db: AsyncSession,
    report_type: str,
    from_date: date,
    to_date: date,
    plan_id: str | None,
    granularity: str,
) -> dict:
    meta = {
        "from_date": from_date.isoformat(),
        "to_date": to_date.isoformat(),
    }

    if report_type == "revenue":
        summary_data = await analytics_repo.get_revenue_filtered(
            db,
            granularity=granularity,
            from_date=from_date,
            to_date=to_date,
            plan_id=plan_id,
        )
        if summary_data.get("plan_name"):
            meta["plan_name"] = summary_data["plan_name"]
        transactions = await analytics_repo.get_revenue_transactions_for_export(
            db, from_date=from_date, to_date=to_date, plan_id=plan_id,
        )
        summary_rows = [
            ("Tổng doanh thu", _format_vnd(summary_data["total_vnd"])),
            ("Số giao dịch", str(summary_data["transaction_count"])),
            ("Tiền tệ", summary_data.get("currency") or "VND"),
        ]
        detail_headers = ["Mã GD", "Ngày thanh toán", "Gói", "Số tiền", "Tiền tệ"]
        detail_rows = [
            [
                row["id"],
                _fmt_dt(row.get("paid_at")),
                row.get("plan_name") or "",
                _format_vnd(row.get("amount_vnd")),
                row.get("currency") or "VND",
            ]
            for row in transactions
        ]
        return {
            "title": REPORT_LABELS["revenue"],
            "meta": meta,
            "summary_rows": summary_rows,
            "detail_headers": detail_headers,
            "detail_rows": detail_rows,
        }

    if report_type == "users":
        stats = await analytics_repo.get_user_stats(db)
        users = await analytics_repo.get_new_users_in_range(
            db, from_date=from_date, to_date=to_date,
        )
        summary_rows = [
            ("Tổng người dùng (hệ thống)", str(stats["total"])),
            ("Free / Paid", f"{stats['free']} / {stats['paid']}"),
            ("User mới trong khoảng", str(len(users))),
        ]
        detail_headers = ["Email", "Tên", "Ngày đăng ký", "Gói"]
        detail_rows = [
            [
                row.get("email") or "",
                row.get("name") or "",
                _fmt_dt(row.get("created_at")),
                "Trả phí" if row.get("tier") == "paid" else "Miễn phí",
            ]
            for row in users
        ]
        return {
            "title": REPORT_LABELS["users"],
            "meta": meta,
            "summary_rows": summary_rows,
            "detail_headers": detail_headers,
            "detail_rows": detail_rows,
        }

    if report_type == "learning":
        stats = await analytics_repo.get_learning_stats_in_range(
            db, from_date=from_date, to_date=to_date,
        )
        attempts = await analytics_repo.get_quiz_attempts_in_range(
            db, from_date=from_date, to_date=to_date,
        )
        top_words = await analytics_repo.get_top_words(db, limit=10)
        summary_rows = [
            ("Lượt làm bài (khoảng)", str(stats["quiz_attempts_total"])),
            ("Câu đúng / sai", f"{stats['correct_answers']} / {stats['wrong_answers']}"),
            ("Tỉ lệ đúng", f"{stats['accuracy_percent']}%"),
            ("Điểm TB", f"{stats['avg_score_percent']}%"),
        ]
        if top_words:
            summary_rows.append((
                "Top từ học nhiều",
                ", ".join(f"{w['word']} ({w['learned_count']})" for w in top_words[:5]),
            ))
        detail_headers = ["Ngày nộp", "Bài test", "Điểm %", "Đúng", "Sai", "Tổng câu"]
        detail_rows = [
            [
                _fmt_dt(row.get("submitted_at")),
                row.get("test_title") or "",
                str(row.get("score_percent") or 0),
                str(row.get("correct_answers") or 0),
                str(row.get("wrong_answers") or 0),
                str(row.get("total_questions") or 0),
            ]
            for row in attempts
        ]
        return {
            "title": REPORT_LABELS["learning"],
            "meta": meta,
            "summary_rows": summary_rows,
            "detail_headers": detail_headers,
            "detail_rows": detail_rows,
        }

    # ai_usage — placeholder Epic 7
    ai = await analytics_repo.get_ai_usage_stats(db)
    note = (
        "Chưa có dữ liệu AI (Epic 7 chưa triển khai)."
        if not ai.get("is_available")
        else "Dữ liệu AI đang được ghi nhận."
    )
    summary_rows = [
        ("Tổng phút hội thoại", str(ai.get("total_minutes") or 0)),
        ("Số hội thoại", str(ai.get("conversations") or 0)),
        ("Ghi chú", note),
    ]
    return {
        "title": REPORT_LABELS["ai_usage"],
        "meta": meta,
        "summary_rows": summary_rows,
        "detail_headers": [],
        "detail_rows": [],
    }


def _format_vnd(value: int | float | None) -> str:
    if value is None:
        return "0 ₫"
    return f"{int(value):,} ₫".replace(",", ".")


async def generate_export_file(
    db: AsyncSession,
    *,
    report_type: str,
    export_format: str,
    from_date: date,
    to_date: date,
    plan_id: UUID | None = None,
    granularity: str = "day",
) -> tuple[bytes, str, str]:
    """
    Trả (file_bytes, content_type, file_name).
    """
    plan_id_str = str(plan_id) if plan_id else None
    payload = await _collect_payload(
        db, report_type, from_date, to_date, plan_id_str, granularity,
    )

    if export_format == "xlsx":
        file_bytes = build_xlsx(report_type, payload)
    else:
        file_bytes = build_pdf(report_type, payload)

    file_name = build_file_name(report_type, export_format, from_date, to_date)
    content_type = CONTENT_TYPES[export_format]
    return file_bytes, content_type, file_name
