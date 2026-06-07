# speak-buddi-be/services/payment_providers/base.py
# ─── Interface provider-agnostic cho Payment (S8.1) ──────────────────────────
#
# SRS để Payment Provider = TBD (§2 Actor 5, §5.4, §5.5, §6). Để không phải sửa
# router/schema khi business chốt provider thật (VNPay/MoMo/PayOS/Stripe…),
# mọi provider implement interface PaymentProvider này.
#
#   create_checkout()  — S8.1: khởi tạo phiên thanh toán, trả redirect_url
#   verify_callback()  — S8.2: xác thực webhook/callback từ provider
#                        (payload + headers — provider thật như Sepay xác thực
#                        qua header Authorization "Apikey <key>", không qua body)
#
# §4.6 PCI-DSS: KHÔNG lưu card data — mọi xử lý thẻ delegate cho provider.
# ─────────────────────────────────────────────────────────────────────────────

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Any


@dataclass
class CheckoutResult:
    """Kết quả khởi tạo phiên thanh toán — trả về cho payment_service."""
    redirect_url: str
    provider_ref: str | None = None  # mã giao dịch phía provider (provider_transaction_id)


@dataclass
class CallbackResult:
    """
    Kết quả xác thực webhook/callback từ provider (dùng ở S8.2).
    Khai báo trước để verify_callback() có kiểu trả về rõ ràng; chưa implement đầy đủ ở S8.1.
    """
    provider_ref: str
    status: str            # 'success' | 'failed' | 'cancelled'
    amount_vnd: int | None = None
    raw_payload: dict[str, Any] | None = None


class PaymentProvider(ABC):
    """Interface mà mọi payment provider (mock/vnpay/momo/…) phải implement."""

    name: str = "base"

    @abstractmethod
    def create_checkout(self, transaction: dict, plan: dict, user: dict) -> CheckoutResult:
        """
        Khởi tạo phiên thanh toán cho 1 transaction `pending`.

        Args:
            transaction: dict transaction vừa tạo (id, amount_vnd, currency, …)
            plan:        dict payment_plan (id, name, price_vnd, …)
            user:        dict user payload từ JWT (sub, email, …)

        Returns:
            CheckoutResult(redirect_url, provider_ref)
        """
        raise NotImplementedError

    @abstractmethod
    def verify_callback(self, payload: dict[str, Any], headers: dict[str, str]) -> CallbackResult:
        """
        Xác thực + giải mã webhook/callback từ provider (S8.2 — AC-10-02).

        Args:
            payload: body JSON thô của webhook (Sepay payload / mock payload).
            headers: HTTP headers thô (lowercase key) — dùng để xác thực
                     signature/API key (vd Sepay: header `Authorization: Apikey <key>`).
                     KHÔNG dùng JWT user vì webhook được gọi từ server bên ngoài.

        Raises:
            ValueError | PermissionError: nếu signature/API key không hợp lệ
            (router map sang HTTP 401/403 — không lộ chi tiết xác thực).

        Returns:
            CallbackResult(provider_ref, status, amount_vnd, raw_payload)
        """
        raise NotImplementedError
