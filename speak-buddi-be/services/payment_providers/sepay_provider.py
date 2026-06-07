# speak-buddi-be/services/payment_providers/sepay_provider.py
# ─── SepayProvider — provider chính thức (PO chốt 2026-06-07, S8.2) ──────────
#
# Sepay là dịch vụ ĐỐI SOÁT CHUYỂN KHOẢN NGÂN HÀNG qua VietQR — KHÁC với cổng
# redirect-checkout (VNPay/MoMo/Stripe…):
#   - Người dùng quét VietQR / chuyển khoản tới SEPAY_ACCOUNT_NUMBER với nội
#     dung chuyển khoản chứa MÃ THANH TOÁN (vd "SB A1B2C3D4").
#   - Khi tiền vào tài khoản, Sepay POST webhook tới
#     POST /api/payment/webhook/sepay với payload chứa `code`/`content`/
#     `transferAmount`/`transferType`… và header `Authorization: Apikey <key>`.
#   - Backend phải trả 200 + {"success": true} trong 30s, nếu không Sepay retry
#     tối đa 7 lần (Fibonacci, trong 5 giờ) → bắt buộc idempotent (xem
#     payment_service.handle_webhook).
#
# create_checkout(): KHÔNG trả URL trang nhập thẻ của provider — sinh MÃ THANH
#   TOÁN duy nhất (provider_ref) nhúng vào nội dung chuyển khoản, trả
#   redirect_url tới màn nội bộ FE hiển thị VietQR + hướng dẫn chuyển khoản.
# verify_callback(): xác thực Apikey → lọc transferType="in" → tách mã thanh
#   toán từ payload["code"]/["content"] → trả CallbackResult để service map
#   ngược về transaction qua UNIQUE (provider, provider_transaction_id).
#
# §4.6: Sepay = chuyển khoản ngân hàng → KHÔNG có card data, không lưu/log.
# §4.5: KHÔNG log Authorization/API key/raw payload — chỉ log định danh tối thiểu.
# ─────────────────────────────────────────────────────────────────────────────

import logging
import re
import uuid
from typing import Any
from urllib.parse import urlencode

from core.config import (
    FRONTEND_URL,
    SEPAY_PAYMENT_PREFIX,
    SEPAY_WEBHOOK_API_KEY,
)
from .base import CallbackResult, CheckoutResult, PaymentProvider

log = logging.getLogger("speakbuddi.payment")


class SepayProvider(PaymentProvider):
    """Provider chính thức — chuyển khoản VietQR đối soát qua Sepay (PO chốt 2026-06-07)."""

    name = "sepay"

    def create_checkout(self, transaction: dict, plan: dict, user: dict) -> CheckoutResult:
        # Mã thanh toán duy nhất nhúng vào nội dung chuyển khoản — Sepay tách
        # `code` từ `content` theo prefix cấu hình trong dashboard (TBD — xem
        # SEPAY_PAYMENT_PREFIX). Dùng 8 ký tự hex từ id transaction để dễ tra cứu.
        prefix = (SEPAY_PAYMENT_PREFIX or "SB").strip().upper()
        suffix = uuid.UUID(transaction["id"]).hex[:8].upper()
        provider_ref = f"{prefix}{suffix}"

        # redirect_url trỏ tới màn nội bộ FE hiển thị VietQR + hướng dẫn chuyển
        # khoản (img.vietqr.io hoặc QR Sepay) — KHÔNG phải trang nhập thẻ provider.
        # Màn `/payment/sepay` đầy đủ (hiển thị QR/hướng dẫn) là phần nối tiếp ở
        # S8.3 (xem ghi chú "Ngoài phạm vi" trong implement log) — webhook +
        # activation (trọng tâm AC-10-02) đã hoàn thiện đầy đủ ở S8.2.
        query = urlencode({"tx": transaction["id"], "code": provider_ref})
        redirect_url = f"{FRONTEND_URL}/payment/sepay?{query}"

        log.info(
            "SEPAY_PROVIDER_CHECKOUT  tx=%s plan=%s provider_ref=%s",
            transaction["id"], plan.get("id"), provider_ref,
        )
        return CheckoutResult(redirect_url=redirect_url, provider_ref=provider_ref)

    def verify_callback(self, payload: dict[str, Any], headers: dict[str, str]) -> CallbackResult:
        """
        Xác thực + parse webhook Sepay (AC-10-02).

        1. Header `Authorization: Apikey <SEPAY_WEBHOOK_API_KEY>` phải khớp
           → sai → PermissionError (router → 401/403). KHÔNG log giá trị header.
        2. Chỉ xử lý `transferType == "in"` (tiền vào) — bỏ qua `out`.
        3. Tách mã thanh toán từ `payload["code"]` (Sepay đã tách sẵn theo regex
           cấu hình dashboard) hoặc fallback regex từ `payload["content"]`.
        4. Trả CallbackResult(provider_ref=<mã thanh toán>, status="success",
           amount_vnd=transferAmount, raw_payload=payload).
        """
        self._verify_api_key(headers)

        transfer_type = (payload.get("transferType") or "").strip().lower()
        if transfer_type and transfer_type != "in":
            # Tiền ra (hoàn tiền/chuyển đi) — không phải callback thanh toán vào.
            raise ValueError("transferType không phải 'in' — bỏ qua callback")

        provider_ref = self._extract_payment_code(payload)
        if not provider_ref:
            raise ValueError("Không tách được mã thanh toán từ payload Sepay")

        amount_raw = payload.get("transferAmount")
        try:
            amount_vnd = int(amount_raw) if amount_raw is not None else None
        except (TypeError, ValueError):
            amount_vnd = None

        return CallbackResult(
            provider_ref=provider_ref,
            status="success",
            amount_vnd=amount_vnd,
            raw_payload=payload,
        )

    # ── helpers ──────────────────────────────────────────────────────────────

    def _verify_api_key(self, headers: dict[str, str]) -> None:
        """So khớp header Authorization "Apikey <key>" — raise PermissionError nếu sai."""
        if not SEPAY_WEBHOOK_API_KEY:
            # Chưa có credential thật (PO cấp sau — xem implement log "Ngoài phạm vi").
            # Từ chối thay vì bỏ qua xác thực — tránh activate giả mạo khi misconfig.
            log.error("SEPAY_WEBHOOK_API_KEY chưa được cấu hình — từ chối webhook")
            raise PermissionError("Sepay webhook chưa được cấu hình API key")

        auth_header = headers.get("authorization", "")
        expected = f"Apikey {SEPAY_WEBHOOK_API_KEY}"
        if auth_header != expected:
            # KHÔNG log auth_header/API key thật (§4.5) — chỉ log có/không khớp.
            raise PermissionError("Sepay webhook API key không hợp lệ")

    def _extract_payment_code(self, payload: dict[str, Any]) -> str | None:
        """
        Ưu tiên `payload["code"]` (Sepay đã tách theo regex cấu hình dashboard);
        fallback regex `<PREFIX><hex>` từ `payload["content"]` nếu `code` rỗng
        (vd người chuyển không qua VietQR mà gõ tay nội dung).
        """
        code = payload.get("code")
        if code and isinstance(code, str) and code.strip():
            return code.strip().upper()

        content = payload.get("content") or ""
        prefix = re.escape((SEPAY_PAYMENT_PREFIX or "SB").strip().upper())
        match = re.search(rf"{prefix}[0-9A-F]{{6,}}", content.upper())
        return match.group(0) if match else None
