# speak-buddi-be/services/payment_providers/mock_provider.py
# ─── MockPaymentProvider — provider mặc định khi PAYMENT_PROVIDER=mock (S8.1) ─
#
# Vì SRS để Payment Provider = TBD, MockPaymentProvider cho phép chạy hết luồng
# UC10 end-to-end mà không cần tích hợp cổng thanh toán thật:
#   - create_checkout(): sinh provider_ref giả + redirect_url trỏ tới màn
#     mock-pay nội bộ FE (`/payment/mock?tx=<id>&ref=<provider_ref>`) để dev/QA
#     bấm "Giả lập thành công/thất bại" → MockPayPage gọi
#     POST /api/payment/webhook/mock { provider_ref, result } → kích hoạt S8.2.
#   - verify_callback(): nhận payload { provider_ref, result, amount_vnd? } từ
#     MockPayPage — không cần header auth (dev) — trả CallbackResult tương ứng.
#
# Khi business chốt provider thật, chỉ cần thêm 1 class provider mới + map
# trong factory (services/payment_providers/__init__.py) — không đụng router/FE.
# ─────────────────────────────────────────────────────────────────────────────

import logging
import uuid
from typing import Any
from urllib.parse import urlencode

from core.config import FRONTEND_URL
from .base import CallbackResult, CheckoutResult, PaymentProvider

log = logging.getLogger("speakbuddi.payment")


class MockPaymentProvider(PaymentProvider):
    """Provider giả lập — dùng cho dev/QA/demo khi chưa có provider thật."""

    name = "mock"

    def create_checkout(self, transaction: dict, plan: dict, user: dict) -> CheckoutResult:
        # Sinh provider_ref giả — định dạng gợi nhớ "MOCK-<8 hex>"
        provider_ref = f"MOCK-{uuid.uuid4().hex[:8].upper()}"

        # Truyền provider_ref qua query để MockPayPage gửi lại đúng ref khi
        # gọi webhook giả lập (FE không tự sinh ref — phải khớp DB để map).
        query = urlencode({"tx": transaction["id"], "ref": provider_ref})
        redirect_url = f"{FRONTEND_URL}/payment/mock?{query}"

        log.info(
            "MOCK_PROVIDER_CHECKOUT  tx=%s plan=%s provider_ref=%s",
            transaction["id"], plan.get("id"), provider_ref,
        )
        return CheckoutResult(redirect_url=redirect_url, provider_ref=provider_ref)

    def verify_callback(self, payload: dict[str, Any], headers: dict[str, str]) -> CallbackResult:
        """
        Nhận callback giả lập dạng:
            { "provider_ref": "MOCK-XXXXXXXX",
              "result": "success" | "failed" | "cancelled",
              "amount_vnd": <int?> }
        từ màn /payment/mock (dev/QA bấm nút). Không cần xác thực header (dev-only —
        khác Sepay thật phải verify Apikey). Validate tối thiểu: bắt buộc có
        `provider_ref` + `result` hợp lệ, nếu không → ValueError (router → 400).
        """
        provider_ref = payload.get("provider_ref")
        result = payload.get("result")

        if not provider_ref or not isinstance(provider_ref, str):
            raise ValueError("Thiếu provider_ref trong payload mock callback")
        if result not in ("success", "failed", "cancelled"):
            raise ValueError("result không hợp lệ — phải là success|failed|cancelled")

        amount_vnd = payload.get("amount_vnd")
        if amount_vnd is not None:
            try:
                amount_vnd = int(amount_vnd)
            except (TypeError, ValueError):
                amount_vnd = None

        return CallbackResult(
            provider_ref=provider_ref,
            status=result,
            amount_vnd=amount_vnd,
            raw_payload=payload,
        )
