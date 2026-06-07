# speak-buddi-scrape — Langeek crawler (S9.3)

Playwright scraper for [LanGeek level-based vocabulary](https://langeek.co/en-VI/vocab/level-based).

## Level URLs

| Level | Category URL |
|---|---|
| A1 | https://langeek.co/en-VI/vocab/category/1/a1-level |
| A2 | https://langeek.co/en-VI/vocab/category/6/a2-level |
| B1 | https://langeek.co/en-VI/vocab/category/7/b1-level |
| B2 | https://langeek.co/en-VI/vocab/category/8/b2-level |
| C1 | https://langeek.co/en-VI/vocab/category/35/c1-level |
| C2 | https://langeek.co/en-VI/vocab/category/251/c2-level |

Flow: category page → topic links (`/vocab/subcategory/{id}/word-list`) → word cards on word-list page.

## Commands

```bash
npm install
npx playwright install chromium   # only for live crawl

# Fixture mode (default for dev — no network)
npm run crawl:fixture

# Live crawl — all levels (slow: ~32 topics × 6 levels)
npm run crawl

# Single level, limit topics (dev smoke test)
node src/cli.js --level A1 --max-topics 2
```

## Output

JSON batch printed to stdout — consumed by `speak-buddi-be` via subprocess (`services/crawler_job.py`).

## CLI flags

| Flag | Description |
|---|---|
| `--fixture` | Use fixture JSON instead of live crawl |
| `--level A1` | Crawl one CEFR level only |
| `--rate-limit 1000` | Delay (ms) between topic word-list pages |
| `--max-topics N` | Limit topics per level (`0` = all) |

## Environment

| Variable | Description |
|---|---|
| `LANGEEK_USE_FIXTURE=true` | Backend defaults to fixture batch |

Fixture data: `../speak-buddi-be/tests/fixtures/langeek_batch.json`
