/**
 * LanGeek level category URLs (en-VI).
 * Mỗi URL liệt kê subcategory/topic qua thẻ <a href=".../subcategory/{id}/word-list">.
 */

const LEVEL_URLS = {
  A1: "https://langeek.co/en-VI/vocab/category/1/a1-level",
  A2: "https://langeek.co/en-VI/vocab/category/6/a2-level",
  B1: "https://langeek.co/en-VI/vocab/category/7/b1-level",
  B2: "https://langeek.co/en-VI/vocab/category/8/b2-level",
  C1: "https://langeek.co/en-VI/vocab/category/35/c1-level",
  C2: "https://langeek.co/en-VI/vocab/category/251/c2-level",
};

const LEVELS = Object.keys(LEVEL_URLS);

const BASE_INDEX_URL = "https://langeek.co/en-VI/vocab/level-based";

module.exports = { LEVEL_URLS, LEVELS, BASE_INDEX_URL };
