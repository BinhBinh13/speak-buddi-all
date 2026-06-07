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

### 4. Kiểm tra môi trường

```bash
python check_env.py
```

Kết quả mong đợi: tất cả package + key bắt buộc đều hiện ✅.

### 5. Khởi tạo database PostgreSQL

> Bắt buộc từ **S3.1+** (DB thật đã được kích hoạt).

```bash
# Tạo database
createdb -U postgres speakbuddi

# Bước 1 — Schema cốt lõi (Identity/Auth + Payment/Subscription)
psql -U postgres -d speakbuddi -f db/schema_core.sql

# Bước 2 — Schema learning content (S3.1: level/topic/tag/topic_word)
psql -U postgres -d speakbuddi -f db/schema_learning.sql

# Bước 3 — Schema tiến độ học (S3.3: user_word_progress)
psql -U postgres -d speakbuddi -f db/schema_progress.sql

# Bước 4 — Schema quiz/test (S4.1: vocabulary_test, quiz_question, quiz_answer,
#           quiz_attempt, quiz_attempt_answer)
psql -U postgres -d speakbuddi -f db/schema_quiz.sql

# Bước 5 — Schema payment bổ sung (S8.1: payment_transaction)
psql -U postgres -d speakbuddi -f db/schema_payment.sql

# Bước 6 — Schema voice/preference (S8.4: elevenlabs_voice_model, user_voice_preference)
psql -U postgres -d speakbuddi -f db/schema_voice.sql

# Cấu hình DATABASE_URL trong .env:
# DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/speakbuddi
```

> Tất cả schema đều **idempotent** — chạy lại nhiều lần không gây lỗi.

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
| POST | `/api/payment/checkout` | Khởi tạo giao dịch thanh toán + redirect provider (S8.1, AC-10-01) |
| GET  | `/api/payment/plans` | Danh sách gói trả phí đang active (cho FE pricing lấy `plan_id`) |
| POST | `/api/payment/webhook/{provider}` | Webhook/callback provider → kích hoạt subscription, set Paid User (S8.2, AC-10-02). `provider` ∈ `sepay`\|`mock`. KHÔNG dùng JWT user — xác thực qua API key/signature riêng của provider |
| POST | `/api/payment/cancel` | Hủy giao dịch `pending` chủ động (client-driven — Sepay không gửi webhook fail/cancel). Giữ nguyên subscription cũ + gửi email thông báo (S8.3, AC-10-03) |
| GET  | `/api/payment/transaction/{id}` | Tra trạng thái 1 giao dịch (`status`/`failure_reason`) cho màn kết quả thanh toán, lọc theo user (S8.3, AC-10-03) |
| GET  | `/api/voice/models` | Danh sách voice ElevenLabs active — Paid User only (S8.4, AC-11-01) |
| GET  | `/api/voice/preference` | Preference voice hiện tại của Paid User (S8.4) |
| PUT  | `/api/voice/preference` | Lưu voice preference (S8.4, AC-11-02) |

---

## Cấu trúc thư mục

```
speak-buddi-be/
├── main.py             # FastAPI app + routes + mock auth
├── db/
│   ├── __init__.py         # Export get_db()
│   ├── connection.py       # SQLAlchemy async engine (kích hoạt S3.1)
│   ├── schema_core.sql     # S1.1: users, user_profile, oauth_account,
│   │                       #   user_session, payment_plan, user_subscription
│   ├── schema_learning.sql # S3.1: level, topic, tag, topic_word, topic_word_tag
│   ├── schema_progress.sql # S3.3: user_word_progress
│   ├── schema_quiz.sql     # S4.1: vocabulary_test, quiz_question, quiz_answer,
│   │                       #   quiz_attempt, quiz_attempt_answer
│   └── schema_payment.sql  # S8.1: payment_transaction (+ index, trigger)
├── repositories/
│   ├── __init__.py
│   ├── user_repo.py    # CRUD users, oauth, password_reset
│   ├── quiz_repo.py    # S4.1: CRUD quiz tables (raw SQL async)
│   ├── payment_repo.py # S8.1+S8.2+S8.3: payment_plan / payment_transaction (raw SQL async)
│   └── subscription_repo.py # S8.2: user_subscription — activate_subscription/get_active_subscription
├── services/
│   ├── __init__.py
│   ├── ai_service.py   # Claude AI conversation
│   ├── tts_service.py  # ElevenLabs TTS
│   ├── email_service.py
│   ├── google_auth.py
│   ├── quiz_service.py # S4.1: calculate_score, check_fill_blank_answer
│   ├── payment_service.py       # S8.1 start_checkout() + S8.2 handle_webhook() + S8.3 cancel_checkout()/get_transaction_status() — UC10
│   └── payment_providers/       # interface provider-agnostic
│       ├── __init__.py          #   factory get_provider()/get_provider_by_name()
│       ├── base.py              #   PaymentProvider interface, CheckoutResult/CallbackResult
│       ├── mock_provider.py     #   MockPaymentProvider — dev/QA end-to-end (mặc định)
│       └── sepay_provider.py    #   SepayProvider (S8.2) — provider chính thức (PO chốt)
├── schemas/
│   ├── __init__.py
│   ├── learning.py     # Pydantic schemas S3.1/S3.3
│   ├── quiz.py         # S4.1: Pydantic schemas quiz (skeleton)
│   └── payment.py      # S8.1 CheckoutRequest/Response, PaymentPlanOut + S8.2 WebhookResponse + S8.3 CancelRequest/Response, TransactionStatusOut
├── requirements.txt    # Pin version dependencies
├── .env.example        # Template biến môi trường (không có secret thật)
├── check_env.py        # Kiểm tra package + env key
└── README.md
```

---

## Webhook thanh toán (S8.2 — Sepay)

`POST /api/payment/webhook/{provider}` nhận callback từ payment provider khi
thanh toán thành công (AC-10-02). Provider chính thức đã chốt = **Sepay**
(PO 2026-06-07) — dịch vụ đối soát chuyển khoản ngân hàng qua VietQR.

**Cấu hình webhook URL trong dashboard Sepay** (https://my.sepay.vn):
1. Vào mục **Tích hợp / Webhook** → thêm endpoint:
   `https://<domain-backend>/api/payment/webhook/sepay`
2. Tạo **API Key** cho webhook → điền vào `.env`: `SEPAY_WEBHOOK_API_KEY=<key>`
   (Sepay gửi header `Authorization: Apikey <key>` — backend xác thực khớp
   tuyệt đối, sai → 401, không log giá trị key).
3. Cấu hình quy ước tách **mã thanh toán** (`code`) từ nội dung chuyển khoản
   theo prefix `SEPAY_PAYMENT_PREFIX` (mặc định `SB`) — ví dụ regex `SB[0-9A-F]{8}`.
4. Điền `SEPAY_ACCOUNT_NUMBER` / `SEPAY_BANK_CODE` (số tài khoản & mã ngân hàng
   nhận tiền) — dùng để hiển thị VietQR cho người dùng ở màn thanh toán.

> Test dev/QA không cần Sepay thật: đặt `PAYMENT_PROVIDER=mock`, dùng
> `MockPaymentProvider` — màn `/payment/mock` có 2 nút "Giả lập thành công/thất
> bại" gọi thẳng `POST /api/payment/webhook/mock` để chạy hết luồng AC-10-02
> end-to-end (kích hoạt `user_subscription`, set Paid User) mà không cần
> credential Sepay thật.
>
> **Lưu ý:** `SEPAY_WEBHOOK_API_KEY`/số tài khoản/quy ước prefix là **giả định
> chờ PO xác nhận** trước khi tích hợp Sepay sandbox/production thật — xem
> `implement/S8.2-implement.md` mục "Ngoài phạm vi / TODO".

### Hủy / thất bại thanh toán (S8.3 — AC-10-03)

Vì Sepay chỉ đối soát chuyển khoản **thành công** (`transferType="in"` — không
bao giờ bắn webhook fail/cancel), nhánh "thất bại/hủy" là **client-driven**:

- `POST /api/payment/cancel` — user chủ động báo hủy giao dịch `pending`
  (bấm "Hủy" / rời màn thanh toán). Giữ nguyên `user_subscription` hiện tại
  (KHÔNG downgrade) + gửi email thông báo qua `send_payment_failed_email()`
  (tái dùng Gmail SMTP có sẵn — `email_service.py`, skip an toàn nếu thiếu
  `SMTP_USER`/`SMTP_PASS`).
- `GET /api/payment/transaction/{id}` — màn `PaymentResultPage` (FE) gọi để
  lấy `status`/`failure_reason` thật, hiển thị thông điệp
  `❌ Thanh toán không thành công. Lý do: [reason]` (§5.2).
- Nhánh `failed`/`cancelled` trong `handle_webhook()` cũng gửi email tương tự
  (cho mock + tương lai provider có callback fail).

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
