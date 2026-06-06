# SpeakBuddi Backend

API backend cho ứng dụng luyện nói tiếng Anh **SpeakBuddi**, xây dựng bằng FastAPI + Claude AI + ElevenLabs TTS.

---

## Tech Stack

| Layer | Công nghệ |
|-------|-----------|
| Framework | FastAPI |
| AI | Anthropic Claude (claude-haiku-4-5) |
| Text-to-Speech | ElevenLabs (eleven_multilingual_v2) |
| Auth | JWT tự implement (HMAC-SHA256) — chưa dùng DB (S1.8+) |
| DB (cấu hình sẵn) | PostgreSQL + SQLAlchemy async (sẽ activate ở S1.8+) |

---

## Cài đặt nhanh

### 1. Clone + tạo virtual environment

```bash
git clone https://github.com/your-username/speak-buddi-be.git
cd speak-buddi-be
python -m venv .venv
source .venv/bin/activate      # Mac/Linux
.venv\Scripts\activate         # Windows
```

### 2. Cài dependencies

```bash
pip install -r requirements.txt
```

### 3. Tạo file `.env`

```bash
cp .env.example .env
# Mở .env và điền các giá trị thật:
# ANTHROPIC_API_KEY, ELEVENLABS_API_KEY, JWT_SECRET, ...
```

### 4. Kiểm tra môi trường

```bash
python check_env.py
```

Kết quả mong đợi: tất cả package + key bắt buộc đều hiện ✅.

### 5. (Tuỳ chọn) Khởi tạo database PostgreSQL

> Bước này chỉ cần thiết từ **S1.8+**. Ở S1.1 auth vẫn dùng mock user.

```bash
# Tạo database
createdb -U postgres speakbuddi

# Chạy schema cốt lõi (Identity/Auth + Payment/Subscription)
psql -U postgres -d speakbuddi -f db/schema_core.sql

# Cấu hình DATABASE_URL trong .env:
# DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/speakbuddi

# Bỏ comment phần SQLAlchemy trong db/connection.py (xem TODO: S1.8)
```

### 6. Chạy server

```bash
uvicorn main:app --reload --port 8000
```

Server chạy tại: `http://localhost:8000`

---

## Endpoints

| Method | Path | Mô tả |
|--------|------|-------|
| GET  | `/health` | Health check |
| POST | `/speak` | AI conversation: Claude + ElevenLabs TTS |
| POST | `/tts` | Text-to-speech thuần |
| POST | `/api/auth/register` | Đăng ký email/password |
| POST | `/api/auth/login` | Đăng nhập, trả JWT access + refresh |
| POST | `/api/auth/refresh` | Làm mới access token |
| GET  | `/api/auth/me` | Lấy thông tin user từ JWT |

---

## Cấu trúc thư mục

```
speak-buddi-be/
├── main.py             # FastAPI app + routes + mock auth
├── db/
│   ├── __init__.py     # Export get_db()
│   ├── connection.py   # Engine config (stub → SQLAlchemy async khi S1.8)
│   └── schema_core.sql # PostgreSQL schema: users, user_profile, oauth_account,
│                       #   user_session, payment_plan, user_subscription
├── requirements.txt    # Pin version dependencies
├── .env.example        # Template biến môi trường (không có secret thật)
├── check_env.py        # Kiểm tra package + env key
└── README.md
```

---

## Môi trường Demo (mock user)

| Email | Password |
|-------|----------|
| demo@speakbuddi.com | password123 |

> Mock user tồn tại trong RAM; reset mỗi lần restart server.
> Từ S1.8+ sẽ chuyển sang PostgreSQL thật.

---

## Frontend

Frontend repo: [speak-buddi-fe](https://github.com/BinhBinh13/speak-buddi) — React 19 + Vite 8 + Bootstrap 5
