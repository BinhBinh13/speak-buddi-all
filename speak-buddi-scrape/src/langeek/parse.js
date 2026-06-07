/**
 * Pure helpers for Langeek crawl output (S9.3).
 * Selectors TBD after DOM inspection — fixture mode used for dev/CI.
 */

function slugify(text, prefix = "") {
  const ascii = text
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const slug = ascii || "topic";
  return prefix ? `${prefix}-${slug}` : slug;
}

function normalizeWord(raw, index) {
  const word = String(raw.word || "").trim();
  const meaningVi = String(raw.meaning_vi || "").trim();
  if (!word || !meaningVi) return null;
  return {
    word,
    phonetic: raw.phonetic || null,
    meaning_vi: meaningVi,
    meaning_en: raw.meaning_en || null,
    example_sentence: raw.example_sentence || null,
    display_order: raw.display_order || index,
  };
}

module.exports = { slugify, normalizeWord };
