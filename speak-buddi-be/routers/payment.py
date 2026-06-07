# speak-buddi-be/routers/payment.py
# ─── Payment API routes (S8.1 checkout + S8.2 webhook + S8.3 cancel/result) ──
#
# Endpoints:
#   POST /api/payment/checkout              → CheckoutResponse        (AC-10-01, JWT)
#   GET  /api/payment/plans                  → list[PaymentPlanOut]    (public)
#   POST /api/payment/webhook/{provider}     → WebhookResponse         (AC-10-02, KHÔNG JWT)
#   POST /api/payment/cancel                 → CancelResponse          (AC-10-03, JWT)
#   GET  /api/payment/transaction/{id}       → TransactionStatusOut    (AC-10-03, JWT)
#
# Auth:
#   - /checkout, /cancel, /transaction/{id}: Depends(current_user) — JWT required.
#   - /plans: public (trang pricing landing có thể chưa login).
#   - /webhook/{provider}: KHÔNG dùng JWT user — được gọi từ SERVER của provider
#     (Sepay/mock). Xác thực qua provider.verify_callback() (header Authorization
#     "Apikey <key>" hoặc payload tùy provider) — sai → 401/403 (§4.5).
# ─────────────────────────────────────────────────────────────────────────────

import logging

from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from auth.deps import current_user
from db.connection import get_db
from repositories import payment_repo
from schemas.payment import (
    CancelRequest,
    CancelResponse,
    CheckoutRequest,
    CheckoutResponse,
    PaymentPlanOut,
    TransactionStatusOut,
    WebhookResponse,
)
from services.payment_service import (
    cancel_checkout,
    get_transaction_status,
    handle_webhook,
    start_checkout,
)

log = logging.getLogger("speakbuddi.payment")

router = APIRouter(prefix="/api", tags=["payment"])


@router.post("/payment/checkout", response_model=CheckoutResponse)
async def checkout(
    body: CheckoutRequest,
    user: dict = Depends(current_user),
    db: AsyncSession = Depends(get_db),
) -> CheckoutResponse:
    """
    Khởi tạo giao dịch thanh toán cho gói trả phí (AC-10-01, UC10).

    Tạo `payment_transaction` (status='pending') và trả `redirect_url` để FE
    điều hướng người dùng sang payment provider (hoặc màn mock-pay nội bộ).

    Errors:
      400  Plan miễn phí (price_vnd == 0)
      401  Không có / token không hợp lệ
      404  Plan không tồn tại hoặc đã bị vô hiệu hóa (is_active=false)
      502  Provider khởi tạo phiên thanh toán lỗi
    """
    return await start_checkout(db, user, str(body.plan_id))


@router.get("/payment/plans", response_model=list[PaymentPlanOut])
async def get_plans(
    db: AsyncSession = Depends(get_db),
) -> list[PaymentPlanOut]:
    """
    Trả danh sách payment_plan đang active (sắp theo sort_order).
    Dùng cho trang Pricing — FE cần `plan_id` UUID thật để gọi /payment/checkout.
    Public — không yêu cầu đăng nhập (trang pricing landing có thể xem trước khi login).
    """
    plans_raw = await payment_repo.list_active_plans(db)
    return [PaymentPlanOut(**row) for row in plans_raw]


@router.post("/payment/webhook/{provider}", response_model=WebhookResponse)
async def webhook(
    provider: str,
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> WebhookResponse:
    """
    Nhận webhook/callback từ payment provider (AC-10-02, UC10).

    Khi thanh toán thành công: xác thực callback → set `payment_transaction`
    `status='success'` + `paid_at` → kích hoạt `user_subscription` `active`
    theo gói đã mua (BR04) → user trở thành Paid User.

    KHÔNG dùng JWT user (`current_user`) — endpoint được gọi từ SERVER của
    provider (Sepay/mock), xác thực bằng API key/signature riêng của provider
    qua `provider.verify_callback(payload, headers)`.

    Luôn trả 200 + `{"success": true}` khi đã NHẬN hợp lệ (kể cả không khớp
    giao dịch / đã xử lý trước đó) — Sepay yêu cầu 200 trong 30s, nếu không sẽ
    retry tối đa 7 lần (Fibonacci, trong 5 giờ) → bắt buộc idempotent.

    Errors:
      400  payload không parse được / thiếu mã thanh toán
      401  signature/API key không hợp lệ
      404  provider không được hỗ trợ (path param sai)

    §4.5: KHÔNG log payload thô / header Authorization / API key.
    """
    payload = await request.json()
    headers = {k.lower(): v for k, v in request.headers.items()}
    return await handle_webhook(db, provider, payload, headers)


@router.post("/payment/cancel", response_model=CancelResponse)
async def cancel(
    body: CancelRequest,
    user: dict = Depends(current_user),
    db: AsyncSession = Depends(get_db),
) -> CancelResponse:
    """
    Hủy giao dịch đang chờ xử lý (AC-10-03, UC10).

    Client-driven cancel — Sepay không gửi webhook fail/cancel (chỉ đối soát
    chuyển khoản thành công), nên user chủ động báo hủy (bấm "Hủy" / rời màn
    thanh toán) qua endpoint này. Giữ nguyên `user_subscription` hiện tại
    (KHÔNG downgrade/đổi gói) + gửi email thông báo (§5.2).

    Idempotent: gọi lại với giao dịch đã `cancelled`/`failed` → trả lại trạng
    thái hiện có (không lỗi).

    Errors:
      401  Token không hợp lệ
      404  Giao dịch không tồn tại / không thuộc về user này (chống IDOR)
      409  Giao dịch đã thành công — không thể hủy
    """
    return await cancel_checkout(db, user, str(body.transaction_id))


@router.get("/payment/transaction/{transaction_id}", response_model=TransactionStatusOut)
async def get_transaction(
    transaction_id: str,
    user: dict = Depends(current_user),
    db: AsyncSession = Depends(get_db),
) -> TransactionStatusOut:
    """
    Tra trạng thái 1 giao dịch — dùng cho màn kết quả thanh toán
    (`PaymentResultPage`, AC-10-03) lấy `status`/`failure_reason` thật thay
    vì chỉ tin query param trên URL.

    Lọc theo `user_id` của JWT (chống IDOR — mục 6 plan S8.3).

    Errors:
      401  Token không hợp lệ
      404  Giao dịch không tồn tại / không thuộc về user này
    """
    tx = await get_transaction_status(db, user, transaction_id)
    return TransactionStatusOut(**tx)
