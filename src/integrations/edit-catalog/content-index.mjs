// Content-collection index for CATALOG-04 hardcoded-text source detection.
// Consumed by the catalog walker (07-03).
//
// Walks src/content/**/*.md, parses each file's YAML frontmatter with gray-matter,
// and returns a Map<normalizedText, Array<{ file, fieldPath }>>. The walker
// (07-03) queries this map per DOM text node: a hit means the hardcoded text is
// anchored to a content-collection source and the catalog can emit a stable
// locator pointing at the .md file's field. A miss means the text is hardcoded
// inline in a .astro file and the catalog must set requiresManualSelection:true
// so Phase 8 PANEL Approve never stashes an unverifiable locator (which would
// fail the v1.1 signalCount() >= 2 rule in validate.ts).
//
// Heuristic for what to index:
//   - String values whose normalizeText() length is >= 8 chars
//   - Exclude any string matching ^/images/ or ^https?://
//   - Numbers, booleans, null are NEVER indexed (only string leaves)
//   - Array entries get bracketed fieldPaths (e.g. 'amenities[0]', 'gallery[3].alt')
//
// NEVER use curly quotes in this file. NEVER import from public/feedback-inject.js.

import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

const MIN_INDEX_LEN = 8;
const IMAGE_PATH_RE = /^\/images\//;
const URL_RE = /^https?:\/\//;

/**
 * Collapse runs of whitespace to a single space and trim. Used both for Map
 * keys and for the length check.
 *
 * @param {string} s
 * @returns {string}
 */
export function normalizeText(s) {
  if (typeof s !== 'string') return '';
  return s.replace(/\s+/g, ' ').trim();
}

/**
 * Synchronous recursive walk of `dir` collecting absolute paths to *.md files.
 *
 * @param {string} dir
 * @param {string[]} acc
 * @returns {string[]}
 */
function walkMarkdownFiles(dir, acc = []) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (_e) {
    // Missing directory is treated as empty rather than fatal — the walker
    // (07-03) can call buildContentIndex on a fresh checkout where src/content
    // has not been created yet.
    return acc;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkMarkdownFiles(full, acc);
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      acc.push(full);
    }
  }
  return acc;
}

/**
 * Depth-first traversal of a parsed frontmatter object. Calls `visit(value, fieldPath)`
 * at every leaf node. Arrays produce bracketed indices in the fieldPath
 * ('amenities[0]'); nested object keys are dot-joined ('gallery[0].alt').
 *
 * @param {unknown} node
 * @param {string} fieldPath
 * @param {(value: unknown, fieldPath: string) => void} visit
 */
function traverse(node, fieldPath, visit) {
  if (node === null || node === undefined) return;
  if (Array.isArray(node)) {
    for (let i = 0; i < node.length; i++) {
      traverse(node[i], fieldPath + '[' + i + ']', visit);
    }
    return;
  }
  if (typeof node === 'object') {
    for (const key of Object.keys(node)) {
      const nextPath = fieldPath ? fieldPath + '.' + key : key;
      traverse(node[key], nextPath, visit);
    }
    return;
  }
  // Leaf — primitive value
  visit(node, fieldPath);
}

/**
 * Build the content-collection index. Returns Map<normalizedText, Array<{file, fieldPath}>>.
 *
 * @param {string} [rootDir='src/content']
 * @returns {Map<string, Array<{ file: string, fieldPath: string }>>}
 */
export function buildContentIndex(rootDir = 'src/content') {
  const index = new Map();
  const files = walkMarkdownFiles(rootDir);

  for (const absPath of files) {
    // Repo-relative path with forward slashes (consistent across OSes).
    const relPath = path.relative(process.cwd(), absPath).split(path.sep).join('/');

    let parsed;
    try {
      const raw = fs.readFileSync(absPath, 'utf-8');
      parsed = matter(raw).data;
    } catch (_e) {
      // Malformed YAML or unreadable file — skip rather than abort the build.
      continue;
    }
    if (!parsed || typeof parsed !== 'object') continue;

    traverse(parsed, '', (value, fieldPath) => {
      if (typeof value !== 'string') return;
      const normalized = normalizeText(value);
      if (normalized.length < MIN_INDEX_LEN) return;
      if (IMAGE_PATH_RE.test(normalized)) return;
      if (URL_RE.test(normalized)) return;
      // Some leaf values match the original string at the trim/whitespace level
      // but the un-normalized form might also be an image path. Check the raw
      // value too so a frontmatter line like '  /images/foo.webp  ' is excluded.
      if (IMAGE_PATH_RE.test(value.trim()) || URL_RE.test(value.trim())) return;

      const existing = index.get(normalized);
      const entry = { file: relPath, fieldPath };
      if (existing) {
        existing.push(entry);
      } else {
        index.set(normalized, [entry]);
      }
    });
  }

  return index;
}
