# speak-buddi-be/routers/admin_analytics.py
# ─── Admin Analytics API routes (S11.1 dashboard + S11.2 revenue filter) ───────
#
# Endpoints:
#   GET /api/admin/analytics/overview
#   GET /api/admin/analytics/timeseries?metric=&range=&plan_id=
#   GET /api/admin/analytics/revenue?granularity=&from=&to=&plan_id=
#   POST /api/admin/analytics/export
#   GET /api/admin/analytics/exports?limit=&offset=
#
# Auth: Depends(require_admin)
# ─────────────────────────────────────────────────────────────────────────────

import logging
from datetime import date
from io import BytesIO
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from auth.deps import require_admin
from db.connection import get_db
from repositories import analytics_repo
from repositories import payment_plan_admin_repo
from repositories import report_export_repo
from schemas.analytics import (
    AiUsageStatsOut,
    DashboardOverviewOut,
    ExportHistoryItemOut,
    ExportHistoryListOut,
    ExportRequestIn,
    GranularityName,
    LearningStatsOut,
    MetricName,
    RangeName,
    RevenueFilterOut,
    RevenueStatsOut,
    TimeseriesOut,
    TimeseriesPoint,
    UserStatsOut,
)
from services import report_export_service

log = logging.getLogger("speakbuddi.admin_analytics")

router = APIRouter(prefix="/api/admin/analytics", tags=["admin-analytics"])


@router.get("/overview", response_model=DashboardOverviewOut)
async def get_overview(
    admin: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> DashboardOverviewOut:
    """Gói tổng quan dashboard admin (AC-12-01, §3.6)."""
    log.info("admin_analytics.overview requested by admin_id=%s", admin.get("sub"))

    user_stats = await analytics_repo.get_user_stats(db)
    revenue_stats = await analytics_repo.get_revenue_stats(db)
    learning_stats = await analytics_repo.get_learning_stats(db)
    top_words = await analytics_repo.get_top_words(db, limit=10)
    ai_usage = await analytics_repo.get_ai_usage_stats(db)

    return DashboardOverviewOut(
        users=UserStatsOut(**user_stats),
        revenue=RevenueStatsOut(**revenue_stats),
        learning=LearningStatsOut(**learning_stats, top_words=top_words),
        ai_usage=AiUsageStatsOut(**ai_usage),
    )


@router.get("/timeseries", response_model=TimeseriesOut)
async def get_timeseries(
    metric: MetricName = Query("users", description="users | revenue"),
    range: RangeName = Query("7d", description="7d | 30d | year"),
    plan_id: UUID | None = Query(None, description="Lọc doanh thu theo gói (metric=revenue)"),
    admin: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> TimeseriesOut:
    """Chuỗi thời gian cho biểu đồ — revenue dùng payment_transaction (S11.2)."""
    plan_id_str = str(plan_id) if plan_id else None
    if plan_id_str:
        plan = await payment_plan_admin_repo.get_plan(db, plan_id_str)
        if not plan:
            raise HTTPException(status_code=404, detail="⚠ Không tìm thấy gói thanh toán.")

    log.info(
        "admin_analytics.timeseries requested by admin_id=%s metric=%s range=%s has_plan=%s",
        admin.get("sub"), metric, range, bool(plan_id),
    )

    rows = await analytics_repo.get_timeseries(
        db, metric=metric, range_=range, plan_id=plan_id_str if metric == "revenue" else None,
    )
    points = [TimeseriesPoint(label=row["label"], value=row["value"]) for row in rows]

    return TimeseriesOut(
        metric=metric,
        range=range,
        points=points,
        is_estimated=False if metric == "revenue" else False,
    )


@router.get("/revenue", response_model=RevenueFilterOut)
async def get_revenue_filtered(
    granularity: GranularityName = Query("month", description="day | month | year | total"),
    from_date: date | None = Query(None, alias="from", description="YYYY-MM-DD inclusive"),
    to_date: date | None = Query(None, alias="to", description="YYYY-MM-DD inclusive"),
    plan_id: UUID | None = Query(None, description="UUID gói thanh toán (optional)"),
    admin: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> RevenueFilterOut:
    """
    Doanh thu đã lọc theo thời gian + gói (AC-12-02, §3.6).
    Nguồn: payment_transaction status='success'.
    """
    if (from_date is None) != (to_date is None):
        raise HTTPException(
            status_code=400,
            detail="⚠ Cần nhập cả ngày bắt đầu và ngày kết thúc.",
        )
    if from_date and to_date and from_date > to_date:
        raise HTTPException(
            status_code=400,
            detail="⚠ Ngày bắt đầu không được sau ngày kết thúc.",
        )

    plan_id_str = str(plan_id) if plan_id else None
    if plan_id_str:
        plan = await payment_plan_admin_repo.get_plan(db, plan_id_str)
        if not plan:
            raise HTTPException(status_code=404, detail="⚠ Không tìm thấy gói thanh toán.")

    log.info(
        "admin_analytics.revenue requested by admin_id=%s granularity=%s has_plan=%s custom_range=%s",
        admin.get("sub"),
        granularity,
        bool(plan_id),
        from_date is not None,
    )

    data = await analytics_repo.get_revenue_filtered(
        db,
        granularity=granularity,
        from_date=from_date,
        to_date=to_date,
        plan_id=plan_id_str,
    )
    points = [TimeseriesPoint(label=p["label"], value=p["value"]) for p in data["points"]]

    return RevenueFilterOut(
        total_vnd=data["total_vnd"],
        transaction_count=data["transaction_count"],
        currency=data["currency"],
        is_estimated=data["is_estimated"],
        granularity=data["granularity"],
        from_date=data["from_date"],
        to_date=data["to_date"],
        plan_id=UUID(plan_id_str) if plan_id_str else None,
        plan_name=data["plan_name"],
        points=points,
    )


@router.post("/export")
async def export_report(
    body: ExportRequestIn,
    admin: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> StreamingResponse:
    """
    Xuất báo cáo Excel/PDF và ghi lịch sử (AC-12-03).
    """
    if body.from_date > body.to_date:
        raise HTTPException(
            status_code=400,
            detail="⚠ Ngày bắt đầu không được sau ngày kết thúc.",
        )

    plan_id_str = str(body.plan_id) if body.plan_id else None
    if body.report_type != "revenue" and body.plan_id:
        raise HTTPException(
            status_code=400,
            detail="⚠ Chỉ báo cáo doanh thu mới được lọc theo gói thanh toán.",
        )
    if plan_id_str:
        plan = await payment_plan_admin_repo.get_plan(db, plan_id_str)
        if not plan:
            raise HTTPException(status_code=404, detail="⚠ Không tìm thấy gói thanh toán.")

    admin_id = admin.get("sub")
    filter_params = {
        "from": body.from_date.isoformat(),
        "to": body.to_date.isoformat(),
        "report_type": body.report_type,
        "export_format": body.export_format,
    }
    if plan_id_str:
        filter_params["plan_id"] = plan_id_str
    if body.report_type == "revenue":
        filter_params["granularity"] = body.granularity

    log.info(
        "admin_analytics.export requested by admin_id=%s report_type=%s export_format=%s",
        admin_id,
        body.report_type,
        body.export_format,
    )

    export_id = await report_export_repo.create_export(
        db,
        admin_user_id=admin_id,
        report_type=body.report_type,
        export_format=body.export_format,
        filter_params=filter_params,
    )
    await db.commit()

    try:
        file_bytes, content_type, file_name = await report_export_service.generate_export_file(
            db,
            report_type=body.report_type,
            export_format=body.export_format,
            from_date=body.from_date,
            to_date=body.to_date,
            plan_id=body.plan_id,
            granularity=body.granularity,
        )
        await report_export_repo.mark_completed(db, export_id, file_name)
        log.info(
            "admin_analytics.export completed admin_id=%s export_id=%s status=completed",
            admin_id,
            export_id,
        )
    except Exception as exc:
        await db.rollback()
        await report_export_repo.mark_failed(db, export_id, str(exc))
        await db.commit()
        log.exception(
            "admin_analytics.export failed admin_id=%s export_id=%s status=failed",
            admin_id,
            export_id,
        )
        raise HTTPException(
            status_code=500,
            detail="⚠ Không thể tạo báo cáo. Vui lòng thử lại sau.",
        ) from exc

    return StreamingResponse(
        BytesIO(file_bytes),
        media_type=content_type,
        headers={"Content-Disposition": f'attachment; filename="{file_name}"'},
    )


@router.get("/exports", response_model=ExportHistoryListOut)
async def list_export_history(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    admin: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> ExportHistoryListOut:
    """Danh sách lịch sử xuất báo cáo (AC-12-03)."""
    log.info("admin_analytics.exports requested by admin_id=%s", admin.get("sub"))
    rows, total = await report_export_repo.list_exports(db, limit=limit, offset=offset)
    items = [
        ExportHistoryItemOut(
            id=int(row["id"]),
            report_type=row["report_type"],
            export_format=row["export_format"],
            filter_params=row.get("filter_params"),
            file_name=row.get("file_name"),
            status=row["status"],
            error_message=row.get("error_message"),
            created_at=row["created_at"],
            completed_at=row.get("completed_at"),
        )
        for row in rows
    ]
    return ExportHistoryListOut(items=items, total=total)
