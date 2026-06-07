#!/usr/bin/env node
/**
 * CLI — output Langeek batch JSON to stdout for speak-buddi-be subprocess.
 *
 * Usage:
 *   node src/cli.js --fixture
 *   node src/cli.js --level A1
 *   npm run crawl
 */

const { crawl } = require("./langeek/crawl");

function parseArgs(argv) {
  const opts = {
    fixture: false,
    level: null,
    fixturePath: null,
    rateLimitMs: 1000,
    maxTopics: 0,
    fail: false,
  };
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--fixture") opts.fixture = true;
    else if (arg === "--fail") opts.fail = true;
    else if (arg === "--level" && argv[i + 1]) opts.level = argv[++i];
    else if (arg === "--fixture-path" && argv[i + 1]) opts.fixturePath = argv[++i];
    else if (arg === "--rate-limit" && argv[i + 1]) opts.rateLimitMs = Number(argv[++i]);
    else if (arg === "--max-topics" && argv[i + 1]) opts.maxTopics = Number(argv[++i]);
  }
  return opts;
}

async function main() {
  const opts = parseArgs(process.argv);
  if (opts.fail) {
    console.error("Simulated Langeek crawl failure (S9.4 --fail)");
    process.exit(1);
  }
  try {
    const batch = await crawl({
      fixture: opts.fixture,
      fixturePath: opts.fixturePath,
      levelFilter: opts.level,
      rateLimitMs: opts.rateLimitMs,
      maxTopics: opts.maxTopics,
    });
    process.stdout.write(JSON.stringify(batch));
  } catch (err) {
    console.error(err.message || err);
    process.exit(1);
  }
}

main();
