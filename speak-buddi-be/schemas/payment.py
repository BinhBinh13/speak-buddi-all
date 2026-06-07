# speak-buddi-be/schemas/payment.py
# ─── Pydantic schemas cho Payment/Checkout/Webhook (S8.1 + S8.2 + S8.3) ──────
#
# Phạm vi S8.1: CheckoutRequest/Response + PaymentPlanOut (cho FE lấy plan_id thật)
# Phạm vi S8.2: WebhookResponse (response chuẩn cho POST /payment/webhook/{provider})
# Phạm vi S8.3: CancelRequest/CancelResponse + TransactionStatusOut (UC10, AC-10-03 —
#               màn kết quả thất bại + hủy giao dịch chủ động)
# ─────────────────────────────────────────────────────────────────────────────

from uuid import UUID

from pydantic import BaseModel


class CheckoutRequest(BaseModel):
    plan_id: UUID


class CheckoutResponse(BaseModel):
    transaction_id: str
    redirect_url: str
    provider: str
    amount_vnd: int


# ── (option) GET /api/payment/plans — FE pricing cần plan_id UUID thật ───────

class PaymentPlanOut(BaseModel):
    id: str
    name: str
    price_vnd: int
    duration_days: int
    description: str | None = None
    features: list[str] | None = None
    sort_order: int


# ── (S8.2) POST /api/payment/webhook/{provider} ─────────────────────────────
# Provider (Sepay) yêu cầu trả 200 + {"success": true} trong 30s, kể cả khi
# webhook không khớp giao dịch / đã xử lý trước đó (idempotent skip) — tránh
# bị retry vô ích (tối đa 7 lần trong 5 giờ).

class WebhookResponse(BaseModel):
    success: bool = True


# ── (S8.3) POST /api/payment/cancel — hủy giao dịch chủ động (client-driven) ─
# Sepay không bắn webhook fail/cancel (chỉ đối soát chuyển khoản thành công —
# transferType="in"); "hủy" là hành vi của user (bấm Hủy / rời màn VietQR), nên
# cần endpoint riêng để FE báo cho BE (mục 0.1 plan S8.3).

class CancelRequest(BaseModel):
    transaction_id: UUID


class CancelResponse(BaseModel):
    status: str  # "cancelled" | "failed" (idempotent: trả lại trạng thái hiện có nếu đã xử lý)


# ── (S8.3) GET /api/payment/transaction/{id} — màn kết quả đọc trạng thái thật ─
# FE màn `PaymentResultPage` gọi để lấy `status`/`failure_reason` thật thay vì
# chỉ tin query param (tránh user tự sửa URL hiển thị sai trạng thái).

class TransactionStatusOut(BaseModel):
    id: str
    status: str
    failure_reason: str | None = None
    plan_id: str
    plan_name: str
    amount_vnd: int
    provider: str = ""
    payment_code: str | None = None
    bank_account_number: str | None = None
    bank_code: str | None = None
    created_at: str | None = None
    pending_timeout_seconds: int = 300
