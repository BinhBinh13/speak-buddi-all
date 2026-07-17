"""
speak-buddi Playwright bot — simulate 10–20 real users/day on speakbuddi.com
Tuned for GA4 "engaged session": ≥10s on page + multiple page views.
Supports returning users via saved storage_state (GA4 _ga cookie persistence).
Supports login, register, and onboarding flows.

Setup:
  pip install playwright faker
  playwright install chromium

  # Login flow (visit protected routes with fixed account):
  set BOT_EMAIL=test@example.com
  set BOT_PASSWORD=yourpassword

  # Register flow (create new fake accounts + complete onboarding):
  set BOT_REGISTER=true        # enable register flow for new-user simulation
  set BOT_REG_DOMAIN=bot.test  # fake email domain (default: gmail.com)

  # One-off overrides (unset = default random pacing):
  set BOT_RETURNING_COUNT=1    # exact number of returning users this run
  set BOT_NEW_COUNT=0          # exact number of new users this run
  set BOT_SESSION_MINUTES=15   # keep each session browsing until this many minutes elapse

Run:
  python scripts/bot_playwright.py
"""

import asyncio
import random
import logging
import os
import time
from datetime import datetime
from pathlib import Path
from playwright.async_api import async_playwright
from faker import Faker

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger(__name__)

BASE_URL = "https://speakbuddi.com"
fake = Faker(["vi_VN", "en_US"])

# Login credentials (existing account)
BOT_EMAIL      = os.environ.get("BOT_EMAIL", "")
BOT_PASSWORD   = os.environ.get("BOT_PASSWORD", "")

# Register flow — enabled by default so new users go through register+onboarding
# Set BOT_REGISTER=false to disable
BOT_REGISTER   = os.environ.get("BOT_REGISTER", "true").lower() not in ("0", "false", "no")
BOT_REG_DOMAIN = os.environ.get("BOT_REG_DOMAIN", "gmail.com")

# Saved user profiles persist _ga cookies between runs → "returning users" in GA4
USER_PROFILES_DIR = Path(__file__).parent / "user_profiles"
USER_PROFILES_DIR.mkdir(exist_ok=True)
MAX_SAVED_PROFILES = 20

# One-off overrides for a single run (unset = default random pacing)
BOT_RETURNING_COUNT  = os.environ.get("BOT_RETURNING_COUNT")
BOT_NEW_COUNT         = os.environ.get("BOT_NEW_COUNT")
BOT_SESSION_MINUTES   = os.environ.get("BOT_SESSION_MINUTES")
SESSION_TARGET_SECONDS = float(BOT_SESSION_MINUTES) * 60 if BOT_SESSION_MINUTES else None

DEVICES = [
    {"width": 1440, "height": 900,  "is_mobile": False, "ua": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/125.0 Safari/537.36"},
    {"width": 1280, "height": 800,  "is_mobile": False, "ua": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/124.0 Safari/537.36"},
    {"width": 390,  "height": 844,  "is_mobile": True,  "ua": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1"},
    {"width": 412,  "height": 915,  "is_mobile": True,  "ua": "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 Chrome/124.0 Mobile Safari/537.36"},
    {"width": 768,  "height": 1024, "is_mobile": False, "ua": "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1"},
]

# Auth pages visited once per session (not re-sampled)
AUTH_PAGES      = ["/login", "/register"]
# Non-auth public pages that can be browsed freely
PUBLIC_PAGES    = ["/", "/forgot-password"]
PROTECTED_PAGES = ["/roadmap", "/vocabulary", "/quiz", "/pronunciation", "/conversation", "/translate", "/profile"]

ONBOARDING_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"]
ONBOARDING_GOALS  = ["travel", "work", "communication"]
ONBOARDING_WORDS  = [5, 10, 0]


def get_saved_profiles():
    return sorted(USER_PROFILES_DIR.glob("user_*.json"))


def fake_register_data():
    first = fake.first_name()
    last  = fake.last_name()
    slug  = f"{first.lower()}{last.lower()}{random.randint(100,9999)}"
    email = f"{slug}@{BOT_REG_DOMAIN}"
    pwd   = f"Bot@{random.randint(10000,99999)}!"
    return {"name": f"{first} {last}", "email": email, "password": pwd}


async def scroll_page(page):
    steps = random.randint(3, 6)
    for _ in range(steps):
        await page.evaluate("window.scrollBy(0, window.innerHeight * 0.5)")
        await page.wait_for_timeout(random.randint(600, 1500))
    await page.evaluate("window.scrollTo(0, 0)")
    await page.wait_for_timeout(500)


async def visit_page(page, path, wait_min=4000, wait_max=12000):
    log.info(f"  → {path}")
    try:
        await page.goto(f"{BASE_URL}{path}", wait_until="domcontentloaded", timeout=20000)
        await page.wait_for_timeout(random.randint(wait_min, wait_max))
        await scroll_page(page)
        await page.wait_for_timeout(random.randint(2000, 5000))
    except Exception as e:
        log.warning(f"  ⚠ {path} failed: {e}")


async def try_interact(page):
    """Click a non-navigation button (avoid a[href] — each link click = extra GA4 page view)."""
    try:
        buttons = await page.query_selector_all("button:not([type='submit'])")
        if buttons:
            btn = random.choice(buttons[:5])
            await btn.click()
            await page.wait_for_timeout(random.randint(1000, 2000))
    except Exception:
        pass


async def do_login(page) -> bool:
    """Fill login form, wait for JWT in localStorage. Returns True on success."""
    if not BOT_EMAIL or not BOT_PASSWORD:
        return False

    log.info("  → Logging in…")
    try:
        await page.goto(f"{BASE_URL}/login", wait_until="domcontentloaded", timeout=20000)
        await page.wait_for_timeout(random.randint(1500, 3000))

        await page.fill("#sb-email", BOT_EMAIL)
        await page.wait_for_timeout(random.randint(400, 800))
        await page.fill("#sb-password", BOT_PASSWORD)
        await page.wait_for_timeout(random.randint(400, 800))

        await page.click("button[type='submit']")
        await page.wait_for_function("() => !!localStorage.getItem('token')", timeout=10000)
        log.info("  ✓ Login success")
        return True
    except Exception as e:
        log.warning(f"  ⚠ Login failed: {e}")
        return False


async def do_register(page) -> bool:
    """Fill register form with fake data. Returns True when navigated to /onboarding."""
    data = fake_register_data()
    log.info(f"  → Registering as {data['email']}…")
    try:
        await page.goto(f"{BASE_URL}/register", wait_until="domcontentloaded", timeout=20000)
        await page.wait_for_timeout(random.randint(2000, 4000))

        # Simulate typing: fill each field with a small delay
        await page.fill("#sb-name", data["name"])
        await page.wait_for_timeout(random.randint(400, 700))
        await page.fill("#sb-email", data["email"])
        await page.wait_for_timeout(random.randint(400, 700))
        await page.fill("#sb-password", data["password"])
        await page.wait_for_timeout(random.randint(400, 700))
        await page.fill("#sb-confirm", data["password"])
        await page.wait_for_timeout(random.randint(600, 1000))

        await page.click("button[type='submit']")

        # Wait for redirect to /onboarding (means register succeeded)
        await page.wait_for_url(f"{BASE_URL}/onboarding", timeout=12000)
        log.info("  ✓ Register success → /onboarding")
        return True
    except Exception as e:
        log.warning(f"  ⚠ Register failed: {e}")
        return False


async def do_onboarding(page) -> bool:
    """Complete the 3-step onboarding wizard. Returns True when finished."""
    log.info("  → Onboarding…")
    try:
        num_steps = 3  # Level → Goal → Words
        for step_idx in range(num_steps):
            await page.wait_for_timeout(random.randint(1500, 3000))

            cards = await page.query_selector_all("button[aria-pressed]")
            if cards:
                # On WordsStep (last step), avoid selecting "0 words" which redirects to /speaking
                if step_idx == num_steps - 1:
                    # Pick first or second card (5 or 10 words), skip third (0 words)
                    safe_cards = cards[:2] if len(cards) >= 2 else cards
                    await random.choice(safe_cards).click()
                else:
                    await random.choice(cards).click()
                await page.wait_for_timeout(random.randint(800, 1500))

            if step_idx < num_steps - 1:
                continue_btn = page.locator("button", has_text="Tiếp tục")
            else:
                continue_btn = page.locator("button", has_text="Hoàn tất")
            await continue_btn.click(force=True)

            if step_idx < num_steps - 1:
                await page.wait_for_timeout(random.randint(500, 1000))
            else:
                try:
                    await page.wait_for_url(f"{BASE_URL}/roadmap", timeout=25000)
                    log.info("  ✓ Onboarding complete → /roadmap")
                except Exception:
                    log.info("  ↪ Onboarding API slow — navigating /roadmap directly")
                    await page.goto(f"{BASE_URL}/roadmap", wait_until="domcontentloaded", timeout=15000)

        return True
    except Exception as e:
        log.warning(f"  ⚠ Onboarding failed: {e}")
        return False


async def browse_session(page, authenticated: bool = False, already_visited_pages: int = 0, is_returning: bool = False, target_seconds: float | None = None, visit_landing: bool = True):
    """Core browsing flow. Fewer views, longer dwell per view → higher avg session duration.

    If target_seconds   is set, ignore view-count pacing and keep visiting pages
    (re-sampling as needed) until that much wall-clock time has elapsed.

    visit_landing=False when the caller already navigated the user to a page
    (e.g. returning user's initial goto, or post-onboarding /roadmap) — avoids
    an extra, unrealistic revisit to "/" that inflates views/session.
    """
    start = time.monotonic()
    target_total = random.randint(5, 7)
    remaining = max(0, target_total - already_visited_pages)

    if target_seconds is None and remaining <= 0:
        return

    if visit_landing:
        # 1. Landing page — read carefully
        log.info("  → Landing page")
        await page.goto(BASE_URL, wait_until="domcontentloaded")
        await page.wait_for_timeout(random.randint(20000, 35000))
        await scroll_page(page)
        await page.wait_for_timeout(random.randint(12000, 20000))
        remaining -= 1

        if target_seconds is None and remaining <= 0:
            return
        if target_seconds is not None and time.monotonic() - start >= target_seconds:
            return

    # 2. Visit one auth page exactly once (realistic: user lands on login/register once)
    if not authenticated:
        await visit_page(page, random.choice(AUTH_PAGES), 15000, 28000)
        await try_interact(page)
        remaining -= 1

    if target_seconds is None and remaining <= 0:
        return
    if target_seconds is not None and time.monotonic() - start >= target_seconds:
        return

    # 3. Browse feature pages
    if authenticated and is_returning:
        # Returning users go straight to the core app loop: roadmap + conversation
        pool = ["/roadmap", "/conversation"]
    elif authenticated:
        pool = PROTECTED_PAGES[:]
    else:
        pool = [p for p in PUBLIC_PAGES if not (is_returning and p == "/forgot-password")]

    if target_seconds is not None:
        # Time-based pacing: keep visiting (re-sampling) until target duration reached
        last_path = None
        while time.monotonic() - start < target_seconds:
            choices = [p for p in pool if p != last_path] or pool
            path = random.choice(choices)
            last_path = path
            await visit_page(page, path, 25000, 45000)
            if random.random() < 0.5:
                await try_interact(page)
        return

    # Default: view-count pacing — visit enough distinct pages to hit the target
    pages_to_visit = random.sample(pool, k=min(remaining, len(pool)))
    for path in pages_to_visit[:remaining]:
        await visit_page(page, path, 25000, 45000)
        if random.random() < 0.5:
            await try_interact(page)


async def simulate_new_user(browser, user_index):
    device = random.choice(DEVICES)
    log.info(f"[User {user_index+1}] NEW | {'mobile' if device['is_mobile'] else 'desktop'} {device['width']}x{device['height']}")

    context = await browser.new_context(
        viewport={"width": device["width"], "height": device["height"]},
        user_agent=device["ua"],
        locale=random.choice(["vi-VN", "en-US"]),
        timezone_id=random.choice(["Asia/Ho_Chi_Minh", "Asia/Bangkok", "Asia/Singapore"]),
        is_mobile=device["is_mobile"],
    )
    page = await context.new_page()
    try:
        authenticated = False
        pages_so_far = 0

        # New users always go through register + onboarding (login is returning-user only)
        if BOT_REGISTER:
            registered = await do_register(page)
            if registered:
                pages_so_far += 1  # /register
                await do_onboarding(page)
                pages_so_far += 1  # /roadmap (post-onboarding)
                authenticated = True

        await browse_session(page, authenticated=authenticated, already_visited_pages=pages_so_far, target_seconds=SESSION_TARGET_SECONDS, visit_landing=not authenticated)

        saved = get_saved_profiles()
        if len(saved) < MAX_SAVED_PROFILES:
            profile_path = USER_PROFILES_DIR / f"user_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{user_index}.json"
            await context.storage_state(path=str(profile_path))
            log.info(f"  ✓ Profile saved → {profile_path.name}")

    except Exception as e:
        log.warning(f"[User {user_index+1}] error: {e}")
    finally:
        await context.close()

    log.info(f"[User {user_index+1}] done ✓")


async def simulate_returning_user(browser, profile_path, user_index):
    device = random.choice(DEVICES)
    log.info(f"[User {user_index+1}] RETURNING ({profile_path.name}) | {'mobile' if device['is_mobile'] else 'desktop'} {device['width']}x{device['height']}")

    context = await browser.new_context(
        storage_state=str(profile_path),
        viewport={"width": device["width"], "height": device["height"]},
        user_agent=device["ua"],
        locale=random.choice(["vi-VN", "en-US"]),
        timezone_id=random.choice(["Asia/Ho_Chi_Minh", "Asia/Bangkok", "Asia/Singapore"]),
        is_mobile=device["is_mobile"],
    )
    page = await context.new_page()
    try:
        await page.goto(BASE_URL, wait_until="domcontentloaded", timeout=20000)

        # Returning users should never land on /onboarding — skip if app redirects there
        if "/onboarding" in page.url:
            log.info("  ↪ Redirected to /onboarding — skipping (returning user)")
            await page.goto(f"{BASE_URL}/roadmap", wait_until="domcontentloaded", timeout=15000)

        token = await page.evaluate("() => localStorage.getItem('token')")
        pages_so_far = 1  # landing page just visited

        if token:
            log.info("  ✓ Token found in saved profile — visiting protected pages")
            authenticated = True
        else:
            authenticated = await do_login(page)
            if authenticated:
                pages_so_far += 1  # /login
                # After login, app may redirect to /onboarding — skip it
                await page.wait_for_timeout(2000)
                if "/onboarding" in page.url:
                    log.info("  ↪ Post-login redirect to /onboarding — skipping")
                    await page.goto(f"{BASE_URL}/roadmap", wait_until="domcontentloaded", timeout=15000)

        await browse_session(page, authenticated=authenticated, already_visited_pages=pages_so_far, is_returning=True, target_seconds=SESSION_TARGET_SECONDS, visit_landing=False)
        await context.storage_state(path=str(profile_path))
    except Exception as e:
        log.warning(f"[User {user_index+1}] error: {e}")
    finally:
        await context.close()

    log.info(f"[User {user_index+1}] done ✓")


async def main():
    saved_profiles = get_saved_profiles()

    returning_count = min(len(saved_profiles), random.randint(1, 15))
    new_count = random.randint(0, 5)

    if BOT_RETURNING_COUNT is not None:
        returning_count = min(len(saved_profiles), int(BOT_RETURNING_COUNT))
    if BOT_NEW_COUNT is not None:
        new_count = int(BOT_NEW_COUNT)

    modes = []
    if BOT_REGISTER: modes.append("register+onboarding")
    if BOT_EMAIL:    modes.append("login")
    if not modes:    modes.append("public-only")
    log.info(f"=== speak-buddi bot | {datetime.now().strftime('%Y-%m-%d %H:%M')} | {returning_count} returning users | {len(saved_profiles)} saved profiles | mode: {', '.join(modes)} ===")
    returning_profiles = random.sample(saved_profiles, returning_count) if returning_count else []

    log.info(f"  New: {new_count} | Returning: {returning_count}")

    tasks = []
    idx = 0
    for profile in returning_profiles:
        tasks.append(("returning", profile, idx)); idx += 1
    for _ in range(new_count):
        tasks.append(("new", None, idx)); idx += 1
    random.shuffle(tasks)

    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=True)

        batch_size = 2
        for i in range(0, len(tasks), batch_size):
            batch = tasks[i : i + batch_size]
            coros = []
            for kind, profile, user_idx in batch:
                if kind == "returning":
                    coros.append(simulate_returning_user(browser, profile, user_idx))
                else:
                    coros.append(simulate_new_user(browser, user_idx))
            await asyncio.gather(*coros)
            await asyncio.sleep(random.uniform(3, 8))

        await browser.close()

    log.info(f"=== Done: {new_count} new + {returning_count} returning ===")


if __name__ == "__main__":
    asyncio.run(main())
