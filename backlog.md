# Backlog — speak-buddi v1.1.0

> **Nguồn:** `Project/docs/speak-buddi/SRS_speak-buddi_v1.1.0.md` (UC01–UC14, F01–F18, FR-01–FR-20, BR01–BR12, NFR §4).
> **Tracking tiến độ:** xem [`progress.json`](./progress.json).
> **Trạng thái story:** `todo` | `in_progress` | `review` | `done` | `blocked`
> **Ưu tiên:** `P0` = chặn việc khác · `P1` = chính (must-have) · `P2` = phụ.

## Quy ước
- **Epic** = module/nhóm tính năng lớn (bám theo use case + feature trong SRS).
- **Story** = đơn vị giao việc nhỏ nhất để code.
- Mỗi story ghi rõ: mô tả, AC nguồn (theo SRS), ưu tiên.
- NFR (responsive, security, logging, performance, backup, monitoring) áp cho **mọi** story — xem **Epic 0**.

## Đối chiếu SRS (coverage)
- 14/14 use case (UC01–UC14) đã có story.
- 18/18 feature (F01–F18) đã có story.
- 12/12 business rule (BR01–BR12) đã ánh xạ.
- Epic 12 (Compliance & Support) bổ sung từ SRS §4.6/§4.7; riêng S12.3 (support form) là extra-scope ngoài SRS.

---

## Epic 0 — NFR / Hạ tầng (xuyên suốt)
*Không phải epic riêng — là tiêu chí áp cho mọi story. Nguồn: SRS §4.*

- **Responsive:** breakpoints 375 / 768 / 1024 / 1440px, touch target ≥ 44px, WCAG 2.1 AA (§4.8).
- **Security:** HTTPS, hash password, phân quyền theo role + subscription, không log secret/token/audio (§4.5).
- **Logging/Audit:** auth, payment, admin action, external API error (§4.5).
- **Monitoring/Alert:** uptime, error rate, latency, external API, crawler status (§4.10).
- **Backup:** full tuần / incremental ngày, RPO 24h, RTO 8h (§4.4).
- **Performance P95:** page < 3s, API < 1s, translate < 2s, quiz < 2s, AI text < 8s, TTS < 10s (§4.1).

---

## Epic 1 — Nền tảng & Xác thực
*UC01, UC02 · F01, F02 · BR01 · FR-01, FR-02*

| Story | Mô tả | AC nguồn | Ưu tiên |
|---|---|---|---|
| S1.1 | Setup dự án: repo, tech stack, cấu trúc folder, kết nối DB, base layout responsive | NFR §4.8 | P0 |
| S1.2 | Trang landing + pricing công khai (Guest xem không cần login) | AC-01-01/02 | P1 |
| S1.3 | Chặn Guest truy cập tính năng học → redirect login | AC-01-03, BR01 | P1 |
| S1.4 | Đăng ký bằng email/password + validation | AC-02-01, §5.2 | P0 |
| S1.5 | Đăng nhập + xử lý sai thông tin + JWT access/refresh token | AC-02-02, §4.5 | P0 |
| S1.6 | Google OAuth (login/link account) | AC-02-03 | P1 |
| S1.7 | Quên/reset mật khẩu qua email (Resend) | AC-02-04 | P1 |
| S1.8 | Phân quyền theo role (student/admin) + trạng thái subscription | §4.5 | P0 |

## Epic 2 — Onboarding & Lộ trình học
*UC03, UC04 · F03, F04 · BR09 · FR-03, FR-04*

| Story | Mô tả | AC nguồn | Ưu tiên |
|---|---|---|---|
| S2.1 | Form onboarding + chọn level A1–C2 + validation bắt buộc | AC-03-01/03, §5.2 | P0 |
| S2.2 | Sinh roadmap cá nhân hóa từ level + mục tiêu học | AC-03-02 | P1 |
| S2.3 | Cập nhật level trong profile → roadmap tương lai dùng level mới | AC-03-04, BR09 | P2 |
| S2.4 | Màn hình xem roadmap theo level (kèm empty state) | AC-04-01/04 | P1 |
| S2.5 | Topic modal: chia session theo words_per_session + tracking progress (user_session_progress) + nút Tiếp tục + truyền data sang AI conversation | AC-03-02, AC-04-01 | P1 |

## Epic 3 — Học từ vựng
*UC05 · F05 · FR-05*

| Story | Mô tả | AC nguồn | Ưu tiên |
|---|---|---|---|
| S3.1 | Data model: level / topic / topic_word / tag (gắn level, soft delete) | §5.3 | P0 |
| S3.2 | Màn hình học từ vựng theo level/topic (từ + nghĩa + ví dụ/grammar) | AC-05-01/02 | P1 |
| S3.3 | Lưu tiến độ học từ/topic | AC-05-03 | P1 |
| S3.4 | Hiển thị nội dung mới sau crawl nhưng giữ tiến độ cũ | AC-05-04 | P2 |

## Epic 4 — Bài kiểm tra từ vựng
*UC06 · F06 · BR08 · FR-06*

| Story | Mô tả | AC nguồn | Ưu tiên |
|---|---|---|---|
| S4.1 | Data model quiz: vocabulary_test, quiz_question/answer, attempt | §5.3 | P0 |
| S4.2 | Các dạng câu hỏi: flashcard, trắc nghiệm, điền khuyết, nối grammar | AC-06-01, §3.4 | P1 |
| S4.3 | Làm bài + chặn nộp khi thiếu đáp án + highlight câu thiếu | AC-06-02, §5.2 | P1 |
| S4.4 | Chấm điểm = đúng/tổng × 100% + lưu attempt | AC-06-03, BR08 | P1 |
| S4.5 | Lọc test theo level/topic + nội dung mới không sửa attempt cũ | AC-06-04 | P2 |

## Epic 5 — Dịch từ
*UC07 · F07 · FR-07*

| Story | Mô tả | AC nguồn | Ưu tiên |
|---|---|---|---|
| S5.1 | Dịch từ English → Vietnamese + validation input rỗng | AC-07-01/02 | P1 |
| S5.2 | Lưu lịch sử dịch (translation_history) | AC-07-03 | P2 |

## Epic 6 — Luyện phát âm
*UC08 · F08 · FR-08*

| Story | Mô tả | AC nguồn | Ưu tiên |
|---|---|---|---|
| S6.1 | Ghi âm qua mic + xử lý lỗi mic (denied/not found/unsupported) | AC-08-01/02, §5.2 | P1 |
| S6.2 | Chấm phát âm + hiển thị feedback/score | AC-08-03 | P1 |
| S6.3 | Lưu audio 30 ngày + metadata/score dài hạn | §4.6 | P2 |

## Epic 7 — Hội thoại AI
*UC09 · F09, F10, F11 · BR02–BR05 · FR-09, FR-10, FR-11*

| Story | Mô tả | AC nguồn | Ưu tiên |
|---|---|---|---|
| S7.1 | Tích hợp Anthropic + ElevenLabs (TTS) + fallback lỗi 502 | AC-09-04, §5.2 | P0 |
| S7.2 | Quota free 15 phút / 5 giờ + reset (ai_quota_window) → 429 | AC-09-01/02, BR02/03 | P1 |
| S7.3 | Paid User hội thoại không giới hạn | AC-09-03, BR05 | P1 |

## Epic 8 — Thanh toán & Subscription
*UC10, UC11 · F12, F13 · BR04, BR06 · FR-12, FR-13*

| Story | Mô tả | AC nguồn | Ưu tiên |
|---|---|---|---|
| S8.1 | Khởi tạo giao dịch + redirect provider | AC-10-01 | P1 |
| S8.2 | Webhook/callback → kích hoạt subscription, set Paid User | AC-10-02, BR04 | P1 |
| S8.3 | Xử lý thất bại/hủy: giữ plan cũ + retry + email | AC-10-03, §5.2 | P1 |
| S8.4 | Paid User chọn/đổi voice/model ElevenLabs; chặn free user | AC-11-01/02/03, BR06 | P2 |

## Epic 9 — Admin: Nội dung & Crawler Langeek
*UC13 · F15, F17, F18 · BR07, BR10–BR12 · FR-15, FR-17, FR-18, FR-19, FR-20*

| Story | Mô tả | AC nguồn | Ưu tiên |
|---|---|---|---|
| S9.1 | Admin CRUD topic/vocabulary/test + validation inline | AC-13-01/02, §5.2 | P0 |
| S9.2 | Soft delete (is_active=false) cho topic/word/test | AC-13-03, §5.3 | P1 |
| S9.3 | Crawler Langeek định kỳ tuần + map A1–C2 + auto-publish | AC-13-04, BR10, FR-18/19 | P1 |
| S9.4 | Fallback khi Langeek lỗi: giữ cache, retry, log, notify Admin | AC-13-05, BR12, FR-20 | P1 |
| S9.5 | Admin chỉnh/disable nội dung đã crawl + giữ lịch sử crawl | AC-13-06, BR11 | P2 |

## Epic 10 — Admin: Gói thanh toán
*UC14 · F16 · FR-16*

| Story | Mô tả | AC nguồn | Ưu tiên |
|---|---|---|---|
| S10.1 | CRUD payment plan + validation (giá > 0, ≥1 feature) | AC-14-01/02, §5.2 | P1 |
| S10.2 | Soft delete payment plan | AC-14-03 | P2 |

## Epic 11 — Admin: Phân tích & Báo cáo
*UC12 · F14 · FR-14*

| Story | Mô tả | AC nguồn | Ưu tiên |
|---|---|---|---|
| S11.1 | Dashboard: doanh thu, user, learning, AI usage | AC-12-01, §3.6 | P2 |
| S11.2 | Lọc doanh thu theo ngày/tháng/năm/gói | AC-12-02 | P2 |
| S11.3 | Export Excel/PDF + lưu lịch sử export | AC-12-03 | P2 |

## Epic 12 — Compliance & Support *(bổ sung để khớp SRS)*
*SRS §4.6, §4.7 — backlog gốc chưa tách story riêng. S12.3 là extra-scope ngoài SRS.*

| Story | Mô tả | AC nguồn | Ưu tiên |
|---|---|---|---|
| S12.1 | Trang Privacy Policy + Terms of Service (công khai) | §4.7 | P1 |
| S12.2 | Người dùng yêu cầu xóa dữ liệu cá nhân | §4.7, §4.6 | P2 |
| S12.3 | Form liên hệ / hỗ trợ + support email | extra-scope (ngoài SRS) | P2 |

---

## Thứ tự build & chia 3 người

**Tuần 1 (làm chung):** Epic 1 + DB schema cốt lõi (S3.1, S4.1) — nền tảng mọi người phụ thuộc.

Sau đó song song:

| Người | Epic phụ trách |
|---|---|
| **Dev A** (Frontend/Learning) | Epic 2, 3, 4, 5 |
| **Dev B** (AI/Speaking/Payment) | Epic 6, 7, 8 |
| **Dev C** (Admin/Backend/Crawler) | Epic 9, 10, 11, 12 |

> Lưu ý: Epic 9 (crawler) cấp dữ liệu cho Epic 3/4 → Dev C nên làm S9.1/S9.2 sớm để Dev A có data test.

---

## Tổng hợp
- Tổng: **12 epic, 46 story** (chưa tính Epic 0 xuyên suốt).
- **P0 (chặn):** S1.1, S1.4, S1.5, S1.8, S2.1, S3.1, S4.1, S7.1, S9.1.
- Trạng thái khởi tạo: tất cả `todo` (0% hoàn thành) — cập nhật tại [`progress.json`](./progress.json).
