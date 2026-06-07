/**
 * Playwright crawl for Langeek level-based vocabulary (S9.3).
 * Live crawl requires `npx playwright install chromium`.
 * Falls back to embedded minimal sample when --fixture is passed.
 */

const fs = require("fs");
const path = require("path");
const { slugify } = require("./parse");

const BASE_URL = "https://langeek.co/en-VI/vocab/level-based";
const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];

function loadFixture(fixturePath) {
  const resolved = fixturePath
    ? path.resolve(fixturePath)
    : path.resolve(__dirname, "../../../speak-buddi-be/tests/fixtures/langeek_batch.json");
  return JSON.parse(fs.readFileSync(resolved, "utf8"));
}

async function crawlLive({ levelFilter, rateLimitMs = 1000 }) {
  const { chromium } = require("playwright");

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const result = { source_url: BASE_URL, crawled_at: new Date().toISOString(), levels: [] };

  try {
    await page.goto(BASE_URL, { waitUntil: "domcontentloaded", timeout: 60000 });

    for (const code of LEVELS) {
      if (levelFilter && levelFilter.toUpperCase() !== code) continue;

      const levelBlock = { code, topics: [] };
      // Defensive selectors — adjust after DOM inspection (see README)
      const topicLinks = await page.$$eval(
        `a[href*="/vocab/"][href*="${code.toLowerCase()}"]`,
        (anchors) =>
          anchors.slice(0, 3).map((a) => ({
            name: (a.textContent || "").trim(),
            href: a.getAttribute("href") || "",
          }))
      );

      for (let i = 0; i < topicLinks.length; i++) {
        const link = topicLinks[i];
        if (!link.name) continue;
        const topicUrl = link.href.startsWith("http")
          ? link.href
          : new URL(link.href, BASE_URL).href;

        await page.goto(topicUrl, { waitUntil: "domcontentloaded", timeout: 60000 });
        await page.waitForTimeout(rateLimitMs);

        const words = await page.$$eval(
          "[data-word], .word-item, .vocab-item",
          (nodes) =>
            nodes.slice(0, 20).map((el, idx) => ({
              word: (el.getAttribute("data-word") || el.textContent || "").trim(),
              meaning_vi: el.getAttribute("data-meaning-vi") || "nghĩa mẫu",
              display_order: idx + 1,
            }))
        );

        levelBlock.topics.push({
          name: link.name,
          slug: slugify(link.name, `langeek-${code.toLowerCase()}`),
          description: null,
          display_order: i + 1,
          words: words.filter((w) => w.word),
        });
      }

      if (levelBlock.topics.length) {
        result.levels.push(levelBlock);
      }
    }
  } finally {
    await browser.close();
  }

  return result;
}

async function crawl({ fixture = false, fixturePath, levelFilter, rateLimitMs }) {
  if (fixture) {
    const data = loadFixture(fixturePath);
    if (levelFilter) {
      data.levels = (data.levels || []).filter(
        (l) => l.code.toUpperCase() === levelFilter.toUpperCase()
      );
    }
    return data;
  }
  return crawlLive({ levelFilter, rateLimitMs });
}

module.exports = { crawl, loadFixture, BASE_URL };
