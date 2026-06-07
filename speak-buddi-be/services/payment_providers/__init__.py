# speak-buddi-be/services/payment_providers/__init__.py
# ─── Factory chọn PaymentProvider (S8.1 theo env, S8.2 thêm theo tên) ────────
#
# Mặc định 'mock' (chạy ngay không cần config). Provider chính thức = Sepay
# (PO chốt 2026-06-07). Khi cần đổi/thêm provider khác, chỉ thêm 1 class trong
# package này + map vào _PROVIDERS — payment_service/router/FE không cần đổi.
#
#   get_provider()         — đọc env PAYMENT_PROVIDER, dùng cho checkout (S8.1)
#   get_provider_by_name() — chọn theo path param {provider} của webhook (S8.2),
#                            vì 1 hệ thống có thể nhận callback từ nhiều provider
#                            khác nhau (vd vẫn còn giao dịch mock cũ trong dev).
# ─────────────────────────────────────────────────────────────────────────────

from fastapi import HTTPException

from core.config import PAYMENT_PROVIDER

from .base import CallbackResult, CheckoutResult, PaymentProvider
from .mock_provider import MockPaymentProvider
from .sepay_provider import SepayProvider

_PROVIDERS: dict[str, type[PaymentProvider]] = {
    "mock": MockPaymentProvider,
    "sepay": SepayProvider,
    # "vnpay": VNPayProvider,    # TODO: thêm nếu business cần đa provider
    # "momo":  MoMoProvider,
}


def get_provider() -> PaymentProvider:
    """Trả về instance PaymentProvider theo env PAYMENT_PROVIDER (mặc định 'mock')."""
    name = PAYMENT_PROVIDER.strip().lower()
    provider_cls = _PROVIDERS.get(name, MockPaymentProvider)
    return provider_cls()


def get_provider_by_name(name: str) -> PaymentProvider:
    """
    Trả về instance PaymentProvider theo tên (path param `{provider}` của
    webhook — S8.2). Khác `get_provider()` (đọc env, dùng cho checkout):
    webhook route nhận tên provider từ URL nên cần tra cứu theo tên trực tiếp.

    Raises:
        HTTPException 404 nếu tên provider không được hỗ trợ — tránh lộ thông
        tin provider nào hợp lệ qua side-channel timing/khác biệt lỗi.
    """
    provider_cls = _PROVIDERS.get(name.strip().lower())
    if provider_cls is None:
        raise HTTPException(status_code=404, detail="Unsupported payment provider")
    return provider_cls()


__all__ = [
    "get_provider",
    "get_provider_by_name",
    "PaymentProvider",
    "CheckoutResult",
    "CallbackResult",
]
