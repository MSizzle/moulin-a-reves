// Unit tests for the content-collection index (CATALOG-04).
//
// Pins the contract for buildContentIndex() and normalizeText():
//   - buildContentIndex() walks src/content/**/*.md, parses frontmatter via gray-matter,
//     and returns Map<normalizedText, Array<{ file, fieldPath }>>.
//   - String values shorter than 8 chars (after normalization) are excluded.
//   - Image paths (^/images/) and URLs (^https?://) are excluded.
//   - Array indices and object keys flow into the fieldPath (e.g. 'amenities[0]', 'gallery[0].alt').
//
// The tests are self-checking: they read the actual frontmatter values with gray-matter
// directly, then assert that buildContentIndex() returns the same values. Future edits
// to le-moulin.md / pages/le-moulin.md will correctly fail the test if the contract
// drifts. NEVER use curly quotes in this file.

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import matter from 'gray-matter';

import { buildContentIndex, normalizeText } from '../../src/integrations/edit-catalog/content-index.mjs';

test('buildContentIndex finds homes/le-moulin.md tagline', () => {
  // Read the source-of-truth value directly so the test self-checks against the live file.
  const raw = fs.readFileSync('src/content/homes/le-moulin.md', 'utf-8');
  const expected = matter(raw).data.tagline; // "The heart of the compound"

  const idx = buildContentIndex();
  const entries = idx.get(normalizeText(expected));

  assert.ok(Array.isArray(entries), 'Expected an array of entries for tagline');
  assert.ok(entries.length >= 1, 'Expected at least one entry for the tagline');
  const match = entries.find((e) => e.file === 'src/content/homes/le-moulin.md');
  assert.ok(match, 'Expected an entry pointing at src/content/homes/le-moulin.md');
  assert.equal(match.fieldPath, 'tagline');
});

test('buildContentIndex finds pages/le-moulin.md summary', () => {
  const raw = fs.readFileSync('src/content/pages/le-moulin.md', 'utf-8');
  const expected = matter(raw).data.summary;

  const idx = buildContentIndex();
  const entries = idx.get(normalizeText(expected));

  assert.ok(Array.isArray(entries), 'Expected an array of entries for summary');
  assert.ok(entries.length >= 1, 'Expected at least one entry for the summary');
  const match = entries.find((e) => e.file === 'src/content/pages/le-moulin.md');
  assert.ok(match, 'Expected an entry pointing at src/content/pages/le-moulin.md');
  assert.equal(match.fieldPath, 'summary');
});

test('buildContentIndex returns undefined for a string that is not in any frontmatter', () => {
  const idx = buildContentIndex();
  const result = idx.get('this string is definitely not in any frontmatter file 1234567');
  assert.equal(result, undefined);
});

test('normalizeText collapses runs of whitespace and trims', () => {
  assert.equal(normalizeText('  foo   bar\n\nbaz  '), 'foo bar baz');
  assert.equal(normalizeText('hello'), 'hello');
  assert.equal(normalizeText('\t\nhello\tworld\n'), 'hello world');
});

test('buildContentIndex excludes image paths and URLs', () => {
  const idx = buildContentIndex();
  // Image paths and URLs must NOT be indexed even though they are >= 8 char strings.
  assert.equal(idx.get('/images/homes/le-moulin-hero.webp'), undefined);
  // Verify by spot-checking no key in the Map starts with /images/ or http(s)://
  for (const key of idx.keys()) {
    assert.ok(
      !/^\/images\//.test(key),
      'Index should not contain keys that look like image paths: ' + key
    );
    assert.ok(
      !/^https?:\/\//.test(key),
      'Index should not contain keys that look like URLs: ' + key
    );
  }
});

test('buildContentIndex excludes strings shorter than 8 chars', () => {
  const idx = buildContentIndex();
  // 'Le Salon' is 8 chars exactly — should be included if it appears.
  // We test a deliberately too-short string that we know appears as a value somewhere.
  // The slug 'le-moulin' is 9 chars, but check a sure-fire short one:
  assert.equal(idx.get('Yes'), undefined, 'Short string "Yes" must not be indexed');
  assert.equal(idx.get('Le'), undefined, 'Short string "Le" must not be indexed');
  // Verify no Map key has normalized length < 8
  for (const key of idx.keys()) {
    assert.ok(
      key.length >= 8,
      'Index key shorter than 8 chars: ' + JSON.stringify(key)
    );
  }
});

test('buildContentIndex indexes amenities[] array items with bracketed fieldPath', () => {
  const raw = fs.readFileSync('src/content/homes/le-moulin.md', 'utf-8');
  const amenities = matter(raw).data.amenities;
  const target = amenities[0]; // "Fully equipped kitchen"

  const idx = buildContentIndex();
  const entries = idx.get(normalizeText(target));

  assert.ok(Array.isArray(entries), 'Expected entries for amenities[0]');
  const match = entries.find((e) => e.file === 'src/content/homes/le-moulin.md');
  assert.ok(match, 'Expected an entry for amenities[0] in homes/le-moulin.md');
  // fieldPath must encode the array index — shape like 'amenities[0]'
  assert.ok(
    /^amenities\[\d+\]$/.test(match.fieldPath),
    'fieldPath should be amenities[<index>], got: ' + match.fieldPath
  );
});
