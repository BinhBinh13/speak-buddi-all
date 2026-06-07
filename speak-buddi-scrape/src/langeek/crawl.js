/**
 * Playwright crawl for Langeek level-based vocabulary (S9.3).
 * Live crawl: mỗi level có URL category riêng → lấy topic links → crawl word-list.
 */

const fs = require("fs");
const path = require("path");
const { slugify } = require("./parse");
const { LEVEL_URLS, LEVELS, BASE_INDEX_URL } = require("./levels");

const ORIGIN = "https://langeek.co";

function loadFixture(fixturePath) {
  const resolved = fixturePath
    ? path.resolve(fixturePath)
    : path.resolve(__dirname, "../../../speak-buddi-be/tests/fixtures/langeek_batch.json");
  return JSON.parse(fs.readFileSync(resolved, "utf8"));
}

function resolveUrl(href) {
  if (!href) return null;
  if (href.startsWith("http")) return href;
  return new URL(href, ORIGIN).href;
}

async function waitForPage(page, ms = 1500) {
  await page.waitForLoadState("domcontentloaded", { timeout: 60000 }).catch(() => {});
  await page.waitForTimeout(ms);
}

/**
 * Trích danh sách topic từ trang category level (A1–C2).
 * Mỗi topic có link dạng /vocab/subcategory/{id}/word-list và tiêu đề h3.
 */
async function extractTopicsFromLevelPage(page) {
  return page.evaluate(() => {
    const links = Array.from(
      document.querySelectorAll('a[href*="/vocab/subcategory/"][href$="/word-list"]')
    );
    const seen = new Set();
    const topics = [];

    for (const a of links) {
      const href = a.getAttribute("href") || "";
      const m = href.match(/\/subcategory\/(\d+)\/word-list$/);
      if (!m || seen.has(m[1])) continue;
      seen.add(m[1]);

      let container = a.parentElement;
      let name = "";
      let description = null;

      for (let depth = 0; depth < 12 && container; depth++) {
        const h3 = container.querySelector("h3");
        if (h3) {
          name = h3.textContent.replace(/^\d+\.\s*/, "").trim();
          const subtitle = h3.nextElementSibling;
          if (subtitle) {
            const text = (subtitle.textContent || "").trim();
            const lower = text.toLowerCase();
            if (
              text &&
              !/^\d+\s*từ/.test(lower) &&
              !/^\d+\s*phút/.test(lower) &&
              !lower.includes("bắt đầu")
            ) {
              description = text;
            }
          }
          break;
        }
        container = container.parentElement;
      }

      if (!name) continue;
      topics.push({ subcategoryId: m[1], href, name, description });
    }

    return topics;
  });
}

/**
 * Trích từ vựng từ trang word-list của một subcategory.
 */
async function extractWordsFromWordListPage(page) {
  return page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll("div.tw-bg-item-background"));
    const words = [];

    for (let idx = 0; idx < cards.length; idx++) {
      const card = cards[idx];
      const wordLink = card.querySelector("a[href*='dictionary.langeek.co/en-VI/word/']");
      const word = (wordLink?.textContent || "").trim();
      const meaningEl = card.querySelector("[class*='tw-text-gray-40']");
      const meaning_vi = (meaningEl?.textContent || "").trim();
      if (!word || !meaning_vi) continue;
      words.push({
        word,
        meaning_vi,
        phonetic: null,
        meaning_en: null,
        example_sentence: null,
        display_order: words.length + 1,
      });
    }

    return words;
  });
}

async function crawlLevel(page, code, levelUrl, { rateLimitMs, maxTopics }) {
  await page.goto(levelUrl, { waitUntil: "domcontentloaded", timeout: 60000 });
  await waitForPage(page);

  let topics = await extractTopicsFromLevelPage(page);
  if (maxTopics > 0) {
    topics = topics.slice(0, maxTopics);
  }

  const levelBlock = { code, topics: [] };

  for (let i = 0; i < topics.length; i++) {
    const topic = topics[i];
    const wordListUrl = resolveUrl(topic.href);
    if (!wordListUrl) continue;

    await page.goto(wordListUrl, { waitUntil: "domcontentloaded", timeout: 60000 });
    await waitForPage(page, rateLimitMs);

    const words = await extractWordsFromWordListPage(page);
    if (!words.length) continue;

    levelBlock.topics.push({
      name: topic.name,
      slug: slugify(topic.name, `langeek-${code.toLowerCase()}`),
      description: topic.description || null,
      display_order: i + 1,
      langeek_subcategory_id: topic.subcategoryId,
      words,
    });
  }

  return levelBlock;
}

async function crawlLive({ levelFilter, rateLimitMs = 1000, maxTopics = 0 }) {
  const { chromium } = require("playwright");

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.setDefaultTimeout(60000);

  const result = {
    source_url: BASE_INDEX_URL,
    crawled_at: new Date().toISOString(),
    levels: [],
  };

  try {
    const codes = levelFilter
      ? [levelFilter.toUpperCase()]
      : LEVELS.filter((c) => LEVEL_URLS[c]);

    for (const code of codes) {
      const levelUrl = LEVEL_URLS[code];
      if (!levelUrl) continue;

      const levelBlock = await crawlLevel(page, code, levelUrl, { rateLimitMs, maxTopics });
      if (levelBlock.topics.length) {
        result.levels.push(levelBlock);
      }
    }
  } finally {
    await browser.close();
  }

  return result;
}

async function crawl({ fixture = false, fixturePath, levelFilter, rateLimitMs, maxTopics }) {
  if (fixture) {
    const data = loadFixture(fixturePath);
    if (levelFilter) {
      data.levels = (data.levels || []).filter(
        (l) => l.code.toUpperCase() === levelFilter.toUpperCase()
      );
    }
    return data;
  }
  return crawlLive({ levelFilter, rateLimitMs, maxTopics });
}

module.exports = {
  crawl,
  loadFixture,
  BASE_URL: BASE_INDEX_URL,
  LEVEL_URLS,
  extractTopicsFromLevelPage,
  extractWordsFromWordListPage,
};
