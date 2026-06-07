# speak-buddi-be/services/payment_service.py
# ─── Service logic cho Payment/Checkout & Webhook (S8.1 + S8.2 + S8.3 — UC10) ─
#
# start_checkout():  validate plan → tạo payment_transaction (pending) →
#                    khởi tạo provider flow → trả redirect_url cho FE. (S8.1)
# handle_webhook():  xác thực callback provider → map về transaction (idempotent)
#                    → activate user_subscription → mark transaction success →
#                    user trở thành Paid User. (S8.2 — AC-10-02, BR04)
# cancel_checkout(): hủy giao dịch chủ động (client-driven — Sepay không bắn
#                    webhook fail/cancel) → giữ nguyên subscription cũ + gửi
#                    email thông báo. (S8.3 — AC-10-03)
#
# §4.5: log audit (user/plan/amount/transaction id) — KHÔNG log raw_payload/token/Apikey/email.
# §4.6: payment_transaction (incl. raw_payload) là Confidential — chỉ lưu DB.
# ─────────────────────────────────────────────────────────────────────────────

import logging

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from repositories import payment_repo, subscription_repo, user_repo
from schemas.payment import CancelResponse, CheckoutResponse
from services.email_service import send_payment_failed_email
from services.payment_providers import get_provider, get_provider_by_name

log = logging.getLogger("speakbuddi.payment")


# ═══════════════════════════════════════════════════════════════════════════════
# Map lý do thất bại/hủy → thông điệp tiếng Việt (S8.3 — §5.2, dùng cho cả màn
# kết quả + email). FE cũng có map dự phòng (phòng khi BE trả reason lạ).
# ═══════════════════════════════════════════════════════════════════════════════

_FAILURE_REASON_MESSAGES: dict[str, str] = {
    "failed": "Giao dịch bị từ chối hoặc không hoàn tất.",
    "cancelled": "Bạn đã hủy giao dịch.",
    "amount_mismatch": "Số tiền chuyển khoản không khớp.",
    "timeout": "Giao dịch đã hết thời gian xác nhận.",
}


def reason_to_message(reason: str | None) -> str:
    """Map `failure_reason` (mã nội bộ) → câu thông báo tiếng Việt cho user (§5.2)."""
    if not reason:
        return "Giao dịch không thành công."
    return _FAILURE_REASON_MESSAGES.get(reason, "Giao dịch bị từ chối hoặc không hoàn tất.")


async def _notify_payment_failed(db: AsyncSession, tx: dict, reason: str) -> None:
    """
    Gửi email thông báo thất bại/hủy (mục 3.c plan). Bọc try/except riêng —
    KHÔNG để lỗi gửi email làm vỡ luồng webhook/cancel (Sepay cần 200 trong 30s).
    KHÔNG log email/nội dung (§4.5).
    """
    try:
        user = await user_repo.get_user_by_id(db, tx["user_id"])
        plan = await payment_repo.get_plan_by_id(db, tx["plan_id"])
        if user and user.get("email"):
            send_payment_failed_email(
                to_email=user["email"],
                plan_name=plan["name"] if plan else "Pro",
                reason=reason_to_message(reason),
            )
    except Exception as exc:
        log.error("PAYMENT_FAILED_EMAIL_ERROR  tx=%s err=%s", tx["id"], type(exc).__name__)


async def start_checkout(db: AsyncSession, user: dict, plan_id: str) -> CheckoutResponse:
    """
    Khởi tạo giao dịch thanh toán cho 1 gói trả phí (AC-10-01).

    1. Validate plan tồn tại + đang active (404 nếu không).
    2. Chặn checkout với gói miễn phí (price_vnd == 0 → 400).
    3. Tạo payment_transaction status='pending'.
    4. Gọi provider.create_checkout() → redirect_url + provider_ref.
    5. Lưu provider_transaction_id (nếu có ngay).
    6. Log audit (không log payload/token — §4.5).
    """
    user_id: str | None = user.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token payload")

    plan = await payment_repo.get_active_plan(db, plan_id)
    if plan is None:
        raise HTTPException(status_code=404, detail="Payment plan not found or inactive")

    if plan["price_vnd"] == 0:
        raise HTTPException(status_code=400, detail="Plan này miễn phí, không cần thanh toán")

    provider = get_provider()

    transaction = await payment_repo.create_transaction(
        db,
        user_id=user_id,
        plan_id=plan["id"],
        amount_vnd=plan["price_vnd"],
        provider=provider.name,
        status="pending",
    )

    try:
        result = provider.create_checkout(transaction, plan, user)
    except Exception as exc:
        log.error("CHECKOUT_PROVIDER_ERROR  user=%s plan=%s tx=%s provider=%s err=%s",
                  user_id, plan["id"], transaction["id"], provider.name, type(exc).__name__)
        raise HTTPException(status_code=502, detail="Payment provider error") from exc

    if result.provider_ref:
        await payment_repo.set_provider_ref(db, transaction["id"], result.provider_ref)

    # Audit log (§4.5) — chỉ log định danh + số tiền, KHÔNG log payload/token nhạy cảm
    log.info(
        "CHECKOUT  user=%s plan=%s amount=%d tx=%s provider=%s",
        user_id, plan["id"], plan["price_vnd"], transaction["id"], provider.name,
    )

    return CheckoutResponse(
        transaction_id=transaction["id"],
        redirect_url=result.redirect_url,
        provider=provider.name,
        amount_vnd=plan["price_vnd"],
    )


# ═══════════════════════════════════════════════════════════════════════════════
# Webhook / activation (S8.2 — UC10, AC-10-02, BR04)
# ═══════════════════════════════════════════════════════════════════════════════

async def handle_webhook(
    db: AsyncSession, provider_name: str, payload: dict, headers: dict[str, str]
) -> dict:
    """
    Xử lý webhook/callback từ payment provider (AC-10-02).

    1. Lấy provider theo tên trong path `{provider}` (KHÔNG phải env — webhook
       có thể tới từ provider khác checkout hiện tại, vd dữ liệu mock cũ).
    2. `provider.verify_callback()` xác thực signature/Apikey + parse payload
       → raise ValueError/PermissionError nếu sai (router map 400/401/403).
    3. Map về `payment_transaction` qua UNIQUE (provider, provider_transaction_id).
       Không khớp → log WEBHOOK_NO_MATCH, trả 200 (không activate) — tránh
       Sepay retry vô ích với giao dịch không thuộc hệ thống (mục 6 plan, TBD PO).
    4. IDEMPOTENT: nếu transaction đã 'success' → no-op, trả 200 (không tạo
       subscription lần 2 dù Sepay retry tối đa 7 lần).
    5. Nhánh success: verify amount ≥ snapshot, activate user_subscription theo
       plan.duration_days (BR04), mark transaction success + gắn subscription_id.
    6. Nhánh failed/cancelled: mark tối thiểu (UX/retry/email đầy đủ ở S8.3).

    Luôn trả `{"success": True}` khi đã NHẬN hợp lệ (kể cả no-match/idempotent
    skip) — Sepay yêu cầu 200 trong 30s, nếu không sẽ retry tối đa 7 lần.

    §4.5: KHÔNG log payload/Authorization/API key — chỉ log định danh tối thiểu.
    """
    provider = get_provider_by_name(provider_name)

    try:
        result = provider.verify_callback(payload, headers)
    except PermissionError as exc:
        log.warning("WEBHOOK_AUTH_FAILED  provider=%s err=%s", provider.name, type(exc).__name__)
        raise HTTPException(status_code=401, detail="Invalid webhook signature/API key") from exc
    except ValueError as exc:
        log.warning("WEBHOOK_PAYLOAD_INVALID  provider=%s err=%s", provider.name, type(exc).__name__)
        raise HTTPException(status_code=400, detail="Invalid webhook payload") from exc

    tx = await payment_repo.get_transaction_by_provider_ref(db, provider.name, result.provider_ref)
    if tx is None:
        # Không khớp giao dịch nào — có thể người chuyển sai nội dung/giao dịch
        # ngoài hệ thống. Trả 200 để Sepay dừng retry; ghi log để admin đối soát
        # thủ công (S8.3/S9.x). KHÔNG log provider_ref đầy đủ kèm payload (§4.5
        # — provider_ref không phải secret nên log riêng là chấp nhận được).
        log.warning("WEBHOOK_NO_MATCH  provider=%s ref=%s", provider.name, result.provider_ref)
        return {"success": True}

    # ── IDEMPOTENCY (lớp 1): đã xử lý thành công trước đó → no-op ────────────
    if tx["status"] == "success":
        log.info("WEBHOOK_DUPLICATE_SKIP  provider=%s tx=%s", provider.name, tx["id"])
        return {"success": True}

    if result.status == "success":
        # Verify số tiền — chống thiếu tiền (mục 3.0.3 plan). Lệch → không
        # activate, giữ transaction pending để admin/S8.3 xử lý.
        if result.amount_vnd is not None and result.amount_vnd < tx["amount_vnd"]:
            log.warning(
                "WEBHOOK_AMOUNT_MISMATCH  provider=%s tx=%s expected=%d received=%d",
                provider.name, tx["id"], tx["amount_vnd"], result.amount_vnd,
            )
            return {"success": True}

        plan = await payment_repo.get_plan_by_id(db, tx["plan_id"])
        if plan is None:
            log.error("WEBHOOK_PLAN_NOT_FOUND  provider=%s tx=%s plan=%s",
                      provider.name, tx["id"], tx["plan_id"])
            return {"success": True}

        # Kích hoạt subscription theo gói đã mua (BR04) — set Paid User.
        sub = await subscription_repo.activate_subscription(
            db,
            user_id=tx["user_id"],
            plan_id=tx["plan_id"],
            payment_ref=result.provider_ref,
            duration_days=plan["duration_days"],
        )
        await payment_repo.mark_transaction_success(
            db,
            tx_id=tx["id"],
            raw_payload=result.raw_payload,
            subscription_id=sub["id"],
        )

        # Audit log (§4.5) — chỉ định danh + số tiền, KHÔNG log raw_payload/Apikey
        log.info(
            "PAYMENT_SUCCESS  user=%s plan=%s tx=%s amount=%d sub=%s provider=%s",
            tx["user_id"], tx["plan_id"], tx["id"], tx["amount_vnd"], sub["id"], provider.name,
        )
    else:
        # Nhánh failed/cancelled — KHÔNG đụng user_subscription (giữ plan cũ,
        # AC-10-03). mark_transaction_failed() chỉ update khi đang 'pending'
        # (guard chống ghi đè giao dịch đã success).
        await payment_repo.mark_transaction_failed(
            db, tx_id=tx["id"], reason=result.status, raw_payload=result.raw_payload
        )
        log.info(
            "PAYMENT_%s  user=%s tx=%s provider=%s",
            result.status.upper(), tx["user_id"], tx["id"], provider.name,
        )
        # Email thông báo (S8.3 — §5.2). Bọc riêng, không vỡ 200 cho provider.
        await _notify_payment_failed(db, tx, result.status)

    return {"success": True}


# ═══════════════════════════════════════════════════════════════════════════════
# Hủy giao dịch chủ động — client-driven cancel (S8.3 — UC10, AC-10-03)
# ═══════════════════════════════════════════════════════════════════════════════

async def cancel_checkout(db: AsyncSession, user: dict, transaction_id: str) -> CancelResponse:
    """
    Hủy giao dịch đang `pending` theo yêu cầu của chính user (AC-10-03).

    Lý do dùng endpoint riêng thay vì chờ webhook (mục 0.1 plan): Sepay chỉ
    đối soát chuyển khoản THÀNH CÔNG (`transferType="in"`) — không bao giờ gửi
    callback fail/cancel. "Hủy" luôn là hành vi client (bấm Hủy / rời màn
    VietQR), nên BE cần một điểm vào tường minh để ghi nhận + giữ subscription
    cũ + gửi email thông báo.

    1. Tra transaction theo id, lọc `user_id` (403 nếu không phải của user này
       — chống IDOR).
    2. Idempotent:
       - đã `cancelled`/`failed` → trả lại trạng thái hiện có (không lỗi, không
         gửi lại email — tránh spam khi FE gọi lại do double-click/retry mạng).
       - đã `success` → 409 (không thể hủy giao dịch đã hoàn tất).
    3. `pending` → `mark_transaction_failed(reason="cancelled")` (guard
       `WHERE status='pending'` — KHÔNG đụng user_subscription, giữ plan cũ).
    4. Gửi email thông báo hủy (best-effort, không vỡ luồng).
    """
    user_id: str | None = user.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token payload")

    tx = await payment_repo.get_transaction_for_user(db, transaction_id, user_id)
    if tx is None:
        raise HTTPException(status_code=404, detail="Giao dịch không tồn tại")

    if tx["status"] in ("cancelled", "failed"):
        # Idempotent — FE có thể gọi lại (double-click, mất mạng) mà không lỗi.
        return CancelResponse(status=tx["status"])

    if tx["status"] == "success":
        raise HTTPException(status_code=409, detail="Giao dịch đã hoàn tất, không thể hủy")

    await payment_repo.mark_transaction_failed(
        db, tx_id=tx["id"], reason="cancelled", raw_payload=None
    )

    # Audit log (§4.5) — chỉ định danh, KHÔNG log email/lý do chi tiết người dùng nhập
    log.info("PAYMENT_CANCELLED  user=%s tx=%s plan=%s", user_id, tx["id"], tx["plan_id"])

    await _notify_payment_failed(db, tx, "cancelled")

    return CancelResponse(status="cancelled")


async def get_transaction_status(db: AsyncSession, user: dict, transaction_id: str) -> dict:
    """
    Tra trạng thái giao dịch cho màn kết quả (`PaymentResultPage`, AC-10-03).

    Lọc theo `user_id` (chống IDOR — mục 6 plan). FE gọi endpoint này để lấy
    `status`/`failure_reason` THẬT thay vì chỉ tin query param trên URL (param
    có thể bị user tự sửa → hiển thị sai trạng thái).
    """
    user_id: str | None = user.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token payload")

    tx = await payment_repo.get_transaction_for_user(db, transaction_id, user_id)
    if tx is None:
        raise HTTPException(status_code=404, detail="Giao dịch không tồn tại")

    return tx
