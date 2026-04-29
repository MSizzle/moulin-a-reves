import sharp from "sharp";
import { mkdirSync } from "node:fs";
import { resolve, dirname, basename, extname } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PREVIEW_DIR = resolve(REPO_ROOT, "scripts", "previews");
mkdirSync(PREVIEW_DIR, { recursive: true });

const targets = process.argv.slice(2);
if (!targets.length) {
  console.error("Usage: node make-previews.mjs <relative-source-path> [...]");
  process.exit(1);
}

for (const rel of targets) {
  const src = resolve(REPO_ROOT, rel);
  const out = resolve(PREVIEW_DIR, basename(rel, extname(rel)).replace(/[^a-z0-9]+/gi, "-") + ".webp");
  await sharp(src).rotate().resize({ width: 600, withoutEnlargement: true }).webp({ quality: 70 }).toFile(out);
  console.log(out);
}
