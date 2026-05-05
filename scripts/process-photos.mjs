#!/usr/bin/env node
// Reads scripts/photo-mapping.json and produces optimized WebPs at the target paths.
// Idempotent: skips a target if it already exists and is newer than the source.
// Bails if any entry has a missing/TODO alt (we won't ship empty alts).

import sharp from "sharp";
import { readFileSync, statSync, existsSync, mkdirSync, copyFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const MAPPING = JSON.parse(readFileSync(resolve(REPO_ROOT, "scripts/photo-mapping.json"), "utf8"));

const MAX_WIDTH = 2000;
const QUALITY = 85;
const CONCURRENCY = 8;

const entries = Object.entries(MAPPING);
const badAlts = entries.filter(([, v]) => !v.alt || /^TODO/i.test(v.alt.trim()));
if (badAlts.length) {
  console.error(`ERROR: ${badAlts.length} entries have missing/TODO alt text. Aborting.`);
  for (const [k] of badAlts) console.error("  -", k);
  process.exit(1);
}

let processed = 0;
let skipped = 0;
let failed = 0;
const startMs = Date.now();
let totalBytesIn = 0;
let totalBytesOut = 0;

async function processEntry([sourceRel, entry]) {
  const source = resolve(REPO_ROOT, sourceRel);
  if (!existsSync(source)) {
    console.error(`MISSING SOURCE: ${sourceRel}`);
    failed += 1;
    return;
  }
  const targets = Array.isArray(entry.target) ? entry.target : [entry.target];
  const primaryTarget = resolve(REPO_ROOT, targets[0]);
  const sourceStat = statSync(source);
  const mappingMtime = statSync(resolve(REPO_ROOT, "scripts/photo-mapping.json")).mtimeMs;

  // Idempotency check: skip only if all targets exist AND are newer than BOTH source and mapping file.
  // Comparing against mapping.json catches the case where source mtime is stale (zip-extracted) but
  // we changed target/alt. Overwrite entries are forced through if the mapping was just updated.
  const newest = Math.max(sourceStat.mtimeMs, mappingMtime);
  const allFresh = targets.every((t) => {
    const tAbs = resolve(REPO_ROOT, t);
    return existsSync(tAbs) && statSync(tAbs).mtimeMs >= newest;
  });
  if (allFresh) {
    skipped += 1;
    return;
  }

  mkdirSync(dirname(primaryTarget), { recursive: true });
  try {
    await sharp(source)
      .rotate()
      .resize({ width: MAX_WIDTH, withoutEnlargement: true })
      .webp({ quality: QUALITY })
      .toFile(primaryTarget);
  } catch (err) {
    console.error(`FAILED: ${sourceRel}\n  ${err.message.split("\n")[0]}`);
    failed += 1;
    return;
  }

  // For multi-target entries (e.g., 084 → group-dinner + barn-events), copy primary to siblings
  for (const t of targets.slice(1)) {
    const tAbs = resolve(REPO_ROOT, t);
    mkdirSync(dirname(tAbs), { recursive: true });
    copyFileSync(primaryTarget, tAbs);
  }

  totalBytesIn += sourceStat.size;
  for (const t of targets) totalBytesOut += statSync(resolve(REPO_ROOT, t)).size;
  processed += 1;
  if (processed % 10 === 0) {
    console.log(`  ${processed} processed (${skipped} skipped) ...`);
  }
}

// Process with bounded concurrency. Sharp/libvips can crash when invoked on too many large
// images at once, so we cap parallel work even though the per-task work itself is async.
const queue = entries.slice();
async function worker() {
  for (;;) {
    const task = queue.shift();
    if (!task) return;
    await processEntry(task);
  }
}
await Promise.all(Array.from({ length: CONCURRENCY }, worker));

const elapsedSec = ((Date.now() - startMs) / 1000).toFixed(1);
const mb = (b) => (b / 1024 / 1024).toFixed(1);
console.log(`\nDone in ${elapsedSec}s.`);
console.log(`  processed: ${processed}`);
console.log(`  skipped (up-to-date): ${skipped}`);
console.log(`  failed: ${failed}`);
console.log(`  source bytes: ${mb(totalBytesIn)} MB → output: ${mb(totalBytesOut)} MB`);

if (failed) process.exit(1);
