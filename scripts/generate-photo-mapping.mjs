#!/usr/bin/env node
// Walks ../photo-source/ and emits a starter mapping JSON to scripts/photo-mapping.json.
// Hand-edit the file afterward (filenames, alt text, useFor) before running process-photos.mjs.

import { readdirSync, statSync, existsSync, writeFileSync } from "node:fs";
import { join, basename, extname, relative, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE_ROOT = resolve(REPO_ROOT, "..", "photo-source");
const OUTPUT_FILE = join(REPO_ROOT, "scripts", "photo-mapping.json");

const FOLDER_RULES = {
  "Moulin a Reve 5 bedrooms": {
    prefix: "le-moulin-",
    targetDir: "public/images/homes",
    useFor: "le-moulin gallery",
  },
  "Hollywood Hideaway": {
    prefix: "hollywood-hideaway-",
    targetDir: "public/images/homes",
    useFor: "hollywood-hideaway gallery",
  },
  "the grange new": {
    prefix: "hollywood-hideaway-grange-",
    targetDir: "public/images/homes",
    useFor: "hollywood-hideaway gallery",
  },
  "River House New": {
    prefix: "maison-de-la-riviere-",
    targetDir: "public/images/homes",
    useFor: "maison-de-la-riviere gallery",
  },
  "gardens moulin": {
    prefix: "",
    targetDir: "public/images",
    useFor: "compound / homepage / about",
  },
};

function slugify(s) {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");
}

function walkJpegs(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    if (entry.startsWith(".")) continue;
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      out.push(...walkJpegs(full));
    } else if (/\.jpe?g$/i.test(entry)) {
      out.push(full);
    }
  }
  return out;
}

if (!existsSync(SOURCE_ROOT)) {
  console.error(`Source directory not found: ${SOURCE_ROOT}`);
  process.exit(1);
}

const folders = readdirSync(SOURCE_ROOT).filter((e) => {
  const full = join(SOURCE_ROOT, e);
  return statSync(full).isDirectory() && !e.startsWith(".");
});

const mapping = {};
const usedTargets = new Set();
let totalPhotos = 0;

for (const folder of folders) {
  const rule = FOLDER_RULES[folder];
  if (!rule) {
    console.warn(`No rule for folder "${folder}" — skipping`);
    continue;
  }
  const folderFull = join(SOURCE_ROOT, folder);
  const photos = walkJpegs(folderFull);
  for (const photoFull of photos) {
    const baseName = basename(photoFull, extname(photoFull));
    const slug = slugify(baseName);
    let target = `${rule.targetDir}/${rule.prefix}${slug}.webp`;
    let n = 2;
    while (usedTargets.has(target)) {
      target = `${rule.targetDir}/${rule.prefix}${slug}-${n}.webp`;
      n += 1;
    }
    usedTargets.add(target);
    const sourceRel = relative(REPO_ROOT, photoFull);
    mapping[sourceRel] = {
      target,
      alt: "TODO: write alt text",
      useFor: rule.useFor,
    };
    totalPhotos += 1;
  }
}

writeFileSync(OUTPUT_FILE, JSON.stringify(mapping, null, 2) + "\n");

console.log(`Wrote mapping for ${totalPhotos} photos across ${folders.length} folders.`);
console.log(`Output: ${relative(REPO_ROOT, OUTPUT_FILE)}`);
console.log(`Next: hand-edit the file (filenames + alt text), then run scripts/process-photos.mjs.`);
