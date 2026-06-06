# Requirements Summary — speak-buddi

**Project Name:** `speak-buddi`  
**Document Type:** Requirements Summary for SRS Phase 1  
**Target SRS Version:** `v1.1.0`  
**Status:** Approved — requirements locked; updated by delta `CHG-20260606-001`  
**Requirement Approval:** Approved by user confirmation `XÁC NHẬN` in session. Diagrams/SRS writing/update may proceed.  
**Related reference schema:** [`db/schema-draft.sql`](db/schema-draft.sql)  
**Change Record:** [`changes/change-20260606T000000-feature.md`](changes/change-20260606T000000-feature.md)

---

## 1. Project Overview

`speak-buddi` is a responsive English learning website designed for students/learners who want to improve vocabulary, pronunciation, speaking reflexes, and English communication ability. The system helps users learn new English vocabulary through topics and tests, translate unfamiliar English words, practice pronunciation, and converse with AI in contexts related to learned vocabulary. In v1.1.0, users manually select their learning level from A1 to C2, and topics/new words are sourced from a scheduled Langeek crawler so roadmap, vocabulary, and activities can be personalized by selected level/topic.

The main goal is to help learners expand vocabulary, improve speaking reflexes, and build confidence in English speaking through an AI-based companion.

---

## 2. Existing System / Prototype and Upgrade Scope

### 2.1 Existing System

`speak-buddi` is an upgrade from an existing prototype.

- Existing prototype has a basic UI.
- Backend already has an AI conversation/speaking feature.
- Existing integrations include:
  - **ElevenLabs API** for voice/text-to-speech related capability.
  - **Anthropic API** for AI conversation/response analysis.
- Current prototype has no production data; no data migration is required.

### 2.2 Feature to Keep from Prototype

- Only the **AI conversation** feature is considered an existing feature to retain and improve.

### 2.3 Upgrade Scope

The v1.0.0 upgrade includes:

- Responsive mobile web experience.
- English word translation.
- Vocabulary tests/learning activities.
- Pronunciation practice.
- Conversations based on newly learned vocabulary.
- Improved AI conversation/speaking experience.
- Payment/subscription feature.
- Admin analytics and content/payment package management.

The v1.1.0 feature delta adds:

- User-selected level A1, A2, B1, B2, C1, or C2 during onboarding/profile.
- Weekly automatic crawl of level-based topics and new words from `https://langeek.co/en-VI/vocab/level-based`.
- Automatic publish of successfully crawled content without Admin pre-approval.
- Cache fallback, retry, logging, and Admin notification when Langeek is down or crawl fails.
- Admin ability to manage crawler/content configuration and edit/disable crawled content after publish.

---

## 3. Business Problem / Opportunity

### 3.1 Problem

Students who want to practice English speaking often need a partner/companion. When studying alone, they have limited opportunities to practice conversations, maintain speaking reflexes, and receive feedback.

### 3.2 Opportunity

`speak-buddi` provides an AI companion for English practice, allowing students to learn vocabulary, practice pronunciation, and speak in topic-based conversations even when they do not have a human partner.

### 3.3 Success Metrics

- Learners improve English speaking reflexes.
- Learners improve speaking ability.
- Number of paid users increases.
- Additional analytics tracked by Admin include revenue, user counts, quiz activity, learning activity, and AI usage.

---

## 4. Actors

| Actor | Type | Description |
|---|---|---|
| Guest | Primary user | User who has not logged in. Can only view public/landing content and register/login. |
| Student/Learner | Primary user | Registered free user who can access learning features with AI quota limits. |
| Paid User | Primary user specialization | Student with an active paid subscription. Has all Student features plus unlimited AI conversation and voice/model selection. |
| Admin | Administrative user | Manages tests, payment plans, vocabulary, topics, crawler/content configuration, and views analytics. |
| Payment Provider | External actor | External payment system used to process payments. Specific provider is TBD. |
| Anthropic API | External actor | AI service used for analyzing student answers and supporting AI conversation. |
| ElevenLabs API | External actor | Voice/TTS service used to generate speech/audio. |
| Resend Email Service | External actor | Email service used for payment/auth/notification emails. |
| Langeek Vocabulary Source | External actor | External level-based vocabulary/topic website used by scheduled crawler as content source. |

---

## 5. Actor Permissions

| Actor | Allowed Actions | Restrictions / Notes |
|---|---|---|
| Guest | View landing page/public UI; view pricing; register; login. | Cannot view roadmap, practice pronunciation, do vocabulary tests, translate words inside learning flow, or use AI conversation. |
| Student/Learner | Select/update A1–C2 level; view personalized roadmap; learn vocabulary; do vocabulary tests; translate English words; practice pronunciation; converse with AI. | AI conversation is limited to **15 minutes per 5 hours**. Cannot change ElevenLabs voice/model. |
| Paid User | All Student features; unlimited AI conversation; select/change ElevenLabs voice/model. | Requires successful payment and active subscription. |
| Admin | View revenue analytics and user counts; manage vocabulary, topics, vocabulary tests, crawler/content configuration, and payment plans. | Crawled content is automatically published; Admin does not approve before publish but can edit/disable content after crawl. |
| Payment Provider | Process payment and return payment result via redirect/webhook/callback. | Does not access learning features. |
| Anthropic API | Analyze student answers and support AI conversation. | Called only by the system backend/API. |
| ElevenLabs API | Generate text-to-speech/audio. | Called only by the system backend/API. |
| Resend | Send email notifications/auth/payment confirmations. | Called only by the system backend/API. |
| Langeek Vocabulary Source | Provides level-based topics and new words for crawler. | Must be accessed according to Terms of Service, robots.txt, copyright/licensing restrictions, and rate limits. |

---

## 6. Features

All listed features are **Must-have** for v1.1.0.

| ID | Feature | Main Actor(s) | Priority |
|---|---|---|---|
| F01 | View landing page/pricing | Guest | Must |
| F02 | Register/login/reset password/OAuth Google | Guest, Student | Must |
| F03 | Complete onboarding/select level to create personalized roadmap | Student | Must |
| F04 | View personalized roadmap by selected level | Student, Paid User | Must |
| F05 | Learn vocabulary/new vocabulary by selected level/topic | Student, Paid User | Must |
| F06 | Do vocabulary tests/activities by selected level/topic | Student, Paid User | Must |
| F07 | Translate English words | Student, Paid User | Must |
| F08 | Practice pronunciation | Student, Paid User | Must |
| F09 | Converse with AI | Student, Paid User | Must |
| F10 | Enforce free Student AI quota: 15 minutes per 5 hours | Student | Must |
| F11 | Unlimited AI conversation for Paid User | Paid User | Must |
| F12 | Paid User changes ElevenLabs voice/model | Paid User | Must |
| F13 | Payment / purchase paid plan | Student, Payment Provider | Must |
| F14 | Admin views revenue/user/learning/AI analytics and exports reports | Admin | Must |
| F15 | Admin manages vocabulary tests | Admin | Must |
| F16 | Admin manages payment plans | Admin | Must |
| F17 | Admin manages vocabulary and topics, including crawled content after publish | Admin | Must |
| F18 | Langeek content crawler/source sync | System, Admin, Langeek Vocabulary Source | Must |

### 6.1 MoSCoW Classification

- **Must-have:** F01–F18.
- **Should-have:** None for v1.1.0.
- **Could-have:** None for v1.1.0.
- **Won't-have:** Native iOS/Android app and public external API. General file import remains out of scope unless needed as a fallback if Langeek crawling is not permitted.

---

## 7. Use Cases

| UC ID | Use Case | Main Actor(s) | Related Features |
|---|---|---|---|
| UC01 | Guest views landing/pricing | Guest | F01 |
| UC02 | User registers/logs in/resets password/OAuth Google | Guest, Student | F02 |
| UC03 | Student selects level during onboarding to create personalized roadmap | Student | F03 |
| UC04 | Student views personalized roadmap by selected level | Student, Paid User | F04, F18 |
| UC05 | Student learns vocabulary by selected level/topic | Student, Paid User | F05, F18 |
| UC06 | Student does vocabulary tests/activities with multiple question types by selected level/topic | Student, Paid User | F06, F18 |
| UC07 | Student translates English words | Student, Paid User | F07 |
| UC08 | Student practices pronunciation | Student, Paid User | F08 |
| UC09 | Student/Paid User converses with AI | Student, Paid User | F09, F10, F11 |
| UC10 | Student purchases paid plan/payment | Student, Payment Provider | F13 |
| UC11 | Paid User changes ElevenLabs voice/model | Paid User | F12 |
| UC12 | Admin views analytics/reporting/export | Admin | F14 |
| UC13 | Admin manages topic/vocabulary/vocabulary tests and crawler content sync | Admin | F15, F17, F18 |
| UC14 | Admin manages payment plans | Admin | F16 |

---

## 8. Onboarding and Personalized Roadmap Requirements

### 8.1 Onboarding Flow

After a Guest registers, the new user must complete onboarding questions and manually select a learning level from A1, A2, B1, B2, C1, or C2 before the system creates the personalized roadmap.

### 8.2 Onboarding Questions

At minimum, onboarding should collect information that supports roadmap creation. Based on discussion and schema basis, expected onboarding fields include:

- Name/nickname or profile name.
- Current English level selected by the user from A1, A2, B1, B2, C1, or C2.
- Learning goal.
- Optional target topic/current topic preference.
- Optional daily learning time, if implemented later.
- Optional topics of interest, if implemented later.

> Note: Exact final UI fields can be refined later, but SRS must require enough onboarding information and selected A1–C2 level to generate a personalized roadmap. v1.1.0 does not require an auto-scored placement test.

### 8.3 Roadmap Generation

- Roadmap is created from onboarding answers and the user-selected A1–C2 level.
- Roadmap should use at least selected level and learning goal.
- Roadmap can be built from ordered level/topic/vocabulary/test data.
- Admin-managed and crawled topics, vocabulary, and tests influence roadmap content.
- If the user updates their selected level in profile/onboarding settings, future roadmap/topic/vocabulary/activity recommendations should use the updated level.

---

## 9. Vocabulary / Topic / Test Requirements

### 9.1 Topics and Vocabulary

- System starts with about **36 topics**.
- Each topic has more than **40 vocabulary words**.
- Topics may include grammar-related content.
- Admin manages topics and vocabulary.
- Soft delete is required for topics and vocabulary via `is_active=false`.
- Topics and vocabulary must be associated with A1, A2, B1, B2, C1, or C2 level context.
- Primary content source for level-based topics and new words is `https://langeek.co/en-VI/vocab/level-based`.
- The system crawls Langeek automatically every week and publishes successfully crawled content without Admin pre-approval.
- Admin can edit or disable crawled topics/vocabulary after publish.
- If Langeek is down or crawl fails, the system keeps the current cached/active content, retries, logs the failure, and notifies Admin.
- Crawling must comply with Langeek Terms of Service, robots.txt, copyright/licensing restrictions, and rate limits. If crawling is not allowed, fallback manual curation/import is required.

### 9.2 Vocabulary Tests / Learning Activities

- Each topic has vocabulary tests/activities for users to learn.
- Each topic has approximately **6–10 quiz/test questions**, depending on vocabulary and grammar content.
- Admin manages vocabulary tests.
- Soft delete is required for vocabulary tests via `is_active=false`.
- Vocabulary tests/activities must be filtered or generated according to the user's selected level and topic.

### 9.3 Question / Activity Types

Vocabulary learning and tests must support diverse question/activity types:

- Flashcard.
- Multiple choice.
- Fill-in-the-blank / missing word.
- Mapping/linking vocabulary to related grammar.

### 9.4 Scoring

- Test score formula: `correct answers / total questions × 100%`.
- For flashcards, whether they are scored or used as learning activity can be finalized in implementation; SRS records that flashcard is required as a supported learning/test activity type.

---

## 10. Business Rules and Calculations

| Rule ID | Rule |
|---|---|
| BR01 | Guest can only view landing/pricing and cannot access learning features. |
| BR02 | Free Student can converse with AI for only **15 minutes per 5 hours**. |
| BR03 | After 5 hours, free Student AI conversation quota resets. |
| BR04 | Successful payment activates Student as Paid User according to purchased plan. |
| BR05 | Paid User can converse with AI without time limit. |
| BR06 | Only Paid User can change ElevenLabs voice/model. |
| BR07 | Admin manages vocabulary tests, payment plans, vocabulary, topics, and crawler/content configuration. |
| BR08 | Test score = `number of correct answers / total questions × 100%`. |
| BR09 | Student-selected level must be one of A1, A2, B1, B2, C1, or C2 and drives roadmap/topic/vocabulary/activity personalization. |
| BR10 | Langeek content sync runs weekly and publishes successfully crawled content automatically without Admin pre-approval. |
| BR11 | Admin may edit or disable crawled content after publish; disabled content must not appear in learner roadmap/vocabulary/tests. |
| BR12 | If Langeek crawl fails, active cached content remains available while the system retries, logs, and notifies Admin. |

No additional separate roadmap business rule is required beyond roadmap being a Must-have feature and being generated from onboarding plus selected A1–C2 level.

---

## 11. Validation and Error Handling

### 11.1 Register / Login

| Case | Validation / Handling | Message |
|---|---|---|
| Email | Required, non-empty, valid email with `@` and domain. | `⚠ Email không hợp lệ.` |
| Password | Required, minimum 8 characters and at least 1 digit. | `⚠ Mật khẩu phải có ít nhất 8 ký tự và 1 chữ số.` |
| Wrong credentials | Reject login and show generic error. | `⚠ Email hoặc mật khẩu không đúng.` |
| Empty fields | Prevent submission. | `⚠ Vui lòng điền đầy đủ thông tin.` |
| Expired token | Redirect to login. | `⚠ Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.` |

### 11.1.1 Onboarding / Level Selection

| Case | Validation / Handling | Message |
|---|---|---|
| Missing selected level | Require user to select one of A1, A2, B1, B2, C1, C2 before roadmap generation. | `⚠ Vui lòng chọn trình độ tiếng Anh của bạn.` |
| Invalid selected level | Reject values outside A1, A2, B1, B2, C1, C2. | `⚠ Trình độ không hợp lệ.` |

### 11.2 Vocabulary Test

| Case | Validation / Handling | Message |
|---|---|---|
| Unanswered questions | Submit button disabled until all questions are answered. | — |
| Submit missing answers | Highlight missing questions with red border and scroll to first missing question. | `⚠ Bạn còn X câu chưa trả lời. Vui lòng hoàn thành trước khi nộp bài.` |

### 11.3 Pronunciation / AI Conversation

| Case | Handling / Message |
|---|---|
| Microphone permission denied | `🎤 Bạn chưa cấp quyền microphone. Vào Settings → trình duyệt → cho phép mic.` |
| No audio detected | `🎤 Không nghe thấy gì. Hãy thử nói lại.` |
| Microphone not found | `🎤 Không tìm thấy microphone. Kiểm tra thiết bị.` |
| Unsupported browser | `🎤 Trình duyệt không hỗ trợ. Vui lòng dùng Chrome hoặc Edge.` |
| Anthropic API error | Backend returns HTTP 502; frontend shows `🔄 AI đang bận, vui lòng thử lại sau vài giây.` |
| ElevenLabs API error | Backend returns HTTP 502; fallback displays text instead of audio: `🔇 Không tạo được âm thanh. Đang hiển thị văn bản thay thế.` |
| Free Student quota exceeded | Backend returns HTTP 429; frontend shows `⏱ Bạn đã dùng hết 15 phút luyện nói. Vui lòng quay lại sau khi quota được reset hoặc nâng lên Pro để luyện không giới hạn.` |

### 11.4 Payment

| Case | Handling / Message |
|---|---|
| Payment success | Redirect confirmation page, update Pro badge, send confirmation email: `🎉 Chào mừng bạn đến với Pro! Tài khoản đã được kích hoạt.` |
| Payment failure/cancel | Keep current plan and show reason: `❌ Thanh toán không thành công. Lý do: [Thẻ bị từ chối / Hết hạn / Hủy bởi người dùng]`; show retry/home buttons. |

### 11.5 Admin Validation

| Data | Validation |
|---|---|
| Vocabulary word | Required, Latin characters only, meaning required, at least one topic selected. |
| Example sentence | Optional; if provided, at least 5 words. |
| Quiz question | Must have 4 answers and exactly 1 correct answer. |
| Topic | Name must be unique; level must be selected from A1, A2, B1, B2, C1, or C2. |
| Payment plan | Name required; price > 0 except Free; duration required; at least 1 feature. |
| Admin errors | Show inline under field, do not use `alert()`, do not clear entered data. |

### 11.6 Langeek Crawler / Content Sync

| Case | Handling / Message |
|---|---|
| Crawl success | Automatically publish mapped A1–C2 topic/new-word content and record crawl history. |
| Langeek unavailable or crawl failed | Keep current cached/active content, retry, log failure, and notify Admin with source URL, failure reason, last successful crawl time, retry status, and cache status. |
| Crawling not legally/technically permitted | Stop automated crawl and fall back to manual curation/import path. |

---

## 12. Reporting / Analytics / Export

| Report Area | Requirement |
|---|---|
| Revenue | Revenue by day/month/year and total revenue. |
| Revenue filter | Filter revenue by payment plan. |
| Users | Total users. |
| User classification | Free users vs paid users. |
| New users | New users by day/month. |
| Learning | Number of quiz/test attempts. |
| Quiz result | Correct/wrong ratio. |
| AI usage | AI conversation duration. |
| Vocabulary popularity | Most learned vocabulary words. |
| Export | Admin can export reports as Excel and PDF. |

No general file import is required for v1.1.0 unless needed as fallback if Langeek crawling is not permitted. Admin manages topics/vocabulary/tests and crawler/content settings through the Admin UI.

---

## 13. Entities and Schema Basis

The entities for SRS are based on the reference schema draft:

- [`docs/speak-buddi/db/schema-draft.sql`](db/schema-draft.sql)

### 13.1 Main Entity Groups

| Group | Entities/Tables |
|---|---|
| Identity/Auth | `users`, `user_profile`, `oauth_account`, `user_session` |
| Learning taxonomy/content | `level`, `topic`, `tag`, `topic_word`, `topic_word_tag`; levels must support A1, A2, B1, B2, C1, C2 |
| Content source/sync | `content_source`, `content_crawl_job`, `content_crawl_log`, or equivalent structures for Langeek URL, schedule, crawl status, source level/topic mapping, retry status, and errors |
| Learning progress | `user_topic_progress`, `user_word_progress` |
| Payment/subscription | `payment_plan`, `user_subscription`, `payment_transaction` |
| Vocabulary tests | `vocabulary_test`, `quiz_question`, `quiz_answer`, `quiz_attempt`, `quiz_attempt_answer` |
| AI quota | `ai_quota_window` |
| Voice/model | `elevenlabs_voice_model`, `user_voice_preference` |
| Speaking/pronunciation | `speaking_session`, `pronunciation_attempt`, `pronunciation_syllable_score` |
| Translation | `translation_history` |
| Reporting export | `report_export_history` |

---

## 14. Relationships / Cardinality / Soft Delete Policy

### 14.1 Key Relationships

- User 1:1 UserProfile.
- User 1:N UserSession.
- User 1:N OAuthAccount.
- User 1:N UserSubscription.
- User 1:N PaymentTransaction.
- PaymentPlan 1:N UserSubscription.
- PaymentPlan 1:N PaymentTransaction.
- Level 1:N Topic.
- Topic 1:N TopicWord.
- TopicWord N:N Tag through TopicWordTag.
- ContentSource 1:N ContentCrawlJob.
- ContentCrawlJob 1:N ContentCrawlLog or equivalent crawl status/error records.
- Crawled content must map to Level/Topic/TopicWord records before publish.
- User 1:N UserTopicProgress.
- User 1:N UserWordProgress.
- Topic 1:N UserTopicProgress.
- TopicWord 1:N UserWordProgress.
- Topic 1:N VocabularyTest.
- VocabularyTest 1:N QuizQuestion.
- QuizQuestion 1:N QuizAnswer.
- User 1:N QuizAttempt.
- VocabularyTest 1:N QuizAttempt.
- QuizAttempt 1:N QuizAttemptAnswer.
- User 1:N SpeakingSession.
- Topic 1:N SpeakingSession.
- TopicWord 1:N SpeakingSession.
- User 1:N AIQuotaWindow.
- AIQuotaWindow 1:N SpeakingSession.
- User 1:N PronunciationAttempt.
- SpeakingSession 1:N PronunciationAttempt.
- PronunciationAttempt 1:N PronunciationSyllableScore.
- ElevenLabsVoiceModel 1:N UserVoicePreference.
- User 1:1 UserVoicePreference.
- User 1:N TranslationHistory.
- Admin User 1:N ReportExportHistory.

### 14.2 Soft Delete Policy

Soft delete via `is_active=false` is required for:

- `topic`
- `topic_word`
- `vocabulary_test`
- `payment_plan`

Hard delete may be used only for draft/unlinked data if needed.

---

## 15. Data Volume / Growth / Storage

| Area | Requirement / Estimate |
|---|---|
| Initial users | 0 users. |
| Expected users | About 200 users in 6–12 months. |
| Levels | A1, A2, B1, B2, C1, C2. |
| Topics | About 36 topics initially. |
| Vocabulary | More than 40 words per topic. |
| Grammar | Topics may include grammar content. |
| Quiz/test | 6–10 multiple-choice/learning questions per topic, depending on vocabulary/grammar. |
| AI usage | Average 15 minutes/user/day. |
| Peak concurrency | 20 concurrent users for v1.1.0. |
| Content crawl | Weekly scheduled Langeek crawl; active cached content retained on failure. |

### 15.1 Audio Storage Policy

- Store pronunciation attempt audio for **30 days**.
- Store metadata/scores longer, e.g. 12 months or account lifetime depending on final policy.
- Do not store full AI conversation audio by default.
- Store transcript/metadata if needed for analytics and learning progress.
- User may request deletion of personal data according to privacy policy.

---

## 16. External Integrations

| Integration | Purpose | Status |
|---|---|---|
| Anthropic API | Analyze student answers and support AI conversation. | Required |
| ElevenLabs API | Generate text-to-speech/voice/audio. | Required |
| Payment Provider | Process payments. | Provider TBD |
| Resend | Send email confirmation/auth/notification. | Required |
| Langeek Vocabulary Source | Source level-based topics/new words for scheduled crawler. | Required for v1.1.0 content sync, subject to ToS/robots/copyright/rate-limit permission |

### 16.1 External API Error Handling

- Anthropic error: show “AI đang bận, thử lại sau”.
- ElevenLabs error: fallback to text instead of audio.
- Payment error: keep current plan and allow retry.
- Email error: log error and retry sending.
- Langeek crawl error: keep cached active content, retry, log failure, and notify Admin.

---

## 17. API Specs and Data Format

| Integration | Data Format | Auth | Notes |
|---|---|---|---|
| Anthropic API | REST/JSON | API Key | Version/model TBD. |
| ElevenLabs API | REST/JSON + audio response | API Key | Voice/model from `elevenlabs_voice_model`. |
| Payment Provider | TBD by provider | TBD by provider | Webhook/callback required for payment confirmation. |
| Resend | REST/JSON | API Key | Used for email sending. |
| Langeek Vocabulary Source | Public web pages; no API confirmed | No API key confirmed | Weekly crawler must comply with ToS, robots.txt, copyright/licensing, and rate limits. |

---

## 18. Data Sync Strategy

| Integration | Sync Mode | Direction |
|---|---|---|
| Anthropic API | Real-time request/response | SpeakBuddi sends prompt/student answer; Anthropic returns analysis/response. |
| ElevenLabs API | Real-time request/response | SpeakBuddi sends text/voice config; ElevenLabs returns audio. |
| Payment Provider | Webhook/callback + redirect | Provider returns payment result; SpeakBuddi updates subscription/Paid User status. |
| Resend | Event-driven | SpeakBuddi sends email events; Resend sends email. |
| Langeek Vocabulary Source | Weekly scheduled crawl | SpeakBuddi crawls level-based topics/new words, maps them to A1–C2 levels/topics, and auto-publishes successful sync results. |

---

## 19. Platforms

- Supported:
  - Web browser desktop: Chrome, Edge, Safari, Firefox.
  - Mobile Web responsive.
- Not required for v1.1.0:
  - Native iOS app.
  - Native Android app.
  - Public API for external systems.

---

## 20. Responsive / Accessibility

### 20.1 Responsive

- Responsive-first / mobile-friendly design.
- Breakpoints: 375px, 768px, 1024px, 1440px.
- Touch target minimum: 44x44px on mobile.
- UI must work well on mobile and desktop.

### 20.2 Accessibility

- Target basic WCAG 2.1 AA.
- Keyboard navigation for main forms/buttons.
- Alt text/ARIA labels for important icons/buttons.
- Sufficient color contrast.
- Form errors must be understandable and not rely only on red color.

### 20.3 Design System

- No specific design system required.
- Tailwind/custom components can be used if suitable.

---

## 21. Internationalization / Localization

- UI language: Vietnamese only for v1.1.0.
- Learning content: English with Vietnamese explanations/translations.
- Locale: Vietnam.
- Currency: VND.
- Timezone: Asia/Ho_Chi_Minh.
- No bilingual UI required for v1.1.0.

---

## 22. Non-Functional Requirements (NFRs)

### 22.1 Performance

| Operation | Target |
|---|---|
| Page load | P95 < 3 seconds. |
| Normal API | P95 < 1 second. |
| Translate word | P95 < 2 seconds. |
| Submit quiz/test | P95 < 2 seconds. |
| AI text response | P95 < 8 seconds. |
| ElevenLabs audio | P95 < 10 seconds. |
| Small/medium report export | < 30 seconds. |
| Scheduled Langeek crawl | Background job must not degrade learner-facing P95 targets. |

### 22.2 Scalability / Concurrency

- Support at least 20 concurrent users in v1.1.0.
- Design should be extensible to 100 concurrent users later.
- Complex auto-scaling is not required for v1.1.0.
- Database should index frequently queried tables such as `users`, `topic/topic_word`, `quiz_attempt`, `speaking_session`, `payment_transaction`.
- Audio/files should use object storage or dedicated storage service in production.

### 22.3 Availability / SLA

- SLA target: 99% uptime for v1.1.0/MVP.
- Allowed downtime: about 7.3 hours/month.
- Planned maintenance should occur outside peak hours, e.g. 23:00–05:00 Vietnam time.
- External dependency downtime must not cause user data loss.
- Langeek crawl failure must not remove or hide currently active cached learning content.

### 22.4 Backup / Recovery

- Full database backup weekly.
- Incremental/daily backup daily.
- Daily backup retention: 7 days.
- Weekly backup retention: 4 weeks.
- RPO: maximum data loss 24 hours.
- RTO: restore system within 8 hours after severe incident.
- Audio pronunciation retention follows 30-day policy.
- Metadata/scores included in database backup.
- Crawled content, content-source metadata, and crawl logs included in database backup if stored in database.

---

## 23. Security and Authentication

- Authentication methods:
  - Email + password.
  - Google OAuth.
- 2FA is not required in v1.1.0.
- Password reset via email is required.
- Session/token strategy: JWT/access token + refresh token.
- Security baseline:
  - HTTPS required.
  - Passwords must be hashed.
  - API authorization by role and subscription status.
  - Do not log passwords, tokens, sensitive audio, or secret API keys.
- Roles:
  - `student`
  - `admin`
- Paid User is subscription state, not a separate role.

---

## 24. Compliance and Privacy

### 24.1 Regulatory Compliance

- Privacy Policy and Terms of Service are required.
- Users must be informed about collected data.
- Users may request deletion of personal data.
- Audio is limited by the 30-day storage policy.
- Full GDPR compliance is not required unless the product serves EU users.
- PCI-DSS direct compliance is not required if card data is not stored and payment is delegated to payment provider.
- HIPAA/SOC2/ISO27001 are not required for v1.1.0.

### 24.2 Data Classification

| Classification | Data |
|---|---|
| Public | Landing page, public pricing, product introduction content. |
| Internal | System configuration, crawler configuration, crawl logs, unpublished/disabled topics/vocabulary/tests. |
| Confidential | User profile, selected learning level, email, quiz results, learning progress, AI transcript, translation history, payment transaction metadata. |
| Restricted/Sensitive | Password hash, refresh/session tokens, pronunciation audio, OAuth provider IDs, raw external API payload if stored. |

---

## 25. Audit Trail and Logging

### 25.1 Events to Log

- Authentication: login success/failure, logout, reset password, token/session events.
- Authorization/security: permission denied, AI quota exceeded, paid feature access denied.
- Admin actions: create/update/disable topic, vocabulary, vocabulary test, payment plan.
- Payment: created, success, failed, cancelled, subscription activated/expired.
- External API errors: Anthropic, ElevenLabs, Payment Provider, Resend.

### 25.2 Retention

- Security/auth/payment/admin logs: 12 months.
- Application error logs: 3–6 months.

### 25.3 Privacy Rules

- Do not log password, token, full audio, or secret API key.
- Mask email/token where appropriate.

---

## 26. Deployment / Infrastructure

- Environments: Development + Production.
- Hosting/cloud provider: TBD.
- Database hosting: TBD.
- CI/CD: TBD.
- Region: TBD.

---

## 27. Monitoring / Alerting

### 27.1 Monitoring

- Uptime monitoring.
- Error rate monitoring.
- API latency monitoring.
- Basic database health.
- External API failure monitoring: Anthropic, ElevenLabs, Payment Provider, Resend.
- Content crawler job status and last successful Langeek sync time.

### 27.2 Alerts

- Website down.
- High error rate.
- Abnormal payment failure.
- Continuous Anthropic/ElevenLabs failures.
- Continuous email sending failures.
- Continuous Langeek crawler failures.

### 27.3 Alert Channels

- Email by default.
- Slack/Discord/Zalo TBD if needed later.

---

## 28. Support and Maintenance

- User support through contact form or support email.
- Users can report payment, AI, or account issues.
- Admin can view basic logs/reports.
- Admin can check payment/subscription status.
- Critical bugs affecting main features should be fixed within 24–48 hours.
- Normal bugs are handled through backlog.
- Admin maintains topics, vocabulary, tests, crawler/content configuration, and payment plans through Admin UI.

---

## 29. Constraints, Assumptions, and Risks

### 29.1 Constraints

- System is a responsive website; no native mobile app for v1.1.0.
- Payment Provider is TBD.
- Deployment/infra is TBD.
- UI is Vietnamese only.
- AI depends on Anthropic API.
- Voice/TTS depends on ElevenLabs API.
- Email depends on Resend.
- Content source/crawler depends on Langeek public pages and must comply with Terms of Service, robots.txt, copyright/licensing, and rate limits.

### 29.2 Assumptions

- Users have stable internet and modern browsers.
- Users grant microphone permission for speaking/pronunciation features.
- Admin manages topics, vocabulary, tests, and payment plans through Admin UI.
- Admin manages crawler/content configuration and can edit/disable crawled content after publish.
- Payment Provider supports webhook/callback.
- External APIs have valid API keys.
- Users self-select A1–C2 level; no automatic placement test is required for v1.1.0.
- Langeek level-based pages remain publicly accessible and stable enough for weekly crawling.

### 29.3 Risks

- Anthropic/ElevenLabs outage or slowness affects speaking experience.
- AI/TTS cost increases with usage.
- Payment Provider TBD may impact payment integration timeline.
- Audio storage requires privacy and storage cost control.
- Free Student quota requires clear UX to avoid frustration.
- Langeek site structure, availability, licensing, robots.txt, or Terms of Service may prevent or break crawler operation.
- Automatic publish of crawled content may expose incorrect or duplicated vocabulary if validation/deduplication is weak.

---

## 30. Acceptance Criteria Outline

Acceptance Criteria use Given–When–Then format and will be expanded in final SRS.

### UC01 — Guest views landing/pricing

- **AC01:** Given a Guest opens the website, when the landing page loads, then the system displays public introduction content without requiring login.
- **AC02:** Given a Guest views pricing, when the pricing section loads, then the system displays available public payment plan information.
- **AC03:** Given a Guest attempts to access learning features, when the request is made, then the system blocks access and prompts the user to login/register.

### UC02 — User registers/logs in/resets password/OAuth Google

- **AC01:** Given a Guest enters valid email/password data, when registration is submitted, then the system creates a Student account.
- **AC02:** Given a user enters wrong login credentials, when login is submitted, then the system shows `Email hoặc mật khẩu không đúng` and does not log the user in.
- **AC03:** Given a user chooses Google OAuth, when OAuth succeeds, then the system logs the user in or creates a linked account.
- **AC04:** Given a user requests password reset, when a valid email is provided, then the system sends a reset email through Resend.

### UC03 — Student selects level during onboarding to create personalized roadmap

- **AC01:** Given a newly registered Student has not completed onboarding, when they access the app, then the system prompts them to select A1, A2, B1, B2, C1, or C2 and answer required onboarding questions before showing the roadmap.
- **AC02:** Given the Student selects a valid A1–C2 level and submits required onboarding answers, when the submission is valid, then the system saves the selected level and creates a personalized roadmap based on active content for that level.
- **AC03:** Given selected level or required onboarding data is missing or invalid, when the Student submits, then the system highlights missing/invalid fields and prevents roadmap generation.
- **AC04:** Given a Student updates selected level in profile/onboarding settings, when the change is saved, then future roadmap/topic/vocabulary/activity recommendations use the updated level.

### UC04 — Student views personalized roadmap

- **AC01:** Given a Student has completed onboarding and selected an A1–C2 level, when they open roadmap, then the system displays a personalized learning roadmap with topics matching the selected level.
- **AC02:** Given roadmap content is based on active level/topic/vocabulary/test content, when weekly crawled or Admin-managed content is active, then the roadmap reflects active content for the user’s selected level.
- **AC03:** Given a Guest attempts to view roadmap, when the request is made, then the system blocks access and requires login.
- **AC04:** Given no active topic exists for the selected level, when the Student opens roadmap, then the system shows an empty/fallback state without deleting selected level or progress.

### UC05 — Student learns vocabulary by topic

- **AC01:** Given a Student opens a topic that belongs to their selected level, when active vocabulary exists from crawled or Admin-managed content, then the system displays vocabulary/new words and meanings for that level/topic.
- **AC02:** Given a vocabulary word has example/grammar-related content, when the user views the word, then the system shows relevant learning information.
- **AC03:** Given the Student studies vocabulary, when progress is saved, then the system updates word/topic progress with level and topic context.
- **AC04:** Given crawled vocabulary is updated by the weekly sync, when the Student opens the topic after publish, then the system displays the latest active vocabulary while preserving historical learning progress.

### UC06 — Student does vocabulary tests/activities with multiple question types

- **AC01:** Given a Student opens a topic test/activity for their selected level, when questions exist, then the system displays supported activities including flashcard, multiple choice, fill-in-the-blank, and grammar mapping where available.
- **AC02:** Given a Student has not answered all required questions, when they try to submit, then submission is disabled or missing answers are highlighted.
- **AC03:** Given a Student submits a completed test, when answers are evaluated, then score is calculated as `correct answers / total questions × 100%`.
- **AC04:** Given the weekly content sync updates vocabulary for a level/topic, when new activities are generated or selected, then they use the latest active vocabulary without modifying previous attempt results.

### UC07 — Student translates English words

- **AC01:** Given a Student enters an English word, when translation is requested, then the system returns Vietnamese meaning/translation.
- **AC02:** Given input is empty or invalid, when translation is submitted, then the system shows a validation message.
- **AC03:** Given translation history is enabled, when translation succeeds, then the system stores translation history for the Student.

### UC08 — Student practices pronunciation

- **AC01:** Given a Student starts pronunciation practice, when microphone permission is granted, then the system records/accepts audio for scoring.
- **AC02:** Given microphone is denied/not found, when practice starts, then the system shows the appropriate microphone error message.
- **AC03:** Given pronunciation scoring succeeds, when feedback is returned, then the system displays score/feedback and stores metadata/score.

### UC09 — Student/Paid User converses with AI

- **AC01:** Given a free Student has remaining quota, when they start AI conversation, then the system allows conversation and counts usage time.
- **AC02:** Given a free Student has used 15 minutes in the current 5-hour window, when they try to continue, then the system returns quota exceeded and prompts upgrade/wait.
- **AC03:** Given a Paid User starts AI conversation, when they converse with AI, then no 15-minute quota is applied.
- **AC04:** Given Anthropic or ElevenLabs fails, when the conversation needs the failed service, then the system displays fallback/error handling without losing user data.

### UC10 — Student purchases paid plan/payment

- **AC01:** Given a Student selects a paid plan, when they proceed to payment, then the system creates a payment transaction and redirects/initiates provider flow.
- **AC02:** Given payment succeeds, when webhook/callback is received, then the system activates the subscription and marks the user as Paid User.
- **AC03:** Given payment fails or is cancelled, when the result is received, then the system keeps the current plan and shows retry/home options.

### UC11 — Paid User changes ElevenLabs voice/model

- **AC01:** Given a Paid User opens voice settings, when active voice models exist, then the system displays available ElevenLabs voice/model options.
- **AC02:** Given a Paid User selects a voice/model, when saved, then the system stores the user voice preference.
- **AC03:** Given a free Student attempts to change voice/model, when the request is made, then the system denies access and prompts upgrade.

### UC12 — Admin views analytics/reporting/export

- **AC01:** Given Admin opens analytics, when data exists, then the system shows revenue, user, learning, and AI usage metrics.
- **AC02:** Given Admin filters revenue by date/plan, when the filter is applied, then the system displays matching revenue data.
- **AC03:** Given Admin requests export, when the report is generated, then the system provides Excel/PDF output and records export history.

### UC13 — Admin manages topic/vocabulary/vocabulary tests and crawler content sync

- **AC01:** Given Admin creates/updates topic or vocabulary with valid data, when submitted, then the system saves the content.
- **AC02:** Given Admin enters invalid content such as duplicate topic name or missing required fields, when submitted, then the system shows inline validation errors.
- **AC03:** Given Admin disables topic/vocabulary/test, when action is confirmed, then the system performs soft delete by setting `is_active=false`.
- **AC04:** Given the scheduled weekly Langeek crawler starts and the source is reachable/permitted, when crawl succeeds, then the system maps topics/new words to A1–C2 levels and automatically publishes the crawled content without Admin pre-approval.
- **AC05:** Given Langeek is down or crawl fails, when the scheduled crawler runs, then the system keeps current cached content active, retries, logs the failure, and notifies Admin.
- **AC06:** Given Admin changes crawler/content configuration or disables crawled content, when saved, then future and active content behavior follows the configuration while preserving crawl history.

### UC14 — Admin manages payment plans

- **AC01:** Given Admin creates a payment plan with valid name, price, duration, and features, when submitted, then the system saves the plan.
- **AC02:** Given Admin enters invalid price or missing required fields, when submitted, then the system shows inline validation errors.
- **AC03:** Given Admin disables a payment plan, when action is confirmed, then the system performs soft delete by setting `is_active=false`.

---

## 31. Open Items / TBD

- Payment Provider specific service: TBD.
- Deployment hosting/cloud provider: TBD.
- Database hosting: TBD.
- CI/CD: TBD.
- Deployment region: TBD.
- Anthropic version/model: TBD.
- Exact onboarding question UI fields can be refined later, but onboarding must collect enough data and selected A1–C2 level to create roadmap.
- Confirm Langeek Terms of Service, robots.txt, copyright/licensing permission, and acceptable rate limit before implementing crawler.
- Finalize crawler parsing/mapping rules from Langeek level/topic pages to internal `level`, `topic`, and `topic_word` records.
- Finalize retry policy details and Admin notification channel for crawler failures.

---

## 32. Requirements Approval Gate

This requirements summary has been reviewed and approved by the user.

**Approval status:** Approved / locked.  
**Approval phrase received:** `XÁC NHẬN`.  
**Next phase:** Create PlantUML diagrams and official SRS document.
