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
