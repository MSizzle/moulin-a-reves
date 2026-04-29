import sharp from "sharp";
import { mkdirSync, readFileSync } from "node:fs";
import { resolve, dirname, basename, extname } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PREVIEW_DIR = resolve(REPO_ROOT, "scripts", "previews");
mkdirSync(PREVIEW_DIR, { recursive: true });

const mapping = JSON.parse(readFileSync(resolve(REPO_ROOT, "scripts/photo-mapping.json"), "utf8"));

let i = 0;
const tasks = Object.keys(mapping).map(async (rel, idx) => {
  const src = resolve(REPO_ROOT, rel);
  // Use index-prefix so previews sort same order as mapping iteration
  const slug = basename(rel, extname(rel)).replace(/[^a-z0-9]+/gi, "-").toLowerCase().replace(/^-+|-+$/g, "");
  const out = resolve(PREVIEW_DIR, String(idx).padStart(3, "0") + "_" + slug + ".webp");
  await sharp(src).rotate().resize({ width: 500, withoutEnlargement: true }).webp({ quality: 65 }).toFile(out);
  i += 1;
  if (i % 10 === 0) console.log(`  ${i} / ${Object.keys(mapping).length} done`);
  return out;
});

await Promise.all(tasks);
console.log(`\nDone: ${i} previews in ${PREVIEW_DIR}`);
