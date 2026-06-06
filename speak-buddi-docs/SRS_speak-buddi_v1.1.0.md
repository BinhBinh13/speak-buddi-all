# Software Requirements Specification (SRS) — speak-buddi

**Project:** speak-buddi  
**Version:** v1.1.0  
**Date:** 2026-06-06  
**Standard:** IEEE-style Software Requirements Specification  
**Requirements Approval:** Approved by user confirmation `XÁC NHẬN`  
**Source Requirements:** [requirements-summary.md](./requirements-summary.md)  
**Change Record:** [CHG-20260606-001](./changes/change-20260606T000000-feature.md)  
**Diagram Rule:** Diagrams are linked as external `.puml` files; PlantUML source is not embedded in this SRS.

---

## Record of Changes

| Version | Date | A/M/D | In Charge | Change Description |
|---|---|---|---|---|
| v1.0.0 | 2026-06-06 | A | srs-agent | Initial SRS created from approved requirements summary. |
| v1.1.0 | 2026-06-06 | A/M | AgentCode | Added Langeek crawler/content source and selected-level based roadmap/vocabulary feature. |

*A = Added, M = Modified, D = Deleted*

---

# 1. Product Overview

## 1.1 Purpose

This SRS specifies the functional and non-functional requirements for `speak-buddi`, a responsive English learning website for students/learners. The document defines actors, use cases, software features, acceptance criteria, constraints, data/entity references, and requirement traceability for v1.1.0.

## 1.2 Product Scope

`speak-buddi` helps learners study vocabulary, practice pronunciation, translate English words, complete vocabulary activities, and converse with AI. The system supports onboarding-based personalized roadmap generation where users manually select their CEFR-like English level from A1 to C2. Learning topics, vocabulary/new words, and activities/tests are personalized by the selected level and topic. v1.1.0 adds a scheduled Langeek content crawler that retrieves level-based topics and new words from `https://langeek.co/en-VI/vocab/level-based`, publishes crawled content automatically, and keeps cached content active when crawling fails. The system also supports paid subscriptions, Admin analytics, and Admin management of learning content, crawler/content configuration, and payment plans.

## 1.3 Business Goals

- Help students improve English speaking reflexes and speaking ability.
- Provide an AI companion for learners who do not have a speaking partner.
- Increase the number of paid users through subscription features.
- Provide level-appropriate learning content by mapping topics and new words to user-selected A1–C2 levels.

## 1.4 Target Users

- Guest visitors.
- Student/Learner users.
- Paid Users with active subscriptions.
- Admin users.

## 1.5 Existing Prototype and Upgrade Scope

The project upgrades an existing prototype that has a basic UI and AI conversation/speaking backend using Anthropic API and ElevenLabs API. There is no existing production data to migrate. v1.0.0 added responsive mobile web support, vocabulary translation, vocabulary tests/activities, pronunciation practice, topic/new-word-based conversations, improved AI conversation, payment, Admin analytics, and Admin content/payment plan management. v1.1.0 adds selected A1–C2 level personalization and scheduled Langeek-based topic/new-word content sync.

## 1.6 System Diagrams

- Context Diagram: [./diagrams/context-diagram.puml](./diagrams/context-diagram.puml)
- System Overview: [./diagrams/system-overview.puml](./diagrams/system-overview.puml)
- Entity Relationship: [./diagrams/entity-relationship.puml](./diagrams/entity-relationship.puml)
- Layered Architecture: [./diagrams/layered-architecture.puml](./diagrams/layered-architecture.puml)
- Deployment Overview: [./diagrams/deployment.puml](./diagrams/deployment.puml)
- Integration Diagram: [./diagrams/integration.puml](./diagrams/integration.puml)
- System Screen Flow: [./diagrams/screen-flow.puml](./diagrams/screen-flow.puml)

---

# 2. User Requirements

## 2.1 Actors

| # | Actor | Description |
|---:|---|---|
| 1 | Guest | Unauthenticated user who can view public landing/pricing and register/login. |
| 2 | Student/Learner | Registered free user with access to learning features and limited AI conversation quota. |
| 3 | Paid User | Student with active subscription; has unlimited AI conversation and can change voice/model. |
| 4 | Admin | Administrative user who manages content, crawler/content configuration, payment plans, and views analytics/export reports. |
| 5 | Payment Provider | External payment service, provider TBD, used for payment processing and callbacks/webhooks. |
| 6 | Anthropic API | External AI service for response analysis and AI conversation. |
| 7 | ElevenLabs API | External voice/TTS service for speech/audio generation. |
| 8 | Resend Email Service | External email service for auth/payment/notification emails. |
| 9 | Langeek Vocabulary Source | External website used as a level-based topic/new-word content source for scheduled crawling. |

## 2.2 Actor Permissions

| Actor | Allowed Actions | Restrictions / Notes |
|---|---|---|
| Guest | View landing/pricing; register; login. | Cannot access learning features. |
| Student/Learner | Select/update A1–C2 learning level; view roadmap, learn vocabulary, take tests, translate words, practice pronunciation, converse with AI. | AI conversation limited to 15 minutes per 5 hours; cannot change voice/model. |
| Paid User | All Student features; unlimited AI conversation; change ElevenLabs voice/model. | Requires active subscription. |
| Admin | View analytics/export; manage topics, vocabulary, tests, crawler/content configuration, disabled content, and payment plans. | Crawled content is published automatically; Admin does not approve before publish but can edit/disable content after crawl. |
| Langeek Vocabulary Source | Provides public level-based vocabulary/topic pages for scheduled crawler. | Must be accessed only by backend crawler according to applicable Terms of Service, robots.txt, copyright, and rate-limit rules. |
| External services | Process AI/voice/payment/email interactions. | Called only by backend/API. |

## 2.3 Use Cases

| UC ID | Use Case | Primary Actor(s) | Diagram Links |
|---|---|---|---|
| UC01 | Guest views landing/pricing | Guest | [Use Case](./diagrams/uc-01/uc-01-use-case.puml), [Screen Flow](./diagrams/uc-01/uc-01-screenflow.puml), [State](./diagrams/uc-01/uc-01-statediagram.puml), [Sequence](./diagrams/uc-01/uc-01-sequence.puml), [Backend Class](./diagrams/uc-01/uc-01-class-backend.puml), [Frontend Class](./diagrams/uc-01/uc-01-class-frontend.puml) |
| UC02 | User registers/logs in/resets password/OAuth Google | Guest, Student | [Use Case](./diagrams/uc-02/uc-02-use-case.puml), [Screen Flow](./diagrams/uc-02/uc-02-screenflow.puml), [State](./diagrams/uc-02/uc-02-statediagram.puml), [Sequence](./diagrams/uc-02/uc-02-sequence.puml), [Backend Class](./diagrams/uc-02/uc-02-class-backend.puml), [Frontend Class](./diagrams/uc-02/uc-02-class-frontend.puml) |
| UC03 | Student selects level during onboarding to create personalized roadmap | Student | [Use Case](./diagrams/uc-03/uc-03-use-case.puml), [Screen Flow](./diagrams/uc-03/uc-03-screenflow.puml), [State](./diagrams/uc-03/uc-03-statediagram.puml), [Sequence](./diagrams/uc-03/uc-03-sequence.puml), [Backend Class](./diagrams/uc-03/uc-03-class-backend.puml), [Frontend Class](./diagrams/uc-03/uc-03-class-frontend.puml) |
| UC04 | Student views personalized roadmap by selected level | Student, Paid User | [Use Case](./diagrams/uc-04/uc-04-use-case.puml), [Screen Flow](./diagrams/uc-04/uc-04-screenflow.puml), [State](./diagrams/uc-04/uc-04-statediagram.puml), [Sequence](./diagrams/uc-04/uc-04-sequence.puml), [Backend Class](./diagrams/uc-04/uc-04-class-backend.puml), [Frontend Class](./diagrams/uc-04/uc-04-class-frontend.puml) |
| UC05 | Student learns vocabulary by selected level/topic | Student, Paid User | [Use Case](./diagrams/uc-05/uc-05-use-case.puml), [Screen Flow](./diagrams/uc-05/uc-05-screenflow.puml), [State](./diagrams/uc-05/uc-05-statediagram.puml), [Sequence](./diagrams/uc-05/uc-05-sequence.puml), [Backend Class](./diagrams/uc-05/uc-05-class-backend.puml), [Frontend Class](./diagrams/uc-05/uc-05-class-frontend.puml) |
| UC06 | Student does vocabulary tests/activities with multiple question types by selected level/topic | Student, Paid User | [Use Case](./diagrams/uc-06/uc-06-use-case.puml), [Screen Flow](./diagrams/uc-06/uc-06-screenflow.puml), [State](./diagrams/uc-06/uc-06-statediagram.puml), [Sequence](./diagrams/uc-06/uc-06-sequence.puml), [Backend Class](./diagrams/uc-06/uc-06-class-backend.puml), [Frontend Class](./diagrams/uc-06/uc-06-class-frontend.puml) |
| UC07 | Student translates English words | Student, Paid User | [Use Case](./diagrams/uc-07/uc-07-use-case.puml), [Screen Flow](./diagrams/uc-07/uc-07-screenflow.puml), [State](./diagrams/uc-07/uc-07-statediagram.puml), [Sequence](./diagrams/uc-07/uc-07-sequence.puml), [Backend Class](./diagrams/uc-07/uc-07-class-backend.puml), [Frontend Class](./diagrams/uc-07/uc-07-class-frontend.puml) |
| UC08 | Student practices pronunciation | Student, Paid User | [Use Case](./diagrams/uc-08/uc-08-use-case.puml), [Screen Flow](./diagrams/uc-08/uc-08-screenflow.puml), [State](./diagrams/uc-08/uc-08-statediagram.puml), [Sequence](./diagrams/uc-08/uc-08-sequence.puml), [Backend Class](./diagrams/uc-08/uc-08-class-backend.puml), [Frontend Class](./diagrams/uc-08/uc-08-class-frontend.puml) |
| UC09 | Student/Paid User converses with AI | Student, Paid User | [Use Case](./diagrams/uc-09/uc-09-use-case.puml), [Screen Flow](./diagrams/uc-09/uc-09-screenflow.puml), [State](./diagrams/uc-09/uc-09-statediagram.puml), [Sequence](./diagrams/uc-09/uc-09-sequence.puml), [Backend Class](./diagrams/uc-09/uc-09-class-backend.puml), [Frontend Class](./diagrams/uc-09/uc-09-class-frontend.puml) |
| UC10 | Student purchases paid plan/payment | Student | [Use Case](./diagrams/uc-10/uc-10-use-case.puml), [Screen Flow](./diagrams/uc-10/uc-10-screenflow.puml), [State](./diagrams/uc-10/uc-10-statediagram.puml), [Sequence](./diagrams/uc-10/uc-10-sequence.puml), [Backend Class](./diagrams/uc-10/uc-10-class-backend.puml), [Frontend Class](./diagrams/uc-10/uc-10-class-frontend.puml) |
| UC11 | Paid User changes ElevenLabs voice/model | Paid User | [Use Case](./diagrams/uc-11/uc-11-use-case.puml), [Screen Flow](./diagrams/uc-11/uc-11-screenflow.puml), [State](./diagrams/uc-11/uc-11-statediagram.puml), [Sequence](./diagrams/uc-11/uc-11-sequence.puml), [Backend Class](./diagrams/uc-11/uc-11-class-backend.puml), [Frontend Class](./diagrams/uc-11/uc-11-class-frontend.puml) |
| UC12 | Admin views analytics/reporting/export | Admin | [Use Case](./diagrams/uc-12/uc-12-use-case.puml), [Screen Flow](./diagrams/uc-12/uc-12-screenflow.puml), [State](./diagrams/uc-12/uc-12-statediagram.puml), [Sequence](./diagrams/uc-12/uc-12-sequence.puml), [Backend Class](./diagrams/uc-12/uc-12-class-backend.puml), [Frontend Class](./diagrams/uc-12/uc-12-class-frontend.puml) |
| UC13 | Admin manages topic/vocabulary/vocabulary tests and crawler content sync | Admin | [Use Case](./diagrams/uc-13/uc-13-use-case.puml), [Screen Flow](./diagrams/uc-13/uc-13-screenflow.puml), [State](./diagrams/uc-13/uc-13-statediagram.puml), [Sequence](./diagrams/uc-13/uc-13-sequence.puml), [Backend Class](./diagrams/uc-13/uc-13-class-backend.puml), [Frontend Class](./diagrams/uc-13/uc-13-class-frontend.puml) |
| UC14 | Admin manages payment plans | Admin | [Use Case](./diagrams/uc-14/uc-14-use-case.puml), [Screen Flow](./diagrams/uc-14/uc-14-screenflow.puml), [State](./diagrams/uc-14/uc-14-statediagram.puml), [Sequence](./diagrams/uc-14/uc-14-sequence.puml), [Backend Class](./diagrams/uc-14/uc-14-class-backend.puml), [Frontend Class](./diagrams/uc-14/uc-14-class-frontend.puml) |

## 2.4 Use Case Specifications

#### UC01 — Guest views landing/pricing

**Primary Actor(s):** Guest  
**Secondary Actor(s):** None  
**Description:** The actor uses speak-buddi to view public landing and pricing information.  
**Trigger:** The actor attempts to open website landing page.  
**Preconditions:** Actor has required access rights and required input/context is available.  
**Postconditions:** Public content and pricing are displayed.

**External Diagrams:**
- Use Case: [./diagrams/uc-01/uc-01-use-case.puml](./diagrams/uc-01/uc-01-use-case.puml)
- Screen Flow: [./diagrams/uc-01/uc-01-screenflow.puml](./diagrams/uc-01/uc-01-screenflow.puml)
- State: [./diagrams/uc-01/uc-01-statediagram.puml](./diagrams/uc-01/uc-01-statediagram.puml)
- Sequence: [./diagrams/uc-01/uc-01-sequence.puml](./diagrams/uc-01/uc-01-sequence.puml)
- Backend Class: [./diagrams/uc-01/uc-01-class-backend.puml](./diagrams/uc-01/uc-01-class-backend.puml)
- Frontend Class: [./diagrams/uc-01/uc-01-class-frontend.puml](./diagrams/uc-01/uc-01-class-frontend.puml)

#### UC02 — User registers/logs in/resets password/OAuth Google

**Primary Actor(s):** Guest, Student  
**Secondary Actor(s):** Google OAuth, Resend  
**Description:** The actor uses speak-buddi to register, login, reset password, or use Google OAuth.  
**Trigger:** The actor attempts to submit authentication request.  
**Preconditions:** Actor has required access rights and required input/context is available.  
**Postconditions:** Account/session is created or reset email is sent.

**External Diagrams:**
- Use Case: [./diagrams/uc-02/uc-02-use-case.puml](./diagrams/uc-02/uc-02-use-case.puml)
- Screen Flow: [./diagrams/uc-02/uc-02-screenflow.puml](./diagrams/uc-02/uc-02-screenflow.puml)
- State: [./diagrams/uc-02/uc-02-statediagram.puml](./diagrams/uc-02/uc-02-statediagram.puml)
- Sequence: [./diagrams/uc-02/uc-02-sequence.puml](./diagrams/uc-02/uc-02-sequence.puml)
- Backend Class: [./diagrams/uc-02/uc-02-class-backend.puml](./diagrams/uc-02/uc-02-class-backend.puml)
- Frontend Class: [./diagrams/uc-02/uc-02-class-frontend.puml](./diagrams/uc-02/uc-02-class-frontend.puml)

#### UC03 — Student selects level during onboarding to create personalized roadmap

**Primary Actor(s):** Student  
**Secondary Actor(s):** None  
**Description:** The actor selects an English learning level from A1 to C2 and answers required onboarding questions so the system can create a personalized roadmap.  
**Trigger:** A new Student enters the app after registration or updates learning level in profile/onboarding.  
**Preconditions:** Actor has required access rights and required input/context is available.  
**Postconditions:** Selected A1–C2 level and onboarding inputs are saved; a personalized roadmap can be generated from active level/topic content.

**External Diagrams:**
- Use Case: [./diagrams/uc-03/uc-03-use-case.puml](./diagrams/uc-03/uc-03-use-case.puml)
- Screen Flow: [./diagrams/uc-03/uc-03-screenflow.puml](./diagrams/uc-03/uc-03-screenflow.puml)
- State: [./diagrams/uc-03/uc-03-statediagram.puml](./diagrams/uc-03/uc-03-statediagram.puml)
- Sequence: [./diagrams/uc-03/uc-03-sequence.puml](./diagrams/uc-03/uc-03-sequence.puml)
- Backend Class: [./diagrams/uc-03/uc-03-class-backend.puml](./diagrams/uc-03/uc-03-class-backend.puml)
- Frontend Class: [./diagrams/uc-03/uc-03-class-frontend.puml](./diagrams/uc-03/uc-03-class-frontend.puml)

#### UC04 — Student views personalized roadmap by selected level

**Primary Actor(s):** Student, Paid User  
**Secondary Actor(s):** None  
**Description:** The actor uses speak-buddi to view a personalized learning roadmap based on the user-selected A1–C2 level and active level/topic/vocabulary content.  
**Trigger:** The actor attempts to open roadmap screen.  
**Preconditions:** Actor has required access rights and selected level/onboarding context is available.  
**Postconditions:** Roadmap topics and progress are displayed for the selected level.

**External Diagrams:**
- Use Case: [./diagrams/uc-04/uc-04-use-case.puml](./diagrams/uc-04/uc-04-use-case.puml)
- Screen Flow: [./diagrams/uc-04/uc-04-screenflow.puml](./diagrams/uc-04/uc-04-screenflow.puml)
- State: [./diagrams/uc-04/uc-04-statediagram.puml](./diagrams/uc-04/uc-04-statediagram.puml)
- Sequence: [./diagrams/uc-04/uc-04-sequence.puml](./diagrams/uc-04/uc-04-sequence.puml)
- Backend Class: [./diagrams/uc-04/uc-04-class-backend.puml](./diagrams/uc-04/uc-04-class-backend.puml)
- Frontend Class: [./diagrams/uc-04/uc-04-class-frontend.puml](./diagrams/uc-04/uc-04-class-frontend.puml)

#### UC05 — Student learns vocabulary by selected level/topic

**Primary Actor(s):** Student, Paid User  
**Secondary Actor(s):** None  
**Description:** The actor uses speak-buddi to study vocabulary/new words in a topic that belongs to the selected A1–C2 level. Content can originate from the scheduled Langeek crawler and Admin-managed content.  
**Trigger:** The actor attempts to open topic vocabulary screen.  
**Preconditions:** Actor has required access rights, selected level is available, and active vocabulary content exists.  
**Postconditions:** Vocabulary/new words and progress are displayed/saved by level, topic, and word.

**External Diagrams:**
- Use Case: [./diagrams/uc-05/uc-05-use-case.puml](./diagrams/uc-05/uc-05-use-case.puml)
- Screen Flow: [./diagrams/uc-05/uc-05-screenflow.puml](./diagrams/uc-05/uc-05-screenflow.puml)
- State: [./diagrams/uc-05/uc-05-statediagram.puml](./diagrams/uc-05/uc-05-statediagram.puml)
- Sequence: [./diagrams/uc-05/uc-05-sequence.puml](./diagrams/uc-05/uc-05-sequence.puml)
- Backend Class: [./diagrams/uc-05/uc-05-class-backend.puml](./diagrams/uc-05/uc-05-class-backend.puml)
- Frontend Class: [./diagrams/uc-05/uc-05-class-frontend.puml](./diagrams/uc-05/uc-05-class-frontend.puml)

#### UC06 — Student does vocabulary tests/activities with multiple question types by selected level/topic

**Primary Actor(s):** Student, Paid User  
**Secondary Actor(s):** None  
**Description:** The actor uses speak-buddi to complete flashcard, multiple choice, fill-in-the-blank, and grammar mapping activities using vocabulary for the selected level/topic.  
**Trigger:** The actor attempts to start topic test/activity.  
**Preconditions:** Actor has required access rights, selected level is available, and topic/activity content exists.  
**Postconditions:** Answers are evaluated and score is saved by user, level/topic, and test/activity.

**External Diagrams:**
- Use Case: [./diagrams/uc-06/uc-06-use-case.puml](./diagrams/uc-06/uc-06-use-case.puml)
- Screen Flow: [./diagrams/uc-06/uc-06-screenflow.puml](./diagrams/uc-06/uc-06-screenflow.puml)
- State: [./diagrams/uc-06/uc-06-statediagram.puml](./diagrams/uc-06/uc-06-statediagram.puml)
- Sequence: [./diagrams/uc-06/uc-06-sequence.puml](./diagrams/uc-06/uc-06-sequence.puml)
- Backend Class: [./diagrams/uc-06/uc-06-class-backend.puml](./diagrams/uc-06/uc-06-class-backend.puml)
- Frontend Class: [./diagrams/uc-06/uc-06-class-frontend.puml](./diagrams/uc-06/uc-06-class-frontend.puml)

#### UC07 — Student translates English words

**Primary Actor(s):** Student, Paid User  
**Secondary Actor(s):** None  
**Description:** The actor uses speak-buddi to translate an English word.  
**Trigger:** The actor attempts to submit word for translation.  
**Preconditions:** Actor has required access rights and required input/context is available.  
**Postconditions:** Vietnamese meaning is returned.

**External Diagrams:**
- Use Case: [./diagrams/uc-07/uc-07-use-case.puml](./diagrams/uc-07/uc-07-use-case.puml)
- Screen Flow: [./diagrams/uc-07/uc-07-screenflow.puml](./diagrams/uc-07/uc-07-screenflow.puml)
- State: [./diagrams/uc-07/uc-07-statediagram.puml](./diagrams/uc-07/uc-07-statediagram.puml)
- Sequence: [./diagrams/uc-07/uc-07-sequence.puml](./diagrams/uc-07/uc-07-sequence.puml)
- Backend Class: [./diagrams/uc-07/uc-07-class-backend.puml](./diagrams/uc-07/uc-07-class-backend.puml)
- Frontend Class: [./diagrams/uc-07/uc-07-class-frontend.puml](./diagrams/uc-07/uc-07-class-frontend.puml)

#### UC08 — Student practices pronunciation

**Primary Actor(s):** Student, Paid User  
**Secondary Actor(s):** ElevenLabs API  
**Description:** The actor uses speak-buddi to practice pronunciation using microphone.  
**Trigger:** The actor attempts to start pronunciation attempt.  
**Preconditions:** Actor has required access rights and required input/context is available.  
**Postconditions:** Score and feedback are displayed.

**External Diagrams:**
- Use Case: [./diagrams/uc-08/uc-08-use-case.puml](./diagrams/uc-08/uc-08-use-case.puml)
- Screen Flow: [./diagrams/uc-08/uc-08-screenflow.puml](./diagrams/uc-08/uc-08-screenflow.puml)
- State: [./diagrams/uc-08/uc-08-statediagram.puml](./diagrams/uc-08/uc-08-statediagram.puml)
- Sequence: [./diagrams/uc-08/uc-08-sequence.puml](./diagrams/uc-08/uc-08-sequence.puml)
- Backend Class: [./diagrams/uc-08/uc-08-class-backend.puml](./diagrams/uc-08/uc-08-class-backend.puml)
- Frontend Class: [./diagrams/uc-08/uc-08-class-frontend.puml](./diagrams/uc-08/uc-08-class-frontend.puml)

#### UC09 — Student/Paid User converses with AI

**Primary Actor(s):** Student, Paid User  
**Secondary Actor(s):** Anthropic API, ElevenLabs API  
**Description:** The actor uses speak-buddi to converse with AI.  
**Trigger:** The actor attempts to start AI conversation session.  
**Preconditions:** Actor has required access rights and required input/context is available.  
**Postconditions:** Ai response and optional audio are returned.

**External Diagrams:**
- Use Case: [./diagrams/uc-09/uc-09-use-case.puml](./diagrams/uc-09/uc-09-use-case.puml)
- Screen Flow: [./diagrams/uc-09/uc-09-screenflow.puml](./diagrams/uc-09/uc-09-screenflow.puml)
- State: [./diagrams/uc-09/uc-09-statediagram.puml](./diagrams/uc-09/uc-09-statediagram.puml)
- Sequence: [./diagrams/uc-09/uc-09-sequence.puml](./diagrams/uc-09/uc-09-sequence.puml)
- Backend Class: [./diagrams/uc-09/uc-09-class-backend.puml](./diagrams/uc-09/uc-09-class-backend.puml)
- Frontend Class: [./diagrams/uc-09/uc-09-class-frontend.puml](./diagrams/uc-09/uc-09-class-frontend.puml)

#### UC10 — Student purchases paid plan/payment

**Primary Actor(s):** Student  
**Secondary Actor(s):** Payment Provider, Resend  
**Description:** The actor uses speak-buddi to purchase a paid plan.  
**Trigger:** The actor attempts to select plan and confirm payment.  
**Preconditions:** Actor has required access rights and required input/context is available.  
**Postconditions:** Subscription is activated after successful payment.

**External Diagrams:**
- Use Case: [./diagrams/uc-10/uc-10-use-case.puml](./diagrams/uc-10/uc-10-use-case.puml)
- Screen Flow: [./diagrams/uc-10/uc-10-screenflow.puml](./diagrams/uc-10/uc-10-screenflow.puml)
- State: [./diagrams/uc-10/uc-10-statediagram.puml](./diagrams/uc-10/uc-10-statediagram.puml)
- Sequence: [./diagrams/uc-10/uc-10-sequence.puml](./diagrams/uc-10/uc-10-sequence.puml)
- Backend Class: [./diagrams/uc-10/uc-10-class-backend.puml](./diagrams/uc-10/uc-10-class-backend.puml)
- Frontend Class: [./diagrams/uc-10/uc-10-class-frontend.puml](./diagrams/uc-10/uc-10-class-frontend.puml)

#### UC11 — Paid User changes ElevenLabs voice/model

**Primary Actor(s):** Paid User  
**Secondary Actor(s):** ElevenLabs API  
**Description:** The actor uses speak-buddi to select ElevenLabs voice/model.  
**Trigger:** The actor attempts to save voice preference.  
**Preconditions:** Actor has required access rights and required input/context is available.  
**Postconditions:** Voice preference is saved.

**External Diagrams:**
- Use Case: [./diagrams/uc-11/uc-11-use-case.puml](./diagrams/uc-11/uc-11-use-case.puml)
- Screen Flow: [./diagrams/uc-11/uc-11-screenflow.puml](./diagrams/uc-11/uc-11-screenflow.puml)
- State: [./diagrams/uc-11/uc-11-statediagram.puml](./diagrams/uc-11/uc-11-statediagram.puml)
- Sequence: [./diagrams/uc-11/uc-11-sequence.puml](./diagrams/uc-11/uc-11-sequence.puml)
- Backend Class: [./diagrams/uc-11/uc-11-class-backend.puml](./diagrams/uc-11/uc-11-class-backend.puml)
- Frontend Class: [./diagrams/uc-11/uc-11-class-frontend.puml](./diagrams/uc-11/uc-11-class-frontend.puml)

#### UC12 — Admin views analytics/reporting/export

**Primary Actor(s):** Admin  
**Secondary Actor(s):** None  
**Description:** The actor uses speak-buddi to view analytics and export reports.  
**Trigger:** The actor attempts to open admin analytics/export screen.  
**Preconditions:** Actor has required access rights and required input/context is available.  
**Postconditions:** Metrics and excel/pdf exports are produced.

**External Diagrams:**
- Use Case: [./diagrams/uc-12/uc-12-use-case.puml](./diagrams/uc-12/uc-12-use-case.puml)
- Screen Flow: [./diagrams/uc-12/uc-12-screenflow.puml](./diagrams/uc-12/uc-12-screenflow.puml)
- State: [./diagrams/uc-12/uc-12-statediagram.puml](./diagrams/uc-12/uc-12-statediagram.puml)
- Sequence: [./diagrams/uc-12/uc-12-sequence.puml](./diagrams/uc-12/uc-12-sequence.puml)
- Backend Class: [./diagrams/uc-12/uc-12-class-backend.puml](./diagrams/uc-12/uc-12-class-backend.puml)
- Frontend Class: [./diagrams/uc-12/uc-12-class-frontend.puml](./diagrams/uc-12/uc-12-class-frontend.puml)

#### UC13 — Admin manages topic/vocabulary/vocabulary tests and crawler content sync

**Primary Actor(s):** Admin  
**Secondary Actor(s):** Langeek Vocabulary Source  
**Description:** The actor uses speak-buddi to create/update/disable topics, vocabulary, and tests, and to configure/manage crawler/content behavior after automatically published content is synced from Langeek.  
**Trigger:** Admin submits a content/crawler management form, or the scheduled weekly crawler runs.  
**Preconditions:** Actor has required access rights; for scheduled crawl, crawler configuration and network access are available.  
**Postconditions:** Content is saved, auto-published, or soft-disabled; crawl results/failures are logged.

**External Diagrams:**
- Use Case: [./diagrams/uc-13/uc-13-use-case.puml](./diagrams/uc-13/uc-13-use-case.puml)
- Screen Flow: [./diagrams/uc-13/uc-13-screenflow.puml](./diagrams/uc-13/uc-13-screenflow.puml)
- State: [./diagrams/uc-13/uc-13-statediagram.puml](./diagrams/uc-13/uc-13-statediagram.puml)
- Sequence: [./diagrams/uc-13/uc-13-sequence.puml](./diagrams/uc-13/uc-13-sequence.puml)
- Backend Class: [./diagrams/uc-13/uc-13-class-backend.puml](./diagrams/uc-13/uc-13-class-backend.puml)
- Frontend Class: [./diagrams/uc-13/uc-13-class-frontend.puml](./diagrams/uc-13/uc-13-class-frontend.puml)

#### UC14 — Admin manages payment plans

**Primary Actor(s):** Admin  
**Secondary Actor(s):** None  
**Description:** The actor uses speak-buddi to create/update/disable payment plans.  
**Trigger:** The actor attempts to submit payment plan form.  
**Preconditions:** Actor has required access rights and required input/context is available.  
**Postconditions:** Payment plan is saved or soft-disabled.

**External Diagrams:**
- Use Case: [./diagrams/uc-14/uc-14-use-case.puml](./diagrams/uc-14/uc-14-use-case.puml)
- Screen Flow: [./diagrams/uc-14/uc-14-screenflow.puml](./diagrams/uc-14/uc-14-screenflow.puml)
- State: [./diagrams/uc-14/uc-14-statediagram.puml](./diagrams/uc-14/uc-14-statediagram.puml)
- Sequence: [./diagrams/uc-14/uc-14-sequence.puml](./diagrams/uc-14/uc-14-sequence.puml)
- Backend Class: [./diagrams/uc-14/uc-14-class-backend.puml](./diagrams/uc-14/uc-14-class-backend.puml)
- Frontend Class: [./diagrams/uc-14/uc-14-class-frontend.puml](./diagrams/uc-14/uc-14-class-frontend.puml)


## 2.5 Acceptance Criteria per Use Case

#### UC01 — Guest views landing/pricing

**AC-01-01:** Given a Guest opens the website, when the landing page loads, then the system displays public introduction content without requiring login.
**AC-01-02:** Given a Guest views pricing, when the pricing section loads, then the system displays available public payment plan information.
**AC-01-03:** Given a Guest attempts to access learning features, when the request is made, then the system blocks access and prompts login/register.
#### UC02 — User registers/logs in/resets password/OAuth Google

**AC-02-01:** Given a Guest enters valid email/password data, when registration is submitted, then the system creates a Student account.
**AC-02-02:** Given a user enters wrong login credentials, when login is submitted, then the system shows “Email hoặc mật khẩu không đúng” and does not log the user in.
**AC-02-03:** Given a user chooses Google OAuth, when OAuth succeeds, then the system logs the user in or creates a linked account.
**AC-02-04:** Given a user requests password reset, when a valid email is provided, then the system sends a reset email through Resend.
#### UC03 — Student selects level during onboarding to create personalized roadmap

**AC-03-01:** Given a newly registered Student has not completed onboarding, when they access the app, then the system prompts them to select a learning level from A1, A2, B1, B2, C1, or C2 and answer required onboarding questions before showing the roadmap.
**AC-03-02:** Given the Student selects a valid A1–C2 level and submits required onboarding answers, when the submission is valid, then the system saves the selected level and creates a personalized roadmap based on active content for that level.
**AC-03-03:** Given selected level or required onboarding data is missing or invalid, when the Student submits onboarding, then the system highlights missing/invalid fields and prevents roadmap generation.
**AC-03-04:** Given a Student updates their selected level in profile/onboarding settings, when the change is saved, then future roadmap, topic, vocabulary, and activity recommendations use the updated level.
#### UC04 — Student views personalized roadmap by selected level

**AC-04-01:** Given a Student has completed onboarding and selected an A1–C2 level, when they open roadmap, then the system displays a personalized learning roadmap with topics matching the selected level.
**AC-04-02:** Given roadmap content is based on active level/topic/vocabulary/test content, when weekly crawled or Admin-managed content is active, then the roadmap reflects active content for the user’s selected level.
**AC-04-03:** Given a Guest attempts to view roadmap, when the request is made, then the system blocks access and requires login.
**AC-04-04:** Given no active topic exists for the selected level, when the Student opens roadmap, then the system shows an empty/fallback state without deleting the user’s selected level or progress.
#### UC05 — Student learns vocabulary by selected level/topic

**AC-05-01:** Given a Student opens a topic that belongs to their selected level, when active vocabulary exists from crawled or Admin-managed content, then the system displays vocabulary/new words and meanings for that level/topic.
**AC-05-02:** Given a vocabulary word has example or grammar-related content, when the user views the word, then the system shows relevant learning information.
**AC-05-03:** Given the Student studies vocabulary, when progress is saved, then the system updates word/topic progress with level and topic context.
**AC-05-04:** Given crawled vocabulary is updated by the weekly sync, when the Student opens the topic after publish, then the system displays the latest active vocabulary while preserving historical learning progress.
#### UC06 — Student does vocabulary tests/activities with multiple question types by selected level/topic

**AC-06-01:** Given a Student opens a topic test/activity for their selected level, when questions exist, then the system displays supported activities including flashcard, multiple choice, fill-in-the-blank, and grammar mapping where available.
**AC-06-02:** Given a Student has not answered all required questions, when they try to submit, then submission is disabled or missing answers are highlighted.
**AC-06-03:** Given a Student submits a completed test, when answers are evaluated, then score is calculated as correct answers divided by total questions multiplied by 100%.
**AC-06-04:** Given the weekly content sync updates vocabulary for a level/topic, when new activities are generated or selected, then they use the latest active vocabulary without modifying previous attempt results.
#### UC07 — Student translates English words

**AC-07-01:** Given a Student enters an English word, when translation is requested, then the system returns Vietnamese meaning/translation.
**AC-07-02:** Given input is empty or invalid, when translation is submitted, then the system shows a validation message.
**AC-07-03:** Given translation history is enabled, when translation succeeds, then the system stores translation history for the Student.
#### UC08 — Student practices pronunciation

**AC-08-01:** Given a Student starts pronunciation practice, when microphone permission is granted, then the system records or accepts audio for scoring.
**AC-08-02:** Given microphone is denied or not found, when practice starts, then the system shows the appropriate microphone error message.
**AC-08-03:** Given pronunciation scoring succeeds, when feedback is returned, then the system displays score/feedback and stores metadata/score.
#### UC09 — Student/Paid User converses with AI

**AC-09-01:** Given a free Student has remaining quota, when they start AI conversation, then the system allows conversation and counts usage time.
**AC-09-02:** Given a free Student has used 15 minutes in the current 5-hour window, when they try to continue, then the system returns quota exceeded and prompts upgrade/wait.
**AC-09-03:** Given a Paid User starts AI conversation, when they converse with AI, then no 15-minute quota is applied.
**AC-09-04:** Given Anthropic or ElevenLabs fails, when the conversation needs the failed service, then the system displays fallback/error handling without losing user data.
#### UC10 — Student purchases paid plan/payment

**AC-10-01:** Given a Student selects a paid plan, when they proceed to payment, then the system creates a payment transaction and redirects or initiates provider flow.
**AC-10-02:** Given payment succeeds, when webhook/callback is received, then the system activates the subscription and marks the user as Paid User.
**AC-10-03:** Given payment fails or is cancelled, when the result is received, then the system keeps the current plan and shows retry/home options.
#### UC11 — Paid User changes ElevenLabs voice/model

**AC-11-01:** Given a Paid User opens voice settings, when active voice models exist, then the system displays available ElevenLabs voice/model options.
**AC-11-02:** Given a Paid User selects a voice/model, when saved, then the system stores the user voice preference.
**AC-11-03:** Given a free Student attempts to change voice/model, when the request is made, then the system denies access and prompts upgrade.
#### UC12 — Admin views analytics/reporting/export

**AC-12-01:** Given Admin opens analytics, when data exists, then the system shows revenue, user, learning, and AI usage metrics.
**AC-12-02:** Given Admin filters revenue by date/plan, when the filter is applied, then the system displays matching revenue data.
**AC-12-03:** Given Admin requests export, when the report is generated, then the system provides Excel/PDF output and records export history.
#### UC13 — Admin manages topic/vocabulary/vocabulary tests and crawler content sync

**AC-13-01:** Given Admin creates or updates topic/vocabulary/test with valid data, when submitted, then the system saves the content.
**AC-13-02:** Given Admin enters invalid content such as duplicate topic name or missing required fields, when submitted, then the system shows inline validation errors.
**AC-13-03:** Given Admin disables topic/vocabulary/test, when action is confirmed, then the system performs soft delete by setting is_active=false.
**AC-13-04:** Given the scheduled weekly Langeek crawler starts and the source is reachable/permitted, when crawl succeeds, then the system maps topics/new words to A1–C2 levels and automatically publishes the crawled content without Admin pre-approval.
**AC-13-05:** Given Langeek is down or crawl fails, when the scheduled crawler runs, then the system keeps current cached content active, retries according to configured policy, logs the failure, and notifies Admin.
**AC-13-06:** Given Admin changes crawler/content configuration or disables crawled content, when saved, then future and active content behavior follows the configuration while preserving crawl history.
#### UC14 — Admin manages payment plans

**AC-14-01:** Given Admin creates a payment plan with valid name, price, duration, and features, when submitted, then the system saves the plan.
**AC-14-02:** Given Admin enters invalid price or missing required fields, when submitted, then the system shows inline validation errors.
**AC-14-03:** Given Admin disables a payment plan, when action is confirmed, then the system performs soft delete by setting is_active=false.

---

# 3. Software Features

## 3.1 Functional Overview

All current features are Must-have. v1.1.0 adds selected A1–C2 level personalization and scheduled Langeek topic/new-word content crawling. No Should-have or Could-have features are planned for this version. Native iOS/Android apps and public external API remain out of scope.

| Feature ID | Feature Name | Actor(s) | Priority | Description | Related UC |
|---|---|---|---|---|---|
| F01 | View landing page/pricing | Guest | Must | Public introduction and pricing access for Guest. | UC01 |
| F02 | Register/login/reset password/OAuth Google | Guest, Student | Must | Authentication with email/password, Google OAuth, reset email, JWT/refresh token. | UC02 |
| F03 | Complete onboarding/select level to create personalized roadmap | Student | Must | Collect onboarding answers and user-selected A1–C2 level for roadmap generation. | UC03 |
| F04 | View personalized roadmap | Student, Paid User | Must | Display learning roadmap based on selected level and active content. | UC04 |
| F05 | Learn vocabulary/new vocabulary by level/topic | Student, Paid User | Must | Level/topic-based vocabulary learning with progress tracking. | UC05 |
| F06 | Do vocabulary tests/activities | Student, Paid User | Must | Flashcard, multiple choice, fill-in-the-blank, grammar mapping activities based on level/topic vocabulary. | UC06 |
| F07 | Translate English words | Student, Paid User | Must | Translate unfamiliar English words into Vietnamese. | UC07 |
| F08 | Practice pronunciation | Student, Paid User | Must | Microphone-based pronunciation practice with feedback/score. | UC08 |
| F09 | Converse with AI | Student, Paid User | Must | AI conversation using Anthropic and ElevenLabs where applicable. | UC09 |
| F10 | Enforce free Student AI quota | Student | Must | Free Student AI conversation limited to 15 minutes per 5 hours. | UC09 |
| F11 | Unlimited AI conversation for Paid User | Paid User | Must | Paid User is not subject to free quota. | UC09 |
| F12 | Paid User changes ElevenLabs voice/model | Paid User | Must | Paid User can select voice/model preference. | UC11 |
| F13 | Payment / purchase paid plan | Student, Payment Provider | Must | Payment flow activates Paid User subscription. | UC10 |
| F14 | Admin analytics/reporting/export | Admin | Must | Revenue/user/learning/AI analytics and Excel/PDF exports. | UC12 |
| F15 | Admin manages vocabulary tests | Admin | Must | Create/update/soft-disable vocabulary tests. | UC13 |
| F16 | Admin manages payment plans | Admin | Must | Create/update/soft-disable payment plans. | UC14 |
| F17 | Admin manages vocabulary and topics | Admin | Must | Create/update/soft-disable topics and words, including crawled content after publish. | UC13 |
| F18 | Langeek content crawler/source sync | System, Admin, Langeek Vocabulary Source | Must | Weekly scheduled crawl of level-based topics/new words from Langeek with automatic publish, cache fallback, retry, logs, and Admin notification. | UC13, UC04, UC05, UC06 |

## 3.2 Functional Requirements

| FR ID | Feature | Requirement | UC | Priority | Status |
|---|---|---|---|---|---|
| FR-01 | F01 View landing page/pricing | System shall support public introduction and pricing access for Guest. | UC01 | Must | Approved |
| FR-02 | F02 Register/login/reset password/OAuth Google | System shall support authentication with email/password, Google OAuth, reset email, JWT/refresh token. | UC02 | Must | Approved |
| FR-03 | F03 Complete onboarding/select level to create personalized roadmap | System shall allow Student to select an English learning level from A1, A2, B1, B2, C1, or C2 during onboarding/profile and save the selected level for personalization. | UC03 | Must | Approved |
| FR-04 | F04 View personalized roadmap | System shall display learning roadmap topics and progress based on the Student's selected A1–C2 level and active content. | UC04 | Must | Approved |
| FR-05 | F05 Learn vocabulary/new vocabulary by level/topic | System shall display vocabulary/new words by selected level and topic, using active crawled or Admin-managed content. | UC05 | Must | Approved |
| FR-06 | F06 Do vocabulary tests/activities | System shall support flashcard, multiple choice, fill-in-the-blank, and grammar mapping activities using active vocabulary for the selected level/topic. | UC06 | Must | Approved |
| FR-07 | F07 Translate English words | System shall support translate unfamiliar English words into Vietnamese. | UC07 | Must | Approved |
| FR-08 | F08 Practice pronunciation | System shall support microphone-based pronunciation practice with feedback/score. | UC08 | Must | Approved |
| FR-09 | F09 Converse with AI | System shall support AI conversation using Anthropic and ElevenLabs where applicable. | UC09 | Must | Approved |
| FR-10 | F10 Enforce free Student AI quota | System shall support free Student AI conversation limited to 15 minutes per 5 hours. | UC09 | Must | Approved |
| FR-11 | F11 Unlimited AI conversation for Paid User | System shall support paid User is not subject to free quota. | UC09 | Must | Approved |
| FR-12 | F12 Paid User changes ElevenLabs voice/model | System shall support paid User can select voice/model preference. | UC11 | Must | Approved |
| FR-13 | F13 Payment / purchase paid plan | System shall support payment flow activates Paid User subscription. | UC10 | Must | Approved |
| FR-14 | F14 Admin analytics/reporting/export | System shall support revenue/user/learning/AI analytics and Excel/PDF exports. | UC12 | Must | Approved |
| FR-15 | F15 Admin manages vocabulary tests | System shall support create/update/soft-disable vocabulary tests. | UC13 | Must | Approved |
| FR-16 | F16 Admin manages payment plans | System shall support create/update/soft-disable payment plans. | UC14 | Must | Approved |
| FR-17 | F17 Admin manages vocabulary and topics | System shall support create/update/soft-disable topics and words, including content that was automatically published after crawl. | UC13 | Must | Approved |
| FR-18 | F18 Langeek content crawler/source sync | System shall automatically crawl level-based topics and new words from `https://langeek.co/en-VI/vocab/level-based` on a weekly schedule and map them to A1–C2 levels/topics. | UC13, UC04, UC05, UC06 | Must | Approved |
| FR-19 | F18 Langeek content crawler/source sync | System shall automatically publish successfully crawled Langeek content without Admin pre-approval while allowing Admin to edit or disable content after publish. | UC13 | Must | Approved |
| FR-20 | F18 Langeek content crawler/source sync | System shall keep current cached content active, retry, log failures, and notify Admin when Langeek is unavailable or crawling fails. | UC13 | Must | Approved |

## 3.3 Onboarding and Roadmap Requirements

- After registration, the new Student must complete onboarding questions and select a level from A1, A2, B1, B2, C1, or C2 before the personalized roadmap is created.
- The selected A1–C2 level is chosen manually by the user; v1.1.0 does not require an auto-scored placement test.
- Onboarding must collect enough data for roadmap generation, including at minimum selected English level and learning goal. Name/nickname, target/current topic preference, daily learning time, and topics of interest may also be collected/refined in implementation.
- The Student may update the selected level in profile/onboarding settings; subsequent roadmap, topic, vocabulary, and activity recommendations must use the latest selected level.
- Roadmap is generated from onboarding answers, selected level, active ordered learning content, topics, vocabulary, and tests.
- Admin-managed and crawled topics, vocabulary, and tests influence roadmap content.

## 3.4 Vocabulary / Topic / Test Requirements

- Initial content target: about 36 topics, unless the finalized Langeek mapping yields a different approved topic count.
- Each active topic should have more than 40 vocabulary words where source content supports it.
- Topics may include grammar-related content.
- Each topic has 6–10 test/activity questions depending on vocabulary and grammar.
- Supported question/activity types: flashcard, multiple choice, fill-in-the-blank, and vocabulary-to-grammar mapping.
- Vocabulary, tests, and activities must be associated with level/topic context so they can be filtered by selected A1–C2 level.
- Test score formula: `correct answers / total questions × 100%`.

## 3.5 Content Source / Crawler Requirements

- Primary content source for level-based topics and new words: `https://langeek.co/en-VI/vocab/level-based`.
- The system must crawl automatically on a weekly schedule.
- Crawled data must be mapped to internal A1, A2, B1, B2, C1, and C2 levels and to topics/new words.
- Crawled data must be published automatically after successful crawl; Admin pre-approval is not required.
- Admin must still be able to edit, configure, or disable crawled content after publish.
- If Langeek is unavailable or crawl fails, the system must keep the current cached/active content, retry according to configured policy, log the failure, and notify Admin.
- Crawling must comply with Langeek Terms of Service, robots.txt, copyright/licensing restrictions, and reasonable rate limits. If crawling is not legally or technically permitted, the system must fall back to manual import/curation as a risk mitigation path.

## 3.6 Reporting and Export Requirements

Admin reporting must include revenue by day/month/year/total, revenue filtering by payment plan, total users, free vs paid users, new users by day/month, quiz attempts, correct/wrong ratio, AI conversation duration, most learned vocabulary, and Excel/PDF export.

---

# 4. Non-Functional Requirements

## 4.1 Performance Requirements

| Operation | Requirement |
|---|---|
| Page load | P95 < 3 seconds. |
| Normal API | P95 < 1 second. |
| Translate word | P95 < 2 seconds. |
| Submit quiz/test | P95 < 2 seconds. |
| AI text response | P95 < 8 seconds. |
| ElevenLabs audio response | P95 < 10 seconds. |
| Small/medium Excel/PDF export | Complete in < 30 seconds. |
| Scheduled Langeek crawl | Must run as background job and must not degrade learner-facing P95 targets. |

## 4.2 Scalability and Capacity

- v1.1.0 must support at least 20 concurrent users.
- Design should be extensible to 100 concurrent users later.
- Expected user growth: from 0 initial users to about 200 users in 6–12 months.
- Average AI speaking usage: 15 minutes/user/day.
- Complex auto-scaling is not required in v1.1.0.
- Content crawler design should support additional content sources later if needed.

## 4.3 Availability and Reliability

- SLA target: 99% uptime for v1.1.0/MVP.
- Allowed downtime: about 7.3 hours/month.
- Planned maintenance should occur outside peak hours, e.g. 23:00–05:00 Vietnam time.
- External dependency downtime must not cause user data loss.
- Langeek crawl failure must not remove or hide currently active cached content.

## 4.4 Backup and Recovery

- Full database backup weekly.
- Incremental/daily backup daily.
- Daily backup retention: 7 days.
- Weekly backup retention: 4 weeks.
- RPO: maximum data loss 24 hours.
- RTO: restore system within 8 hours after severe incident.
- Crawled content, source metadata, and crawl logs must be included in database backup if stored in database.

## 4.5 Security Requirements

- Authentication: Email/password and Google OAuth.
- Password reset via email is required.
- Token strategy: JWT access token + refresh token.
- 2FA is not required in v1.1.0.
- HTTPS is required.
- Passwords must be hashed.
- Authorization must enforce role and subscription status.
- Paid User is subscription state, not a separate role.
- Do not log passwords, tokens, sensitive audio, or secret API keys.
- Crawler must not bypass access controls, authentication, paywalls, or anti-bot protections.

## 4.6 Privacy and Data Classification

| Classification | Data |
|---|---|
| Public | Landing page, public pricing, product introduction, published learning content. |
| Internal | System configuration, crawler configuration, crawl logs, unpublished or disabled topics/vocabulary/tests. |
| Confidential | User profile, selected learning level, email, quiz results, progress, AI transcript, translation history, payment transaction metadata. |
| Restricted/Sensitive | Password hash, refresh/session tokens, pronunciation audio, OAuth provider IDs, raw external API/crawler payload if stored with sensitive metadata. |

Audio pronunciation attempts are stored for 30 days. Metadata/scores may be stored longer. Full AI conversation audio is not stored by default.

## 4.7 Compliance Requirements

- Privacy Policy and Terms of Service are required.
- Users must be informed about data collection.
- Users may request deletion of personal data.
- Full GDPR, SOC2, ISO27001, HIPAA are not required for v1.1.0 unless scope changes.
- PCI-DSS direct compliance is not required if the system does not store card data and delegates payment to the provider.
- Langeek crawling must comply with Langeek Terms of Service, robots.txt, copyright/licensing restrictions, and rate limits. If crawling is not permitted, manual import/curation is required as fallback.

## 4.8 Accessibility and UI Requirements

- Responsive-first/mobile-friendly UI.
- Supported breakpoints: 375px, 768px, 1024px, 1440px.
- Touch targets at least 44x44px on mobile.
- Target basic WCAG 2.1 AA.
- Keyboard navigation for main forms/buttons.
- Alt text/ARIA labels for important icons/buttons.
- Form errors must not rely only on color.

## 4.9 Localization

- UI language: Vietnamese.
- Learning content: English with Vietnamese explanation/translation.
- Locale: Vietnam.
- Currency: VND.
- Timezone: Asia/Ho_Chi_Minh.

## 4.10 Deployment and Operations

- Environments: Development + Production.
- Hosting/cloud provider: TBD.
- Database hosting: TBD.
- CI/CD: TBD.
- Region: TBD.
- Monitoring: uptime, error rate, API latency, database basic health, external API failure, content crawler job status.
- Alerts: website down, high error rate, abnormal payment failures, Anthropic/ElevenLabs continuous failures, continuous email failures, continuous Langeek crawler failures.
- Alert channel: email by default; Slack/Discord/Zalo TBD.

---

# 5. Requirement Appendix

## 5.1 Business Rules

| Rule ID | Rule |
|---|---|
| BR01 | Guest can only view landing/pricing and cannot access learning features. |
| BR02 | Free Student can converse with AI for only 15 minutes per 5 hours. |
| BR03 | After 5 hours, free Student AI conversation quota resets. |
| BR04 | Successful payment activates Student as Paid User according to purchased plan. |
| BR05 | Paid User can converse with AI without time limit. |
| BR06 | Only Paid User can change ElevenLabs voice/model. |
| BR07 | Admin manages vocabulary tests, payment plans, vocabulary, topics, and crawler/content configuration. |
| BR08 | Test score equals correct answers divided by total questions multiplied by 100%. |
| BR09 | Student-selected level must be one of A1, A2, B1, B2, C1, or C2 and drives roadmap/topic/vocabulary/activity personalization. |
| BR10 | Langeek content sync runs weekly and publishes successfully crawled content automatically without Admin pre-approval. |
| BR11 | Admin may edit or disable crawled content after publish, but disabled content must not appear in learner roadmap/vocabulary/tests. |
| BR12 | If Langeek crawl fails, active cached content remains available while the system retries, logs, and notifies Admin. |

## 5.2 Validation and Application Messages

| Area | Requirement / Message |
|---|---|
| Email validation | Required; valid email with `@` and domain; message: `⚠ Email không hợp lệ.` |
| Password validation | Minimum 8 characters and at least 1 digit; message: `⚠ Mật khẩu phải có ít nhất 8 ký tự và 1 chữ số.` |
| Wrong login | Message: `⚠ Email hoặc mật khẩu không đúng.` |
| Empty auth fields | Message: `⚠ Vui lòng điền đầy đủ thông tin.` |
| Expired token | Redirect login; message: `⚠ Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.` |
| Missing selected level | Require one of A1, A2, B1, B2, C1, C2; message: `⚠ Vui lòng chọn trình độ tiếng Anh của bạn.` |
| Missing quiz answer | Highlight missing items; message: `⚠ Bạn còn X câu chưa trả lời. Vui lòng hoàn thành trước khi nộp bài.` |
| Microphone denied | Message: `🎤 Bạn chưa cấp quyền microphone. Vào Settings → trình duyệt → cho phép mic.` |
| No audio | Message: `🎤 Không nghe thấy gì. Hãy thử nói lại.` |
| Microphone missing | Message: `🎤 Không tìm thấy microphone. Kiểm tra thiết bị.` |
| Unsupported browser | Message: `🎤 Trình duyệt không hỗ trợ. Vui lòng dùng Chrome hoặc Edge.` |
| Anthropic error | Message: `🔄 AI đang bận, vui lòng thử lại sau vài giây.` |
| ElevenLabs error | Fallback text; message: `🔇 Không tạo được âm thanh. Đang hiển thị văn bản thay thế.` |
| Free quota exceeded | Message: `⏱ Bạn đã dùng hết 15 phút luyện nói. Vui lòng quay lại sau khi quota được reset hoặc nâng lên Pro để luyện không giới hạn.` |
| Payment success | Message: `🎉 Chào mừng bạn đến với Pro! Tài khoản đã được kích hoạt.` |
| Payment fail/cancel | Message: `❌ Thanh toán không thành công. Lý do: [reason]` |
| Langeek crawl failure notification | Notify Admin with source URL, failure reason, last successful crawl time, retry status, and cache status. |

## 5.3 Entities and Data Requirements

Entity/schema reference: [./db/schema-draft.sql](./db/schema-draft.sql).  
ER diagram reference: [./diagrams/entity-relationship.puml](./diagrams/entity-relationship.puml).

Main entity groups:

- Identity/Auth: `users`, `user_profile`, `oauth_account`, `user_session`.
- Learning content: `level`, `topic`, `tag`, `topic_word`, `topic_word_tag`; levels must support A1, A2, B1, B2, C1, and C2.
- Content source/sync: `content_source`, `content_crawl_job`, `content_crawl_log`, or equivalent structures for source URL, crawl schedule, source level/topic mapping, crawl status, last successful crawl time, retry status, and error details.
- Progress: `user_topic_progress`, `user_word_progress` with level/topic context.
- Payment/subscription: `payment_plan`, `user_subscription`, `payment_transaction`.
- Quiz/test: `vocabulary_test`, `quiz_question`, `quiz_answer`, `quiz_attempt`, `quiz_attempt_answer`.
- AI quota: `ai_quota_window`.
- Voice/model: `elevenlabs_voice_model`, `user_voice_preference`.
- Speaking/pronunciation: `speaking_session`, `pronunciation_attempt`, `pronunciation_syllable_score`.
- Translation/reporting: `translation_history`, `report_export_history`.

Soft delete via `is_active=false` is required for `topic`, `topic_word`, `vocabulary_test`, and `payment_plan`. Crawled content disabled by Admin must use the same active/soft-disable policy.

## 5.4 External Interfaces

| External System | Purpose | Data/Auth | Sync Strategy |
|---|---|---|---|
| Anthropic API | Analyze answers and support AI conversation. | REST/JSON, API Key, model TBD. | Real-time request/response. |
| ElevenLabs API | Generate TTS/voice/audio. | REST/JSON + audio response, API Key. | Real-time request/response. |
| Payment Provider | Process payment. | Provider/auth TBD. | Webhook/callback + redirect. |
| Resend | Send emails. | REST/JSON, API Key. | Event-driven email sending. |
| Langeek Vocabulary Source | Source for level-based topics and new words. | Public web pages; no API confirmed. | Weekly scheduled crawl with automatic publish, cache fallback, retry, logs, and Admin notification. |

## 5.5 Constraints, Assumptions, Risks

### Constraints

- Responsive website only; no native mobile apps in v1.1.0.
- Payment Provider TBD.
- Deployment/infra TBD.
- Vietnamese UI only.
- Anthropic, ElevenLabs, Resend, and Langeek are external dependencies.
- Langeek crawling must not violate Terms of Service, robots.txt, copyright/licensing restrictions, rate limits, paywalls, or anti-bot controls.

### Assumptions

- Users have stable internet and modern browsers.
- Users grant microphone permission for speaking/pronunciation.
- Payment Provider supports webhook/callback.
- External API keys are valid.
- Admin manages topics, vocabulary, tests, crawler/content configuration, and plans through Admin UI.
- Langeek level-based pages remain publicly accessible and stable enough to crawl weekly.
- User-selected A1–C2 level is sufficient for initial roadmap personalization; auto-scored placement test is not required for v1.1.0.

### Risks

- Anthropic/ElevenLabs outage or latency affects speaking experience.
- AI/TTS cost may increase with usage.
- Payment Provider TBD may affect payment integration timeline.
- Audio storage requires privacy and storage cost control.
- Free quota UX must be clear to avoid user frustration.
- Langeek site structure, availability, licensing, robots.txt, or Terms of Service may prevent or break crawler operation.
- Automatic publish of crawled content may expose incorrect or duplicated vocabulary if validation/deduplication is weak.

## 5.6 Requirements Traceability Index (RTI)

| FR ID | Feature | Requirement | UC | Priority | Status |
|---|---|---|---|---|---|
| FR-01 | F01 View landing page/pricing | System shall support public introduction and pricing access for Guest. | UC01 | Must | Approved |
| FR-02 | F02 Register/login/reset password/OAuth Google | System shall support authentication with email/password, Google OAuth, reset email, JWT/refresh token. | UC02 | Must | Approved |
| FR-03 | F03 Complete onboarding/select level to create personalized roadmap | System shall allow Student to select an English learning level from A1, A2, B1, B2, C1, or C2 during onboarding/profile and save the selected level for personalization. | UC03 | Must | Approved |
| FR-04 | F04 View personalized roadmap | System shall display learning roadmap topics and progress based on the Student's selected A1–C2 level and active content. | UC04 | Must | Approved |
| FR-05 | F05 Learn vocabulary/new vocabulary by level/topic | System shall display vocabulary/new words by selected level and topic, using active crawled or Admin-managed content. | UC05 | Must | Approved |
| FR-06 | F06 Do vocabulary tests/activities | System shall support flashcard, multiple choice, fill-in-the-blank, and grammar mapping activities using active vocabulary for the selected level/topic. | UC06 | Must | Approved |
| FR-07 | F07 Translate English words | System shall support translate unfamiliar English words into Vietnamese. | UC07 | Must | Approved |
| FR-08 | F08 Practice pronunciation | System shall support microphone-based pronunciation practice with feedback/score. | UC08 | Must | Approved |
| FR-09 | F09 Converse with AI | System shall support AI conversation using Anthropic and ElevenLabs where applicable. | UC09 | Must | Approved |
| FR-10 | F10 Enforce free Student AI quota | System shall support free Student AI conversation limited to 15 minutes per 5 hours. | UC09 | Must | Approved |
| FR-11 | F11 Unlimited AI conversation for Paid User | System shall support paid User is not subject to free quota. | UC09 | Must | Approved |
| FR-12 | F12 Paid User changes ElevenLabs voice/model | System shall support paid User can select voice/model preference. | UC11 | Must | Approved |
| FR-13 | F13 Payment / purchase paid plan | System shall support payment flow activates Paid User subscription. | UC10 | Must | Approved |
| FR-14 | F14 Admin analytics/reporting/export | System shall support revenue/user/learning/AI analytics and Excel/PDF exports. | UC12 | Must | Approved |
| FR-15 | F15 Admin manages vocabulary tests | System shall support create/update/soft-disable vocabulary tests. | UC13 | Must | Approved |
| FR-16 | F16 Admin manages payment plans | System shall support create/update/soft-disable payment plans. | UC14 | Must | Approved |
| FR-17 | F17 Admin manages vocabulary and topics | System shall support create/update/soft-disable topics and words, including content that was automatically published after crawl. | UC13 | Must | Approved |
| FR-18 | F18 Langeek content crawler/source sync | System shall automatically crawl level-based topics and new words from `https://langeek.co/en-VI/vocab/level-based` on a weekly schedule and map them to A1–C2 levels/topics. | UC13, UC04, UC05, UC06 | Must | Approved |
| FR-19 | F18 Langeek content crawler/source sync | System shall automatically publish successfully crawled Langeek content without Admin pre-approval while allowing Admin to edit or disable content after publish. | UC13 | Must | Approved |
| FR-20 | F18 Langeek content crawler/source sync | System shall keep current cached content active, retry, log failures, and notify Admin when Langeek is unavailable or crawling fails. | UC13 | Must | Approved |

## 5.7 Open Items / TBD

- Payment Provider specific service: TBD.
- Deployment hosting/cloud provider: TBD.
- Database hosting: TBD.
- CI/CD: TBD.
- Deployment region: TBD.
- Anthropic version/model: TBD.
- Exact onboarding UI fields can be refined, but onboarding must collect enough data and selected A1–C2 level to create roadmap.
- Confirm Langeek Terms of Service, robots.txt, copyright/licensing permission, and acceptable rate limit before implementing crawler.
- Finalize crawler parsing/mapping rules from Langeek level/topic pages to internal `level`, `topic`, and `topic_word` records.
- Finalize retry policy details and Admin notification channel for crawler failures.

---

# 6. References

- Requirements Summary: [./requirements-summary.md](./requirements-summary.md)
- Diagram Index: [./diagrams/README.md](./diagrams/README.md)
- Schema Draft: [./db/schema-draft.sql](./db/schema-draft.sql)
- Change Record CHG-20260606-001: [./changes/change-20260606T000000-feature.md](./changes/change-20260606T000000-feature.md)
