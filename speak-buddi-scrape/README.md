# speak-buddi-scrape — Langeek crawler (S9.3)

Playwright scraper for [Langeek level-based vocabulary](https://langeek.co/en-VI/vocab/level-based).

## Commands

```bash
npm install
npx playwright install chromium   # only for live crawl

# Fixture mode (default for dev — no network)
npm run crawl:fixture

# Live crawl (requires network + DOM selectors verified)
npm run crawl
```

## Output

JSON batch printed to stdout — consumed by `speak-buddi-be` via subprocess (`services/crawler_job.py`).

## Environment

| Variable | Description |
|---|---|
| `LANGEEK_USE_FIXTURE=true` | CLI defaults to fixture batch |

## Selectors

Live crawl uses defensive selectors in `src/langeek/crawl.js`. Inspect Langeek DOM and update selectors before production crawl.

Fixture data: `../speak-buddi-be/tests/fixtures/langeek_batch.json`
