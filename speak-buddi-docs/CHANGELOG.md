# CHANGELOG — speak-buddi

## v1.1.0 — 2026-06-06

### Added

- Added Langeek content crawler/source sync for level-based topics and new words from `https://langeek.co/en-VI/vocab/level-based`.
- Added weekly scheduled crawl with automatic publish of successfully crawled content.
- Added cache fallback, retry, failure logging, and Admin notification when Langeek is down or crawl fails.
- Added user-selected A1–C2 level personalization for roadmap, topics, vocabulary/new words, and activities/tests.
- Added crawler/content sync acceptance criteria mapped to UC13 without creating a new UC.

### Changed

- Updated UC03 to use manual user level selection rather than auto-scored placement test.
- Updated UC04, UC05, and UC06 to filter roadmap, vocabulary, and activities/tests by selected level/topic.
- Updated UC13 to include crawler/content configuration and post-publish content management.
- Updated requirements summary and SRS traceability from v1.0.0 to v1.1.0.

### Risks / Notes

- Langeek crawling must comply with Terms of Service, robots.txt, copyright/licensing restrictions, and rate limits.
- If crawling is not permitted, fallback manual curation/import is required.

## v1.0.0 — 2026-06-06

### Added

- Initial SRS created from approved requirements summary.
