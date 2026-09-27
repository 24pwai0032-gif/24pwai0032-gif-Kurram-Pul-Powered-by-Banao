import { z } from "zod";
import closureHistoryJson from "@/data/closure-history.json";
import seedReportsJson from "@/data/seed-reports.json";
import verificationTagsJson from "@/data/verification-tags.json";
import { AREA_LINKS } from "@/lib/areas";
import {
  ClosureHistorySchema,
  SeedReportsSchema,
  VerificationTagsFileSchema,
  type SeedReports,
  type VerificationTag,
} from "@/lib/schemas";

/**
 * Loads and validates the seed files. Server-side only: import this from
 * server components and API routes, then pass data down as props.
 * A typo in the JSON fails loudly here instead of rendering half a dashboard.
 */

function parseFile<T>(schema: z.ZodType<T>, json: unknown, file: string): T {
  const result = schema.safeParse(json);
  if (!result.success) {
    throw new Error(`Invalid data in ${file}:\n${z.prettifyError(result.error)}`);
  }
  return result.data;
}

/** Checks the cross-file references that the per-file schemas can't see. */
function checkReferences(seed: SeedReports, tags: VerificationTag[]): void {
  const problems: string[] = [];
  const areaNames = new Set(seed.areas.map((a) => a.name));
  const tagLabels = new Set(tags.map((t) => t.label));

  if (areaNames.size !== seed.areas.length) problems.push("two areas share a name");

  for (const area of seed.areas) {
    for (const report of area.reports) {
      if (report.verified_by !== null && !tagLabels.has(report.verified_by)) {
        problems.push(`${area.name} / ${report.supply}: verified_by "${report.verified_by}" is not in verification-tags.json`);
      }
    }
  }
  seed.triage_cases_logged.forEach((triageCase, i) => {
    if (!areaNames.has(triageCase.area)) {
      problems.push(`triage case #${i + 1}: unknown area "${triageCase.area}"`);
    }
  });
  for (const tag of tags) {
    if (tag.area !== null && !areaNames.has(tag.area)) {
      problems.push(`tag "${tag.label}": unknown area "${tag.area}"`);
    }
  }
  for (const [a, b] of AREA_LINKS) {
    for (const name of [a, b]) {
      if (!areaNames.has(name)) problems.push(`AREA_LINKS in lib/areas.ts: unknown area "${name}"`);
    }
  }

  if (problems.length > 0) {
    throw new Error(`Seed data references are broken:\n- ${problems.join("\n- ")}`);
  }
}

export const seedReports = parseFile(SeedReportsSchema, seedReportsJson, "data/seed-reports.json");
export const verificationTags = parseFile(
  VerificationTagsFileSchema,
  verificationTagsJson,
  "data/verification-tags.json",
).tags;
export const closureHistory = parseFile(
  ClosureHistorySchema,
  closureHistoryJson,
  "data/closure-history.json",
);

checkReferences(seedReports, verificationTags);
