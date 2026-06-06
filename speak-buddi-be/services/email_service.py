import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from core.config import FRONTEND_URL, SMTP_HOST, SMTP_PASS, SMTP_PORT, SMTP_USER

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
