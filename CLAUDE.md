# CLAUDE.md — speak-buddi (monorepo umbrella)

Hướng dẫn cho Claude Code khi làm việc trong workspace này. Đọc kỹ trước khi chạy bất kỳ command nào.

## 1. Tổng quan dự án

**speak-buddi** là website học tiếng Anh responsive: học từ vựng theo level A1–C2, làm quiz, dịch từ, luyện phát âm, và **hội thoại với AI**. Có gói trả phí (Paid User), trang Admin (quản lý nội dung, crawler Langeek, gói thanh toán, analytics).

- Bản đặc tả chính thức: [`speak-buddi-docs/SRS_speak-buddi_v1.1.0.md`](speak-buddi-docs/SRS_speak-buddi_v1.1.0.md) (bản sao cũ ở `Project/docs/speak-buddi/`)
- Backlog (epic/story): [`backlog.md`](backlog.md)
- Tiến độ (nguồn sự thật): [`progress.json`](progress.json)
- **UI mockup (nguồn tham chiếu giao diện):** [`speak-buddi-docs/ui/`](speak-buddi-docs/ui/) — 27 màn hình mockup + design system [`DESIGN.md`](speak-buddi-docs/ui/speak_buddi/DESIGN.md). Xem mục **§6**.

## 2. Cấu trúc workspace

```
EXE201/                           ← project root (chạy Claude Code từ đây)
├── CLAUDE.md                      ← file này
├── backlog.md                    ← 12 epic / 46 story
├── progress.json                 ← trạng thái từng epic & story
├── plan/                         ← output của /plan  (S<x>-plan.md)
├── implement/                    ← log của /implement (S<x>-implement.md)
├── review/                       ← kết quả /review    (S<x>-review.md)
├── .claude/
│   ├── agents/                   ← planner, developer, reviewer
│   └── commands/                 ← /plan, /implement, /review
├── speak-buddi/                  ← FRONTEND (React 19 + Vite 8; npm "name" nội bộ là "speak--buddi")
├── speak-buddi-be/               ← BACKEND (FastAPI; có .git repo riêng lồng bên trong)
├── speak-buddi-scrape/           ← Playwright scraper (crawler Langeek — UC13/F18; mới scaffold, chưa có code crawl)
├── speak-buddi-docs/             ← SRS + UI mockup (nguồn chính đang dùng)
│   ├── SRS_speak-buddi_v1.1.0.md
│   └── ui/                       ← 27 màn hình mockup (mỗi màn: code.html + screen.png)
│       └── speak_buddi/DESIGN.md ← design system (màu, font, spacing, component)
└── Project/docs/speak-buddi/     ← bản sao docs cũ (SRS, diagrams, schema) — KHÔNG có folder ui
```

> ⚠️ **Backend `speak-buddi-be/` là repo Git riêng** (có `.git` lồng bên trong) → commit/push tách biệt với frontend. Backend hiện **tối giản**: chỉ có `/health`, `/speak`, `/tts`, `/api/auth/login`, `/api/auth/me` (mock user trong RAM), chưa có DB/Resend/Payment/Langeek thật — các phần đó sẽ build dần theo SRS. Frontend gọi backend qua REST API.

> ⚠️ Slash command & subagent chỉ được nhận diện khi Claude Code mở với **EXE201** là thư mục gốc. Nếu đang ở thư mục con, chạy `/add-dir ..` hoặc mở lại session tại root.

> ⚠️ Có **2 thư mục docs**: `speak-buddi-docs/` (bản chính, có UI mockup) và `Project/docs/speak-buddi/` (bản sao cũ). Ưu tiên dùng `speak-buddi-docs/`.

## 3. Tech stack

| | Frontend (`speak-buddi/`) | Backend (`speak-buddi-be/`) |
|---|---|---|
| Ngôn ngữ | JavaScript (ESM) | Python 3 |
| Core | React 19 + Vite 8 | FastAPI + Uvicorn |
| Routing/UI | react-router-dom 7, Bootstrap 5, react-bootstrap, react-icons, recharts | Pydantic, CORSMiddleware |
| Tích hợp ngoài | gọi REST API backend | Anthropic (claude-haiku-4-5), ElevenLabs TTS, (Resend, Payment, Langeek — theo SRS) |
| Auth | JWT lưu client | JWT tự ký (HMAC-SHA256) |

Lệnh thường dùng:
- FE: `cd speak-buddi && npm install && npm run dev` (lint: `npm run lint`)
- BE: `cd speak-buddi-be && uvicorn main:app --reload --port 8000` (check env: `python check_env.py`)

## 4. Quy ước code
- Viết code khớp phong cách file xung quanh (đặt tên, comment, idiom). FE theo React functional + hooks; BE theo FastAPI route + Pydantic model + helper thuần.
- Không commit/push trừ khi user yêu cầu rõ.
- Không log password/token/secret/audio (SRS §4.5).
- UI tiếng Việt; nội dung học tiếng Anh + giải thích tiếng Việt.
- **Khi code giao diện (FE), BẮT BUỘC bám mockup trong [`speak-buddi-docs/ui/`](speak-buddi-docs/ui/) và design system [`DESIGN.md`](speak-buddi-docs/ui/speak_buddi/DESIGN.md)** — xem mục **§6**. Mockup là HTML/Tailwind tham chiếu; chuyển sang React + Bootstrap nhưng giữ đúng layout, màu, typography, component spec.

---

## 5. Workflow: plan → implement → review

Mỗi story đi qua 3 giai đoạn, mỗi giai đoạn = 1 slash command gọi 1 agent tương ứng, sinh ra 1 artifact, và **cập nhật `progress.json`**.

| Command | Agent | Artifact | Story status sau khi chạy |
|---|---|---|---|
| `/plan <story-id>` | `planner` | `plan/<id>-plan.md` | `todo` → `in_progress` |
| `/implement <story-id>` | `developer` | `implement/<id>-implement.md` + code thật trong FE/BE | `in_progress` → `review` |

> ⚠️ **Khi `/implement` story có giao diện:** `developer` agent phải mở mockup tương ứng trong [`speak-buddi-docs/ui/`](speak-buddi-docs/ui/) (đọc `code.html` + xem `screen.png`) và tuân theo [`DESIGN.md`](speak-buddi-docs/ui/speak_buddi/DESIGN.md) trước khi viết FE. Ghi rõ màn UI đã tham chiếu vào log `implement/<id>-implement.md`. Bảng ánh xạ story → màn UI ở **§6**.
| `/review <story-id>` | `reviewer` | `review/<id>-review.md` | `review` → `done` (PASS) hoặc `in_progress` (CHANGES) |

Ví dụ: `/plan S1.4` → `/implement S1.4` → `/review S1.4`.

### 5.1 Hợp đồng cập nhật `progress.json` (BẮT BUỘC sau mỗi command)

Sau khi agent tạo xong artifact, **luồng chính phải cập nhật `progress.json`** theo đúng các bước sau:

1. Tìm `story` theo `id` trong `epics[].stories[]`.
2. Cập nhật `story.status` theo bảng ở mục 5.
3. Ghi đường dẫn artifact vào `story.artifacts` (tạo object nếu chưa có):
   ```json
   "artifacts": { "plan": "plan/S1.4-plan.md", "implement": "", "review": "" }
   ```
4. Set `story.updatedAt` = ngày hiện tại (YYYY-MM-DD).
5. Với `/review`: nếu verdict = `PASS` → `done`; nếu `CHANGES_REQUESTED`/`FAIL` → `in_progress` và ghi tóm tắt vào `story.notes`.
6. **Tính lại epic chứa story:**
   - `epic.progressPercent = round(số story 'done' / tổng story trong epic × 100)`.
   - `epic.status`: `done` nếu mọi story `done`; `in_progress` nếu có ít nhất 1 story khác `todo`; ngược lại `todo`.
7. **Tính lại `summary`:**
   - `byStatus`: đếm lại theo toàn bộ story.
   - `completedStories` = tổng story `done`.
   - `progressPercent = round(completedStories / totalStories × 100)`.
8. Set `progress.lastUpdated` = ngày hiện tại.
9. Giữ nguyên định dạng JSON (2 space indent), không xoá field có sẵn.

> `progress.json` là **nguồn sự thật duy nhất** về tiến độ. `backlog.md` chỉ mô tả tĩnh, không sửa khi chạy command.

### 5.2 Trạng thái hợp lệ
`todo` · `in_progress` · `review` · `done` · `blocked`
Nếu một story bị chặn (thiếu dependency, chờ quyết định), set `blocked` + lý do trong `notes`, không tự ý bỏ qua.

---

## 6. UI Reference (mockup)

Mọi màn hình FE đã có mockup sẵn trong [`speak-buddi-docs/ui/`](speak-buddi-docs/ui/). Mỗi màn = 1 folder gồm:
- `code.html` — markup tham chiếu (HTML + Tailwind utility class).
- `screen.png` — ảnh render để so sánh trực quan.

Design system chung: [`speak-buddi-docs/ui/speak_buddi/DESIGN.md`](speak-buddi-docs/ui/speak_buddi/DESIGN.md) — bảng màu (primary indigo `#3525cd`, secondary emerald `#006c49`, Pro gold gradient), font **Be Vietnam Pro**, spacing 4px baseline, radius, component spec (button/badge/card/input/nav/toast).

### 6.1 Quy tắc dùng mockup khi `/implement`
1. **Trước khi code FE**, mở `code.html` của màn tương ứng + xem `screen.png`.
2. Mockup là HTML/Tailwind → **port sang React + Bootstrap** (stack thật của dự án), **giữ đúng**: layout, thứ tự khối, màu, typography, spacing, trạng thái component (hover/active/error).
3. Tuân `DESIGN.md` cho mọi giá trị màu/font/spacing — không tự chế palette mới.
4. Giữ responsive theo breakpoint SRS §4.8 (375/768/1024/1440), touch target ≥ 44px.
5. Ghi tên màn UI đã tham chiếu vào `implement/<id>-implement.md`.
6. Nếu story không có mockup tương ứng (vd: schema/data model, webhook, crawler backend) → bỏ qua bước UI, ghi rõ "không có màn UI" trong log.

### 6.2 Ánh xạ story → màn UI

| Story | Màn UI (`speak-buddi-docs/ui/<folder>`) |
|---|---|
| S1.2 Landing + pricing | `landing_page_desktop`, `pricing_page_desktop` |
| S1.4 Đăng ký | `register_page_desktop` |
| S1.5 Đăng nhập | `login_page_desktop` |
| S1.7 Quên/reset mật khẩu | `quen_mat_khau_desktop`, `thiet_lap_mat_khau_desktop` |
| S2.1 Onboarding + chọn level | `onboarding_chon_trinh_do_desktop`, `onboarding_chon_muc_tieu_desktop`, `onboarding_chon_so_thich_desktop` |
| S2.3 Cập nhật level/profile | `ho_so_cai_dat_desktop` |
| S2.4 Roadmap | `lo_trinh_hoc_tap_snake_style` |
| S3.2 Học từ vựng | `hoc_tu_vung_desktop` |
| S4.2 Các dạng câu hỏi | `bai_kiem_tra_desktop`, `bai_kiem_tra_flashcard_desktop`, `bai_kiem_tra_dien_tu_vao_cho_trong_desktop`, `bai_kiem_tra_sap_xep_ngu_phap_desktop` |
| S4.4 Kết quả + chấm điểm | `ket_qua_kiem_tra_desktop` |
| S5.1 Dịch từ | `dich_thuat_desktop` |
| S6.1/S6.2 Luyện phát âm | `luyen_phat_am_desktop` |
| S7.x Hội thoại AI | `hoi_thoai_ai_desktop` |
| S8.3 Kết quả thanh toán | `thanh_toan_thanh_cong_desktop`, `thanh_toan_that_bai_desktop` |
| S8.4 Đổi voice/model | `cai_dat_giong_doc_desktop` |
| S9.1 Admin CRUD nội dung | `quan_li_tu_vung_admin`, `quan_li_chu_de_admin`, `quan_li_bai_kiem_tra_danh_sach_admin`, `quan_li_cau_hoi_dap_an_admin` |
| S9.3/S9.4 Crawler Langeek | `langeek_crawler_admin` |
| S10.1 Gói thanh toán | `quan_li_goi_thanh_toan_admin` |
| S11.1 Dashboard admin | `dashboard_quan_tri_desktop` |
| S11.3 Export báo cáo | `bao_cao_xuat_file_admin` |

> Story không xuất hiện trong bảng (S1.1, S1.3, S1.6, S1.8, S2.2, S3.1/3.3/3.4, S4.1/4.3/4.5, S5.2, S6.3, S7.1–7.3 backend, S8.1/8.2, S9.2/9.5, S10.2, S11.2, S12.x) là logic/backend/biến thể của màn đã có — tái dùng mockup gần nhất hoặc không cần UI mới.
