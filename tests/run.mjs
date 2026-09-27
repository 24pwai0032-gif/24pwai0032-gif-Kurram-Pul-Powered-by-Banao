#!/usr/bin/env node
// Runs every tests/unit/*.test.mjs in its own Node process (they load the app's TypeScript
// directly, via Node's type stripping and the path-alias loader) and fails if any test fails.
// Needs Node 22.18+ or 24+. Run with `npm test`.
import { spawnSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

const dir = fileURLToPath(new URL("./unit/", import.meta.url));
// --import takes a URL (a bare Windows path like C:\… is read as a URL scheme).
const register = new URL("./register-alias.mjs", import.meta.url).href;
const files = readdirSync(dir).filter((f) => f.endsWith(".test.mjs")).sort();

let failed = 0;
for (const file of files) {
  const run = spawnSync(
    process.execPath,
    ["--disable-warning=MODULE_TYPELESS_PACKAGE_JSON", "--disable-warning=ExperimentalWarning", "--import", register, dir + file],
    { encoding: "utf8" },
  );
  const out = `${run.stdout}${run.stderr}`;
  const ok = run.status === 0;
  if (!ok) failed++;
  const passes = (out.match(/^PASS/gm) ?? []).length;
  console.log(`${ok ? "✓" : "✗"} ${file}  (${passes} checks)`);
  if (!ok) console.log(out.split("\n").filter((l) => !l.startsWith("PASS")).map((l) => `    ${l}`).join("\n"));
}
console.log(failed ? `\n${failed} of ${files.length} test files failed` : `\nAll ${files.length} test files passed`);
process.exit(failed ? 1 : 0);
