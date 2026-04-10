// One-shot: drop the 3 dead analytics tables on the Maison Neon main
// branch. Pre-drop snapshot lives on the `phase3-pre-drop` child branch.
// Verified by phase3-list-tables.mjs that only these 3 tables exist.
import { readFileSync } from 'node:fs';
import { neon } from '@neondatabase/serverless';

const env = Object.fromEntries(
  readFileSync(new URL('../.env.phase3', import.meta.url), 'utf8')
    .split('\n')
    .filter((l) => l.includes('='))
    .map((l) => {
      const i = l.indexOf('=');
      return [l.slice(0, i), l.slice(i + 1).replace(/^"|"$/g, '')];
    })
);

const sql = neon(env.DATABASE_URL);

console.log('Dropping events...');
await sql`DROP TABLE IF EXISTS events CASCADE`;
console.log('Dropping active_visitors...');
await sql`DROP TABLE IF EXISTS active_visitors CASCADE`;
console.log('Dropping geo_cache...');
await sql`DROP TABLE IF EXISTS geo_cache CASCADE`;

const after = await sql`
  SELECT table_schema, table_name
  FROM information_schema.tables
  WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
  ORDER BY table_schema, table_name
`;

console.log(`\nAfter drop: ${after.length} table(s) remain`);
for (const t of after) {
  console.log(`  ${t.table_schema}.${t.table_name}`);
}
