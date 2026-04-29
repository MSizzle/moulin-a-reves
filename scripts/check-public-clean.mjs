import { existsSync } from "node:fs";

const offenders = [
  "public/Moulin House Photos",
  "public/photo-source",
];

const found = offenders.filter((p) => existsSync(p));

if (found.length) {
  console.error("\n[prebuild] ERROR: raw photo source folders are inside /public/.");
  console.error("[prebuild] These would ship to Vercel and explode the deploy.");
  console.error("[prebuild] Move them to ../photo-source/ outside the repo.\n");
  console.error("[prebuild] Offending paths:");
  for (const p of found) console.error("  - " + p);
  process.exit(1);
}
