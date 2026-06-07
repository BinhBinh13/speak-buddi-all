# speak-buddi-be/repositories/payment_repo.py
# ─── Repository cho payment_plan / payment_transaction (S8.1) ────────────────
#
# Pattern: bám sát repositories/translate_repo.py / quiz_repo.py
#   - raw SQL qua sqlalchemy.text()
#   - AsyncSession từ db/connection.py get_db()
#   - dict(row) cho từng kết quả
#
# Dùng ở:
#   S8.1 — get_active_plan, create_transaction, set_provider_ref, list_active_plans
#   S8.2 — get_transaction_by_provider_ref, mark_transaction_success/failed, get_plan_by_id
#   S8.3 — get_transaction_for_user (màn kết quả + cancel, lọc user_id chống IDOR)
# ─────────────────────────────────────────────────────────────────────────────

import json

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


# ═══════════════════════════════════════════════════════════════════════════════
# payment_plan
# ═══════════════════════════════════════════════════════════════════════════════

async def get_active_plan(db: AsyncSession, plan_id: str) -> dict | None:
    """
    Lấy 1 payment_plan đang active theo id. Trả None nếu không tồn tại
    hoặc đã bị soft-delete (is_active = FALSE) — dùng để validate trước checkout.
    """
    r = await db.execute(
        text("""
            SELECT id::text,
                   name,
                   price_vnd,
                   duration_days,
                   description,
                   features,
                   is_active,
                   sort_order
            FROM   payment_plan
            WHERE  id = CAST(:plan_id AS UUID)
              AND  is_active = TRUE
        """),
        {"plan_id": plan_id},
    )
    row = r.mappings().first()
    return dict(row) if row else None


async def list_active_plans(db: AsyncSession) -> list[dict]:
    """Lấy danh sách payment_plan active, sắp theo sort_order — phục vụ FE pricing động."""
    r = await db.execute(
        text("""
            SELECT id::text,
                   name,
                   price_vnd,
                   duration_days,
                   description,
                   features,
                   sort_order
            FROM   payment_plan
            WHERE  is_active = TRUE
            ORDER  BY sort_order ASC
        """)
    )
    return [dict(row) for row in r.mappings().all()]


# ═══════════════════════════════════════════════════════════════════════════════
# payment_transaction
# ═══════════════════════════════════════════════════════════════════════════════

async def create_transaction(
    db: AsyncSession,
    user_id: str,
    plan_id: str,
    amount_vnd: int,
    provider: str,
    currency: str = "VND",
    status: str = "pending",
) -> dict:
    """
    Tạo 1 payment_transaction mới (mặc định status='pending' — AC-10-01).
    Trả dict transaction vừa tạo (id, status, amount_vnd, …) để service dùng tiếp
    (gọi provider.create_checkout, log audit).
    """
    r = await db.execute(
        text("""
            INSERT INTO payment_transaction
                (user_id, plan_id, provider, amount_vnd, currency, status)
            VALUES
                (CAST(:uid AS UUID), CAST(:pid AS UUID), :provider, :amount, :currency, :status)
            RETURNING id::text, user_id::text, plan_id::text, provider,
                      provider_transaction_id, amount_vnd, currency, status, created_at
        """),
        {
            "uid": user_id,
            "pid": plan_id,
            "provider": provider,
            "amount": amount_vnd,
            "currency": currency,
            "status": status,
        },
    )
    row = r.mappings().first()
    return dict(row)


async def set_provider_ref(db: AsyncSession, transaction_id: str, provider_ref: str | None) -> None:
    """
    Cập nhật provider_transaction_id sau khi provider.create_checkout() trả về ref.
    Fire-and-forget — không trả về gì. Bỏ qua nếu provider_ref là None
    (một số provider trả ref muộn hơn, qua webhook ở S8.2).
    """
    if provider_ref is None:
        return
    await db.execute(
        text("""
            UPDATE payment_transaction
            SET    provider_transaction_id = :ref
            WHERE  id = CAST(:tx_id AS UUID)
        """),
        {"ref": provider_ref, "tx_id": transaction_id},
    )


# ═══════════════════════════════════════════════════════════════════════════════
# webhook / activation (S8.2 — AC-10-02)
# ═══════════════════════════════════════════════════════════════════════════════

async def get_transaction_by_provider_ref(
    db: AsyncSession, provider: str, provider_ref: str
) -> dict | None:
    """
    Tra `payment_transaction` theo UNIQUE (provider, provider_transaction_id) —
    dùng để map webhook → transaction + làm khóa idempotency (S8.2).
    Trả None nếu không khớp giao dịch nào (webhook không thuộc hệ thống).
    """
    r = await db.execute(
        text("""
            SELECT id::text,
                   user_id::text,
                   plan_id::text,
                   provider,
                   provider_transaction_id,
                   amount_vnd,
                   currency,
                   status,
                   user_subscription_id::text
            FROM   payment_transaction
            WHERE  provider = :provider
              AND  provider_transaction_id = :ref
        """),
        {"provider": provider, "ref": provider_ref},
    )
    row = r.mappings().first()
    return dict(row) if row else None


async def mark_transaction_success(
    db: AsyncSession,
    tx_id: str,
    raw_payload: dict | None,
    subscription_id: str,
) -> None:
    """
    Đánh dấu giao dịch thành công (AC-10-02): set status='success', paid_at=NOW(),
    lưu raw_payload (JSONB — Confidential §4.6, KHÔNG log) và gắn ngược
    user_subscription_id vừa kích hoạt.
    """
    await db.execute(
        text("""
            UPDATE payment_transaction
            SET    status = 'success',
                   paid_at = NOW(),
                   raw_payload = CAST(:raw AS JSONB),
                   user_subscription_id = CAST(:sub_id AS UUID)
            WHERE  id = CAST(:tx_id AS UUID)
        """),
        {
            "tx_id": tx_id,
            "raw": json.dumps(raw_payload) if raw_payload is not None else None,
            "sub_id": subscription_id,
        },
    )


async def mark_transaction_failed(
    db: AsyncSession,
    tx_id: str,
    reason: str,
    raw_payload: dict | None,
) -> None:
    """
    Đánh dấu giao dịch thất bại/hủy ở mức tối thiểu (status='failed'|'cancelled' +
    failure_reason + raw_payload) — đủ để mock "failed" chạy hết luồng webhook.
    UX/retry/email đầy đủ cho nhánh fail/cancel để S8.3 (AC-10-03).
    """
    status = reason if reason in ("failed", "cancelled") else "failed"
    await db.execute(
        text("""
            UPDATE payment_transaction
            SET    status = :status,
                   failure_reason = :reason,
                   raw_payload = CAST(:raw AS JSONB)
            WHERE  id = CAST(:tx_id AS UUID)
              AND  status = 'pending'
        """),
        {
            "tx_id": tx_id,
            "status": status,
            "reason": reason[:500],
            "raw": json.dumps(raw_payload) if raw_payload is not None else None,
        },
    )


async def get_transaction_for_user(db: AsyncSession, tx_id: str, user_id: str) -> dict | None:
    """
    Lấy 1 payment_transaction theo id, CHỈ khi thuộc về `user_id` (chống IDOR —
    S8.3 mục 6 plan). JOIN payment_plan để lấy `plan_name` cho màn kết quả +
    cancel hiển thị (không cần FE gọi thêm /payment/plans).
    Trả None nếu không tồn tại / không thuộc user này.
    """
    r = await db.execute(
        text("""
            SELECT t.id::text,
                   t.user_id::text,
                   t.plan_id::text,
                   t.status,
                   t.failure_reason,
                   t.amount_vnd,
                   p.name AS plan_name
            FROM   payment_transaction t
            JOIN   payment_plan p ON p.id = t.plan_id
            WHERE  t.id = CAST(:tx_id AS UUID)
              AND  t.user_id = CAST(:user_id AS UUID)
        """),
        {"tx_id": tx_id, "user_id": user_id},
    )
    row = r.mappings().first()
    return dict(row) if row else None


async def get_plan_by_id(db: AsyncSession, plan_id: str) -> dict | None:
    """
    Lấy payment_plan theo id — KỂ CẢ plan đã inactive (khác `get_active_plan`),
    vì transaction có thể đã tạo trước khi plan bị vô hiệu hóa; cần
    `duration_days` để tính `expires_at` khi activate subscription (BR04).
    """
    r = await db.execute(
        text("""
            SELECT id::text, name, price_vnd, duration_days, is_active
            FROM   payment_plan
            WHERE  id = CAST(:plan_id AS UUID)
        """),
        {"plan_id": plan_id},
    )
    row = r.mappings().first()
    return dict(row) if row else None
