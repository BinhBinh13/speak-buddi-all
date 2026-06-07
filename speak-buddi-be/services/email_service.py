import logging
import smtplib
from datetime import datetime, timezone
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from html import escape

from core.config import FRONTEND_URL, SMTP_HOST, SMTP_PASS, SMTP_PORT, SMTP_USER
from schemas.support import SUBJECT_LABELS

log = logging.getLogger("speakbuddi.email")


def send_reset_email(to_email: str, token: str) -> None:
    if not SMTP_USER or not SMTP_PASS:
        log.warning("RESET_EMAIL skip: SMTP chưa cấu hình — set SMTP_USER và SMTP_PASS trong .env")
        return

    reset_link = f"{FRONTEND_URL}/reset-password?token={token}"
    msg = MIMEMultipart("alternative")
    msg["Subject"] = "Đặt lại mật khẩu SpeakBuddi"
    msg["From"]    = SMTP_USER
    msg["To"]      = to_email

    html_body = f"""
<div style="font-family:'Be Vietnam Pro',Arial,sans-serif;max-width:520px;margin:auto;padding:32px;background:#fcf8ff;border-radius:12px;">
  <h2 style="color:#3525cd;margin-bottom:8px;">SpeakBuddi</h2>
  <h3 style="color:#1b1b24;">Đặt lại mật khẩu</h3>
  <p style="color:#464555;">Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.</p>
  <p style="color:#464555;">Link này có hiệu lực trong <strong>30 phút</strong>.</p>
  <a href="{reset_link}"
     style="display:inline-block;margin:16px 0;padding:12px 28px;background:#3525cd;color:#fff;border-radius:12px;text-decoration:none;font-weight:600;">
    Đặt lại mật khẩu
  </a>
  <p style="color:#777587;font-size:13px;">
    Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này.
  </p>
  <hr style="border-color:#c7c4d8;margin-top:24px;"/>
  <p style="color:#777587;font-size:12px;">© 2024 SpeakBuddi. Nâng tầm tiếng Anh của người Việt.</p>
</div>
"""
    msg.attach(MIMEText(html_body, "html", "utf-8"))
    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.ehlo()
            server.starttls()
            server.login(SMTP_USER, SMTP_PASS)
            server.sendmail(SMTP_USER, to_email, msg.as_string())
        log.info("RESET_EMAIL sent via Gmail SMTP")
    except smtplib.SMTPAuthenticationError:
        log.error("RESET_EMAIL auth failed: kiểm tra SMTP_USER và App Password")
    except Exception as exc:
        log.error("RESET_EMAIL error: %s", type(exc).__name__)


def send_payment_failed_email(to_email: str, plan_name: str, reason: str) -> None:
    """
    Gửi email thông báo thanh toán thất bại/hủy (S8.3 — UC10, AC-10-03, §5.2).

    Clone pattern `send_reset_email` (Gmail SMTP, HTML inline theo design tokens
    primary `#3525cd` / error `#ba1a1a`, font Be Vietnam Pro). Skip an toàn +
    log warning khi chưa cấu hình SMTP_USER/SMTP_PASS — KHÔNG làm vỡ luồng
    webhook/cancel (Sepay cần 200 trong 30s).

    §4.5: KHÔNG log `to_email`/nội dung — chỉ log trạng thái gửi.
    """
    if not SMTP_USER or not SMTP_PASS:
        log.warning("PAYMENT_FAILED_EMAIL skip: SMTP chưa cấu hình — set SMTP_USER và SMTP_PASS trong .env")
        return

    retry_link = f"{FRONTEND_URL}/pricing"
    msg = MIMEMultipart("alternative")
    msg["Subject"] = "Thanh toán SpeakBuddi không thành công"
    msg["From"]    = SMTP_USER
    msg["To"]      = to_email

    html_body = f"""
<div style="font-family:'Be Vietnam Pro',Arial,sans-serif;max-width:520px;margin:auto;padding:32px;background:#fcf8ff;border-radius:12px;">
  <h2 style="color:#3525cd;margin-bottom:8px;">SpeakBuddi</h2>
  <h3 style="color:#1b1b24;">Thanh toán không thành công</h3>
  <p style="color:#ba1a1a;font-weight:600;">❌ Thanh toán không thành công. Lý do: {reason}</p>
  <p style="color:#464555;">Giao dịch nâng cấp gói <strong>{plan_name}</strong> của bạn chưa hoàn tất. Đừng lo — gói hiện tại của bạn không thay đổi và chưa có khoản phí nào bị trừ.</p>
  <a href="{retry_link}"
     style="display:inline-block;margin:16px 0;padding:12px 28px;background:#3525cd;color:#fff;border-radius:12px;text-decoration:none;font-weight:600;">
    Thử lại thanh toán
  </a>
  <p style="color:#777587;font-size:13px;">
    Nếu bạn cần hỗ trợ, vui lòng liên hệ đội ngũ chăm sóc khách hàng của SpeakBuddi.
  </p>
  <hr style="border-color:#c7c4d8;margin-top:24px;"/>
  <p style="color:#777587;font-size:12px;">© 2024 SpeakBuddi. Nâng tầm tiếng Anh của người Việt.</p>
</div>
"""
    msg.attach(MIMEText(html_body, "html", "utf-8"))
    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.ehlo()
            server.starttls()
            server.login(SMTP_USER, SMTP_PASS)
            server.sendmail(SMTP_USER, to_email, msg.as_string())
        log.info("PAYMENT_FAILED_EMAIL sent via Gmail SMTP")
    except smtplib.SMTPAuthenticationError:
        log.error("PAYMENT_FAILED_EMAIL auth failed: kiểm tra SMTP_USER và App Password")
    except Exception as exc:
        log.error("PAYMENT_FAILED_EMAIL error: %s", type(exc).__name__)


def send_crawler_failure_email(to_email: str, context: dict) -> None:
    """
    Email cảnh báo Admin khi crawler Langeek lỗi (S9.4 — AC-13-05, §11.6).
    Skip an toàn nếu SMTP chưa cấu hình — không làm vỡ luồng crawl.
    """
    if not SMTP_USER or not SMTP_PASS:
        log.warning("CRAWLER_FAILURE_EMAIL skip: SMTP chưa cấu hình")
        return

    reason = context.get("failure_reason", "Không rõ")
    source_url = context.get("source_url", "")
    last_success = context.get("last_success_at") or "Chưa có"
    retry_status = context.get("retry_status", "none")
    retry_count = context.get("retry_count", 0)
    cache_active = "Có" if context.get("cache_active") else "Không"
    admin_link = context.get("admin_link", f"{FRONTEND_URL}/admin/crawler")

    msg = MIMEMultipart("alternative")
    msg["Subject"] = "⚠ SpeakBuddi — Crawler Langeek thất bại"
    msg["From"] = SMTP_USER
    msg["To"] = to_email

    html_body = f"""
<div style="font-family:'Be Vietnam Pro',Arial,sans-serif;max-width:520px;margin:auto;padding:32px;background:#fcf8ff;border-radius:12px;">
  <h2 style="color:#3525cd;margin-bottom:8px;">SpeakBuddi Admin</h2>
  <h3 style="color:#ba1a1a;">Crawler Langeek thất bại</h3>
  <p style="color:#464555;">Hệ thống <strong>giữ nguyên nội dung cache đang active</strong> cho học viên. Vui lòng kiểm tra bảng điều khiển crawler.</p>
  <ul style="color:#464555;font-size:14px;line-height:1.6;">
    <li><strong>Nguồn:</strong> {source_url}</li>
    <li><strong>Lý do:</strong> {reason}</li>
    <li><strong>Lần sync thành công cuối:</strong> {last_success}</li>
    <li><strong>Trạng thái retry:</strong> {retry_status} (lần {retry_count})</li>
    <li><strong>Cache active:</strong> {cache_active}</li>
  </ul>
  <a href="{admin_link}"
     style="display:inline-block;margin:16px 0;padding:12px 28px;background:#3525cd;color:#fff;border-radius:12px;text-decoration:none;font-weight:600;">
    Mở Crawler Admin
  </a>
  <hr style="border-color:#c7c4d8;margin-top:24px;"/>
  <p style="color:#777587;font-size:12px;">© SpeakBuddi — thông báo tự động, không trả lời email này.</p>
</div>
"""
    msg.attach(MIMEText(html_body, "html", "utf-8"))
    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.ehlo()
            server.starttls()
            server.login(SMTP_USER, SMTP_PASS)
            server.sendmail(SMTP_USER, to_email, msg.as_string())
        log.info("CRAWLER_FAILURE_EMAIL sent")
    except smtplib.SMTPAuthenticationError:
        log.error("CRAWLER_FAILURE_EMAIL auth failed")
    except Exception as exc:
        log.error("CRAWLER_FAILURE_EMAIL error: %s", type(exc).__name__)


def send_support_contact_email(
    *,
    sender_name: str,
    sender_email: str,
    subject_key: str,
    message: str,
    user_id: str | None = None,
) -> str:
    """
    Chuyển tiếp form liên hệ tới inbox SMTP_USER (S12.3 — extra-scope).

    From/To = SMTP_USER; Reply-To = email người gửi form.
    §4.5: không log email/nội dung — chỉ log trạng thái ở caller.

    Returns:
        "sent" — gửi thành công
        "skipped" — SMTP chưa cấu hình (dev)
    Raises:
        Exception — SMTP configured nhưng gửi thất bại
    """
    if not SMTP_USER or not SMTP_PASS:
        log.warning("SUPPORT_CONTACT_EMAIL skip: SMTP chưa cấu hình")
        return "skipped"

    subject_label = SUBJECT_LABELS.get(subject_key, subject_key)
    ts = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    user_line = (
        f"<li><strong>User ID:</strong> {escape(user_id)}</li>"
        if user_id
        else ""
    )

    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"[SpeakBuddi Hỗ trợ] {subject_label} — {sender_name}"
    msg["From"] = SMTP_USER
    msg["To"] = SMTP_USER
    msg["Reply-To"] = sender_email

    html_body = f"""
<div style="font-family:'Be Vietnam Pro',Arial,sans-serif;max-width:560px;margin:auto;padding:32px;background:#fcf8ff;border-radius:12px;">
  <h2 style="color:#3525cd;margin-bottom:8px;">SpeakBuddi — Yêu cầu hỗ trợ</h2>
  <ul style="color:#464555;font-size:14px;line-height:1.6;padding-left:18px;">
    <li><strong>Họ tên:</strong> {escape(sender_name)}</li>
    <li><strong>Email:</strong> {escape(sender_email)}</li>
    <li><strong>Chủ đề:</strong> {escape(subject_label)}</li>
    <li><strong>Thời gian:</strong> {escape(ts)}</li>
    {user_line}
  </ul>
  <p style="color:#464555;font-weight:600;margin-top:16px;">Nội dung:</p>
  <div style="color:#464555;font-size:14px;line-height:1.6;white-space:pre-wrap;background:#ffffff;border:1px solid #c7c4d8;border-radius:8px;padding:12px;">{escape(message)}</div>
  <p style="color:#777587;font-size:12px;margin-top:24px;">
    Trả lời trực tiếp cho người dùng bằng cách Reply email này (Reply-To đã gắn email họ).
  </p>
  <hr style="border-color:#c7c4d8;margin-top:24px;"/>
  <p style="color:#777587;font-size:12px;">Form liên hệ: {escape(FRONTEND_URL)}/contact</p>
</div>
"""
    msg.attach(MIMEText(html_body, "html", "utf-8"))

    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.ehlo()
            server.starttls()
            server.login(SMTP_USER, SMTP_PASS)
            server.sendmail(SMTP_USER, SMTP_USER, msg.as_string())
        return "sent"
    except smtplib.SMTPAuthenticationError:
        log.error("SUPPORT_CONTACT_EMAIL auth failed")
        raise
    except Exception:
        log.error("SUPPORT_CONTACT_EMAIL error")
        raise
