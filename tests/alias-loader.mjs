// Lets plain Node run the app's TypeScript modules in tests: resolves the "@/…" path alias to
// the repo root and imports JSON with the attribute Node requires (Next's bundler doesn't need it).
import { existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = fileURLToPath(new URL("../", import.meta.url));

export async function resolve(specifier, context, next) {
  if (specifier.startsWith("@/")) {
    const base = ROOT + specifier.slice(2);
    for (const ext of [".ts", ".tsx", ".json", ""]) {
      if (existsSync(base + ext)) return next(pathToFileURL(base + ext).href, context);
    }
  }
  return next(specifier, context);
}

export async function load(url, context, next) {
  if (url.endsWith(".json")) return next(url, { ...context, importAttributes: { type: "json" } });
  return next(url, context);
}
