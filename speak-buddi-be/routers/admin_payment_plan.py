# speak-buddi-be/routers/admin_payment_plan.py
# ─── Admin Payment Plan CRUD (S10.1 — UC14, AC-14-01/02) ─────────────────────
#
# Endpoints:
#   GET  /api/admin/payment-plans          → list[PaymentPlanAdminOut]
#   GET  /api/admin/payment-plans/{id}     → PaymentPlanAdminOut / 404
#   POST /api/admin/payment-plans          → PaymentPlanAdminOut (201)
#   PUT  /api/admin/payment-plans/{id}     → PaymentPlanAdminOut / 404
#
# Auth: require_admin (BR07). Soft delete UI → S10.2.
# ─────────────────────────────────────────────────────────────────────────────

from __future__ import annotations

import logging
import uuid as uuid_mod

from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.ext.asyncio import AsyncSession

from auth.deps import require_admin
from db.connection import get_db
from repositories import payment_plan_admin_repo as repo
from schemas.payment_plan_admin import (
    PaymentPlanAdminOut,
    PaymentPlanCreate,
    PaymentPlanUpdate,
)

log = logging.getLogger("speakbuddi.admin_payment_plan")

router = APIRouter(
    prefix="/api/admin",
    tags=["admin-payment-plan"],
    dependencies=[Depends(require_admin)],
)

MSG_NAME_REQUIRED = "⚠ Vui lòng nhập tên gói."
MSG_PRICE_NEGATIVE = "⚠ Giá gói không được nhỏ hơn 0."
MSG_FEATURES_REQUIRED = "⚠ Gói phải có ít nhất 1 tính năng."
MSG_DURATION_INVALID = "⚠ Thời hạn không hợp lệ."


def _normalize_features(features: list[str] | None) -> list[str]:
    if not features:
        return []
    return [f.strip() for f in features if f and f.strip()]


def _validate_create(body: PaymentPlanCreate) -> dict:
    name = (body.name or "").strip()
    if not name:
        raise HTTPException(status_code=400, detail=MSG_NAME_REQUIRED)
    if body.price_vnd < 0:
        raise HTTPException(status_code=400, detail=MSG_PRICE_NEGATIVE)
    if body.duration_days < 0:
        raise HTTPException(status_code=400, detail=MSG_DURATION_INVALID)
    features = _normalize_features(body.features)
    if not features:
        raise HTTPException(status_code=400, detail=MSG_FEATURES_REQUIRED)
    return {
        "name": name,
        "price_vnd": body.price_vnd,
        "duration_days": body.duration_days,
        "description": body.description,
        "features": features,
        "sort_order": body.sort_order,
    }


def _validate_update(body: PaymentPlanUpdate) -> dict:
    payload: dict = {}
    if body.name is not None:
        name = body.name.strip()
        if not name:
            raise HTTPException(status_code=400, detail=MSG_NAME_REQUIRED)
        payload["name"] = name
    if body.price_vnd is not None:
        if body.price_vnd < 0:
            raise HTTPException(status_code=400, detail=MSG_PRICE_NEGATIVE)
        payload["price_vnd"] = body.price_vnd
    if body.duration_days is not None:
        if body.duration_days < 0:
            raise HTTPException(status_code=400, detail=MSG_DURATION_INVALID)
        payload["duration_days"] = body.duration_days
    if body.description is not None:
        payload["description"] = body.description
    if body.features is not None:
        features = _normalize_features(body.features)
        if not features:
            raise HTTPException(status_code=400, detail=MSG_FEATURES_REQUIRED)
        payload["features"] = features
    if body.sort_order is not None:
        payload["sort_order"] = body.sort_order
    if body.is_active is not None:
        payload["is_active"] = body.is_active
    return payload


@router.get("/payment-plans", response_model=list[PaymentPlanAdminOut])
async def admin_list_payment_plans(
    include_inactive: bool = True,
    db: AsyncSession = Depends(get_db),
) -> list[PaymentPlanAdminOut]:
    rows = await repo.list_plans(db, include_inactive=include_inactive)
    log.info("ADMIN_LIST_PAYMENT_PLANS  count=%d", len(rows))
    return [PaymentPlanAdminOut(**row) for row in rows]


@router.get("/payment-plans/{plan_id}", response_model=PaymentPlanAdminOut)
async def admin_get_payment_plan(
    plan_id: uuid_mod.UUID,
    db: AsyncSession = Depends(get_db),
) -> PaymentPlanAdminOut:
    row = await repo.get_plan(db, str(plan_id))
    if not row:
        raise HTTPException(status_code=404, detail="Gói thanh toán không tồn tại.")
    return PaymentPlanAdminOut(**row)


@router.post("/payment-plans", response_model=PaymentPlanAdminOut, status_code=201)
async def admin_create_payment_plan(
    body: PaymentPlanCreate,
    user: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> PaymentPlanAdminOut:
    data = _validate_create(body)
    row = await repo.create_plan(db, data)
    log.info("ADMIN_CREATE_PAYMENT_PLAN  id=%s  by=%s", row["id"], user.get("email"))
    return PaymentPlanAdminOut(**row)


@router.put("/payment-plans/{plan_id}", response_model=PaymentPlanAdminOut)
async def admin_update_payment_plan(
    plan_id: uuid_mod.UUID,
    body: PaymentPlanUpdate,
    user: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> PaymentPlanAdminOut:
    data = _validate_update(body)
    if not data:
        row = await repo.get_plan(db, str(plan_id))
        if not row:
            raise HTTPException(status_code=404, detail="Gói thanh toán không tồn tại.")
        return PaymentPlanAdminOut(**row)

    row = await repo.update_plan(db, str(plan_id), data)
    if not row:
        raise HTTPException(status_code=404, detail="Gói thanh toán không tồn tại.")
    log.info("ADMIN_UPDATE_PAYMENT_PLAN  id=%s  by=%s", plan_id, user.get("email"))
    return PaymentPlanAdminOut(**row)


@router.delete("/payment-plans/{plan_id}", status_code=204)
async def admin_disable_payment_plan(
    plan_id: uuid_mod.UUID,
    user: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> Response:
    """Vô hiệu hóa gói thanh toán (soft delete is_active=false — S10.2 AC-14-03)."""
    ok = await repo.soft_delete_plan(db, str(plan_id))
    if not ok:
        raise HTTPException(status_code=404, detail="Gói thanh toán không tồn tại.")
    await db.commit()
    log.info("ADMIN_DISABLE_PAYMENT_PLAN  admin=%s  plan=%s", user.get("sub"), plan_id)
    return Response(status_code=204)
