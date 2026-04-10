// One-shot: list all tables in the Maison Neon main branch.
// Read DATABASE_URL from .env.phase3 (gitignored) so this script works
// outside of Astro's import.meta.env.
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

if (!env.DATABASE_URL) {
  console.error('DATABASE_URL not found in .env.phase3');
  process.exit(1);
}

const sql = neon(env.DATABASE_URL);

const tables = await sql`
  SELECT table_schema, table_name
  FROM information_schema.tables
  WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
  ORDER BY table_schema, table_name
`;

console.log(`Found ${tables.length} table(s):`);
for (const t of tables) {
  console.log(`  ${t.table_schema}.${t.table_name}`);
}
