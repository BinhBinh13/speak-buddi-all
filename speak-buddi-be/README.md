# SpeakBuddi Backend

API backend cho ứng dụng luyện nói tiếng Anh **SpeakBuddi**, xây dựng bằng FastAPI + Claude AI + ElevenLabs TTS.

---

## Tech Stack

| Layer | Công nghệ |
|-------|-----------|
| Framework | FastAPI |
| AI | Anthropic Claude (claude-haiku-4-5) |
| Text-to-Speech | ElevenLabs (eleven_multilingual_v2) |
| Auth | JWT tự implement (HMAC-SHA256) — mock user trong RAM (S1.8 sẽ dùng DB) |
| DB | PostgreSQL + SQLAlchemy async (kích hoạt S3.1) |

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
44444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444
### 4. Kiểm tra môi trường

```bash
python check_env.py
```

Kết quả mong đợi: tất cả package + key bắt buộc đều hiện ✅.
=944444444444444444444
### 5. Khởi tạo database PostgreSQL

> Bắt buộc từ **S3.1+** (DB thật đã được kích hoạt).

```bash
# Tạo database
createdb -U postgres speakbuddi

# Bước 1 — Schema cốt lõi (Identity/Auth + Payment/Subscription)
psql -U postgres -d speakbuddi -f db/schema_core.sql

# Bước 2 — Schema learning content (S3.1: level/topic/tag/topic_word)
psql -U postgres -d speakbuddi -f db/schema_learning.sql

# Cấu hình DATABASE_URL trong .env:
# DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/speakbuddi
```

> Cả hai schema đều **idempotent** — chạy lại nhiều lần không gây lỗi.

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
│   ├── __init__.py         # Export get_db()
│   ├── connection.py       # SQLAlchemy async engine (kích hoạt S3.1)
│   ├── schema_core.sql     # PostgreSQL schema: users, user_profile, oauth_account,
│   │                       #   user_session, payment_plan, user_subscription
│   └── schema_learning.sql # S3.1: level, topic, tag, topic_word, topic_word_tag
├── schemas/
│   ├── __init__.py
│   └── learning.py     # Pydantic schemas skeleton (tham chiếu S3.2/S9.1)
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
