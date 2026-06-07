import os
from dotenv import load_dotenv

load_dotenv()

# ── AI ────────────────────────────────────────────────────────────────────────
ANTHROPIC_API_KEY:   str = os.getenv("ANTHROPIC_API_KEY", "")
ELEVENLABS_API_KEY:  str = os.getenv("ELEVENLABS_API_KEY", "")
ELEVENLABS_VOICE_ID: str = os.getenv("ELEVENLABS_VOICE_ID", "pNInz6obpgDQGcFmaJgB")
MAX_HISTORY_TURNS:   int = 10

# ── Auth / JWT ────────────────────────────────────────────────────────────────
JWT_SECRET:     str = os.getenv("JWT_SECRET", "speakbuddi-secret-change-in-prod")
ACCESS_TTL:     int = 15 * 60       # 15 phút
REFRESH_TTL:    int = 7 * 86400     # 7 ngày
RESET_TOKEN_TTL: int = 30 * 60      # 30 phút

# ── Google OAuth ──────────────────────────────────────────────────────────────
GOOGLE_CLIENT_ID: str = os.getenv("GOOGLE_CLIENT_ID", "")

# ── CORS ──────────────────────────────────────────────────────────────────────
ALLOWED_ORIGINS: list[str] = os.getenv(
    "ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000"
).split(",")

# ── Gmail SMTP ────────────────────────────────────────────────────────────────
SMTP_HOST:    str = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT:    int = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER:    str = os.getenv("SMTP_USER", "")
SMTP_PASS:    str = os.getenv("SMTP_PASS", "")
FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:5173")

# ── Payment (S8.1 — Provider TBD: dùng MockPaymentProvider mặc định) ──────────
# Đổi 'mock' → 'vnpay'/'momo'/… khi business chốt provider thật (xem
# services/payment_providers/__init__.py — chỉ cần thêm class + map, không
# đụng router/schema/FE).
PAYMENT_PROVIDER: str = os.getenv("PAYMENT_PROVIDER", "mock")

# ── Sepay (S8.2 — Provider đã chốt = Sepay, PO 2026-06-07) ───────────────────
# Sepay đối soát chuyển khoản VietQR — KHÔNG phải redirect-checkout truyền thống.
# Webhook xác thực bằng header `Authorization: Apikey <SEPAY_WEBHOOK_API_KEY>`.
# Các biến này CHỈ cần khi PAYMENT_PROVIDER=sepay; rỗng vẫn chạy MockProvider OK.
# TODO (chờ PO cấp credential thật — xem implement/S8.2-implement.md mục "Ngoài phạm vi"):
SEPAY_WEBHOOK_API_KEY: str = os.getenv("SEPAY_WEBHOOK_API_KEY", "")
SEPAY_ACCOUNT_NUMBER:  str = os.getenv("SEPAY_ACCOUNT_NUMBER", "")
SEPAY_BANK_CODE:       str = os.getenv("SEPAY_BANK_CODE", "")
SEPAY_PAYMENT_PREFIX:  str = os.getenv("SEPAY_PAYMENT_PREFIX", "SB")
