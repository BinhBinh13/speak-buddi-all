# Code Review & Optimization Log
**Project:** speak-buddi (monorepo)
**Branch reviewed:** `main` (local: `minh`, 1 commit ahead of origin/main)
**Date:** 2026-06-07
**Reviewed by:** Automated code review (scheduled task)

---

## Summary

| Severity | Count |
|---|---|
| 🔴 Critical (Security) | 3 |
| 🟠 High | 3 |
| 🟡 Medium | 6 |
| 🟢 Low / Code Quality | 8 |

---

## 🔴 CRITICAL — Security

### C-1 · SHA-256 used for password hashing (Backend)
**File:** `speak-buddi-be/routers/auth.py` lines 48, 67, 188

SHA-256 is a fast general-purpose hash, **not a password hash**. It is trivially crackable via rainbow tables or GPU brute-force. All user passwords in the database are currently at risk if the DB is ever compromised.

**Recommendation:** Replace `hashlib.sha256(pw.encode()).hexdigest()` with `bcrypt` or `argon2-cffi`.

```python
# Instead of:
pw_hash = hashlib.sha256(pw.encode()).hexdigest()
hmac.compare_digest(pw_hash, user["password_hash"])

# Use:
import bcrypt
pw_hash = bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()
bcrypt.checkpw(pw.encode(), stored_hash.encode())
```

Add `bcrypt` to `requirements.txt`. Plan a migration to re-hash existing passwords on next login.

---

### C-2 · `/speak` and `/tts` endpoints have no authentication (Backend)
**File:** `speak-buddi-be/routers/ai.py` lines 18, 46

Both endpoints call paid external services (Anthropic + ElevenLabs) but do **not** require a JWT. Any unauthenticated caller can drain API credits.

**Recommendation:** Add `user: dict = Depends(current_user)` to both endpoints:

```python
@router.post("/speak")
async def speak(req: SpeakRequest, user: dict = Depends(current_user)):
    ...

@router.post("/tts")
async def tts(req: TTSRequest, user: dict = Depends(current_user)):
    ...
```

---

### C-3 · Hardcoded JWT secret fallback (Backend)
**File:** `speak-buddi-be/core/config.py` line 13

```python
JWT_SECRET: str = os.getenv("JWT_SECRET", "speakbuddi-secret-change-in-prod")
```

If `JWT_SECRET` is not set in `.env` (e.g., on a new deployment), the app silently uses a well-known string. Anyone who knows the source code can forge valid JWTs.

**Recommendation:** Remove the fallback and fail fast:

```python
JWT_SECRET: str = os.environ["JWT_SECRET"]  # raises KeyError if not set
```

---

## 🟠 HIGH

### H-1 · No rate limiting on any endpoint (Backend)

No rate limiting exists on `/api/auth/login`, `/api/auth/register`, `/speak`, `/tts`, or `/api/translate`. This allows:
- Brute-force credential attacks on login
- Unlimited AI/TTS calls even after fixing C-2
- Cost exploitation via translate endpoint

**Recommendation:** Add `slowapi` (FastAPI-compatible rate limiter):

```python
# requirements.txt: add slowapi
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@router.post("/api/auth/login")
@limiter.limit("10/minute")
async def login(request: Request, ...):
    ...
```

Priority order: `/speak` and `/tts` first (cost risk), then auth endpoints (brute force risk).

---

### H-2 · No input length limits on AI/TTS schema (Backend)
**Files:** `speak-buddi-be/schemas/ai.py`, `speak-buddi-be/schemas/translate.py`

`SpeakRequest.text`, `TTSRequest.text`, and `TranslateRequest.text` have no `max_length`. A user can send megabytes of text to ElevenLabs or Anthropic.

**Recommendation:** Add Pydantic field constraints:

```python
from pydantic import Field

class SpeakRequest(BaseModel):
    text: str = Field(..., max_length=500)
    ...

class TTSRequest(BaseModel):
    text: str = Field(..., max_length=500)

class TranslateRequest(BaseModel):
    text: str = Field(..., max_length=2000)
```

---

### H-3 · `get_ai_reply()` blocks the async event loop (Backend)
**Files:** `speak-buddi-be/routers/ai.py` line 25, `speak-buddi-be/services/ai_service.py`

`translate_text()` is correctly wrapped with `asyncio.to_thread()` in its router. However, `get_ai_reply()` (called from `/speak`) is a synchronous blocking call to the Anthropic SDK made directly from an `async def` route **without** `asyncio.to_thread`. This blocks the entire event loop while waiting for the Claude response.

**Recommendation:** Wrap the call:

```python
# In routers/ai.py
reply_text = await asyncio.to_thread(get_ai_reply, req.text, req.context, req.topic, req.history)
```

Or switch to the async Anthropic client (`anthropic.AsyncAnthropic`).

---

## 🟡 MEDIUM

### M-1 · Duplicate `API_URL` declarations across frontend files
**Files:**
- `src/shared/api/client.js` — `VITE_API_BASE_URL || VITE_API_URL || localhost` (correct)
- `src/shared/auth/authService.js` — `VITE_API_URL` only (missing `VITE_API_BASE_URL` fallback)
- `src/features/vocabulary/VocabularyPage.jsx` — full fallback chain duplicated
- `src/features/speaking/services/speechService.js` — `VITE_API_URL` only

The inconsistency means if `VITE_API_BASE_URL` is set (the canonical var per `client.js`), `speechService` and `authService`'s refresh call will silently use `undefined` as the base URL.

**Recommendation:** Create `src/shared/constants/apiUrl.js` and import from there everywhere:

```js
// src/shared/constants/apiUrl.js
export const API_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  "http://localhost:8000";
```

---

### M-2 · `VocabularyPage.jsx` bypasses `apiClient` for TTS calls
**File:** `speak-buddi-src/features/vocabulary/VocabularyPage.jsx` lines 32–47

The `playWordAudio()` helper uses raw `fetch()` with a manual token read from `localStorage`. This bypasses the `apiClient` auto-refresh logic — if the access token expires mid-session, audio playback will silently fail instead of refreshing and retrying.

**Recommendation:** Move `playWordAudio` to `vocabularyService.js` and route through `apiClient`, or at minimum use the shared `API_URL` constant.

---

### M-3 · `apiClient` returns `undefined` on 401 kick instead of throwing
**File:** `src/shared/api/client.js` lines 52, 60

```js
window.location.href = "/login";
return;  // ← returns undefined to caller
```

Any caller that does `const data = await apiClient(...)` and uses `data` without a null check will silently fail or crash with a TypeError when `data` is `undefined`.

**Recommendation:** Either throw after redirecting, or ensure the redirect always happens before the return:

```js
clearTokens();
window.location.href = "/login";
throw new Error("Session expired");  // prevents caller from proceeding with undefined
```

---

### M-4 · Double `db.commit()` in `user_repo` (Backend)
**File:** `speak-buddi-be/repositories/user_repo.py` — `update_level()` line ~198, `update_onboarding()` line ~221

These functions call `await db.commit()` explicitly, but the `get_db()` dependency in `db/connection.py` **already** calls `await session.commit()` on success. This causes two commits, which is redundant and could mask transaction semantics.

**Recommendation:** Remove the explicit `await db.commit()` calls inside these repository functions. Let `get_db()` manage the transaction lifecycle consistently.

---

### M-5 · Custom hand-rolled JWT implementation (Backend)
**File:** `speak-buddi-be/auth/jwt.py`

The JWT is hand-rolled using `hashlib`/`hmac`. While technically correct for HS256, this bypasses security audits, claim-validation edge cases (e.g., `nbf`, `iss`), and library updates that fix vulnerabilities.

**Recommendation:** Replace with `python-jose[cryptography]` or `PyJWT`:

```python
# pip install python-jose[cryptography]
from jose import jwt, JWTError

def make_access_token(user, is_paid):
    payload = {"sub": str(user["id"]), ..., "exp": datetime.utcnow() + timedelta(minutes=15)}
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")
```

---

### M-6 · No pagination on `/api/tests` endpoint (Backend)
**File:** `speak-buddi-be/routers/quiz.py`

`GET /api/tests` returns all active tests at once. As admin adds more content, this will grow unbounded and cause slow queries and large response payloads.

**Recommendation:** Add `limit`/`offset` (or cursor-based) pagination:

```python
@router.get("/tests")
async def list_tests(limit: int = 20, offset: int = 0, ...):
    ...
```

---

## 🟢 LOW / Code Quality

### L-1 · `@keyframes pulse` defined inline 7 times across components
**Occurrences:** `QuizPage.jsx`, `VocabularyPage.jsx`, and 5 other files

Each component injects `<style>{`@keyframes pulse{...}`}</style>` inline. This causes 7 duplicate style injections in the DOM.

**Recommendation:** Add `@keyframes pulse` once to `src/index.css` and remove all inline `<style>` tags.

---

### L-2 · `alert()` calls still present in `VocabularyPage.jsx`
**File:** `src/features/vocabulary/VocabularyPage.jsx` lines 306, 311

Two `alert()` calls exist for "no quiz found" and "failed to load quiz" error states. The TODO comment acknowledges this.

**Recommendation:** Implement a simple toast state (local `useState`) or use `react-hot-toast` / Bootstrap `Toast`. The pattern from other pages (inline error `<div>`) is preferable to blocking `alert()`.

---

### L-3 · Stale TODO comments referencing completed stories
**Files:** `HeroSection.jsx`, `PricingSection.jsx`, `PricingPage.jsx`

```js
// TODO: Đổi thành /register khi S1.4 hoàn thành
```

S1.4 (Register page) is done. These TODOs are stale and should be cleaned up. Check if the `/register` links are actually wired correctly or still pointing to a placeholder.

---

### L-4 · Deprecated `logout()` still exported from `authService.js`
**File:** `src/shared/auth/authService.js` line 184

The deprecated `logout()` export does `window.location.href = "/login"` bypassing the React router. Any component accidentally importing it instead of `useAuth().logout()` will cause a full page reload.

**Recommendation:** Audit all imports of `logout` from `authService`. If no callers remain, remove the export. If callers exist, migrate them to `useAuth().logout()`.

---

### L-5 · `VocabularyPage.jsx` is 842 lines — should be split
**File:** `src/features/vocabulary/VocabularyPage.jsx`

This single file contains the topic-selector view, the flashcard-learn view, audio logic, progress logic, and quiz navigation. It is harder to maintain and test.

**Recommendation:** Extract into:
- `VocabularyTopicSelector.jsx` — level dropdown + topic grid
- `VocabularyLearnView.jsx` — flashcard + navigation + action buttons
- Move `playWordAudio()` to `vocabularyService.js`

---

### L-6 · `speechService.js` uses `VITE_API_URL` not `VITE_API_BASE_URL`
**File:** `src/features/speaking/services/speechService.js` line 4

See M-1. Specifically, `speechService.js` will break silently if only `VITE_API_BASE_URL` is set in `.env`. The `/speak` route is core functionality.

---

### L-7 · Placeholder `/privacy` and `/terms` routes render `<LandingPage />`
**File:** `src/app/App.jsx` lines 41–42

These placeholder routes will confuse search engines and users. Either implement proper pages or redirect to an external URL.

---

### L-8 · `translate_service.py` uses a fixed `max_tokens=500`
**File:** `speak-buddi-be/services/translate_service.py` line 14

A `max_tokens=500` cap will truncate translations of long texts. The limit should scale with input length or be set higher (e.g., `1024`) since H-2 will cap input at 2000 chars anyway.

---

## Action Priority List

| Priority | Item | Effort |
|---|---|---|
| 1 | **C-1** Replace SHA-256 with bcrypt for passwords | High (requires migration) |
| 2 | **C-2** Add auth to `/speak` and `/tts` | Low |
| 3 | **C-3** Remove JWT secret fallback | Low |
| 4 | **H-1** Add rate limiting (slowapi) | Medium |
| 5 | **H-2** Add max_length to AI/TTS schemas | Low |
| 6 | **H-3** Wrap `get_ai_reply` in `asyncio.to_thread` | Low |
| 7 | **M-1** Centralize `API_URL` constant in frontend | Low |
| 8 | **M-3** Fix `apiClient` undefined return on 401 | Low |
| 9 | **M-4** Remove double `db.commit()` in user_repo | Low |
| 10 | **M-2** Route VocabularyPage TTS through apiClient | Low |
| 11 | **L-1** Extract `@keyframes pulse` to `index.css` | Low |
| 12 | **L-2** Replace `alert()` with inline error state | Low |
| 13 | **L-5** Split `VocabularyPage.jsx` into sub-components | Medium |
| 14 | **M-5** Replace custom JWT with `python-jose` | Medium |
| 15 | **M-6** Add pagination to `/api/tests` | Medium |

---

## Notes

- No `console.log` statements found in the frontend source — clean.
- DB schema uses proper indexes on frequent query paths (`idx_users_role_status`, `idx_user_subscription_user_status`, etc.).
- `get_db()` correctly handles rollback on exception — transaction management is sound aside from M-4.
- `lru_cache` on `get_claude_client()` and `get_elevenlabs_client()` is appropriate for singleton clients.
- `hmac.compare_digest` used for password comparison — correct timing-safe comparison.
- Git history shows active development; code follows consistent patterns per feature module.
