import { z } from "zod";

/**
 * Schemas for the data in data/*.json, matching the shapes in SPEC.md sections 7 and 9
 * exactly. Objects are strict, so an extra or misspelled key fails validation.
 * The TypeScript types are inferred from these, so the JSON files, the types,
 * and the runtime checks can never drift apart. API routes reuse the same schemas
 * to validate request bodies, hence the size limits.
 */

const text = (max: number) => z.string().trim().min(1).max(max);

// ---------- Supply reports (SPEC section 7) ----------

export const SUPPLY_STATUSES = ["critical", "low", "stable", "surplus"] as const;
export const SupplyStatusSchema = z.enum(SUPPLY_STATUSES);
export type SupplyStatus = z.infer<typeof SupplyStatusSchema>;

export const SupplyReportSchema = z.strictObject({
  supply: text(80),
  status: SupplyStatusSchema,
  reported_by: text(120),
  /** Label of an entry in verification-tags.json, or null when unverified. */
  verified_by: text(120).nullable(),
  timestamp: z.iso.datetime(),
});
export type SupplyReport = z.infer<typeof SupplyReportSchema>;

export const AreaSchema = z.strictObject({
  name: text(80),
  reports: z.array(SupplyReportSchema).max(100),
});
export type Area = z.infer<typeof AreaSchema>;

// ---------- Triage cases (SPEC sections 6 and 7) ----------

export const URGENCY_TIERS = ["critical", "needs_supplies", "routine"] as const;
export const UrgencyTierSchema = z.enum(URGENCY_TIERS);
export type UrgencyTier = z.infer<typeof UrgencyTierSchema>;

export const TriageCaseSchema = z.strictObject({
  area: text(80),
  urgency_tier: UrgencyTierSchema,
  /** Null when no specific supply is needed (e.g. a routine case). */
  supply_needed: text(80).nullable(),
});
export type TriageCase = z.infer<typeof TriageCaseSchema>;

export const SeedReportsSchema = z.strictObject({
  areas: z.array(AreaSchema).max(30),
  triage_cases_logged: z.array(TriageCaseSchema).max(500),
});
export type SeedReports = z.infer<typeof SeedReportsSchema>;

// ---------- In-app records ----------
// The JSON has no ids, so the app adds one when loading (lib/seed.ts). React keys and
// later edits (verifying a report, logging a case) need a stable handle on each item.

export type ReportRecord = SupplyReport & { id: string };
export type AreaRecord = Omit<Area, "reports"> & { reports: ReportRecord[] };
export type TriageCaseRecord = TriageCase & {
  id: string;
  /** When a case was logged from the triage assistant. Seed cases have none. */
  loggedAt?: string;
};

// ---------- Verification layer ----------
// SPEC.md names the tags ("Hospital record", "Area elder - Malik Jan") but gives no file
// shape, so this is the one structure defined here rather than taken from the spec.

export const VERIFIER_TYPES = ["jirga_elder", "institutional", "ngo_coordinator"] as const;
export const VerifierTypeSchema = z.enum(VERIFIER_TYPES);
export type VerifierType = z.infer<typeof VerifierTypeSchema>;

export const VerificationTagSchema = z.strictObject({
  /** Matches SupplyReport.verified_by exactly. */
  label: z.string().min(1),
  type: VerifierTypeSchema,
  name: z.string().min(1),
  /** Area the verifier speaks for, or null when they cover the whole district. */
  area: z.string().min(1).nullable(),
  description: z.string().min(1),
});
export type VerificationTag = z.infer<typeof VerificationTagSchema>;

export const VerificationTagsFileSchema = z.strictObject({
  tags: z.array(VerificationTagSchema),
});

// ---------- Closure history (SPEC section 9) ----------

const DAY_MS = 86_400_000;

export const ClosureEventSchema = z
  .strictObject({
    start: z.iso.date(),
    end: z.iso.date(),
    duration_days: z.number().int().positive(),
    trigger: z.string().min(1),
  })
  .refine(
    (c) => (Date.parse(c.end) - Date.parse(c.start)) / DAY_MS === c.duration_days,
    { message: "duration_days must equal the number of days from start to end" },
  );
export type ClosureEvent = z.infer<typeof ClosureEventSchema>;

export const SIGNAL_SEVERITIES = ["low", "moderate", "high"] as const;
export const SignalSeveritySchema = z.enum(SIGNAL_SEVERITIES);
export type SignalSeverity = z.infer<typeof SignalSeveritySchema>;

export const IncidentSignalSchema = z.strictObject({
  date: z.iso.date(),
  signal: z.string().min(1),
  severity: SignalSeveritySchema,
});
export type IncidentSignal = z.infer<typeof IncidentSignalSchema>;

export const ClosureHistorySchema = z.strictObject({
  past_closures: z.array(ClosureEventSchema),
  current_signals: z.array(IncidentSignalSchema),
});
export type ClosureHistory = z.infer<typeof ClosureHistorySchema>;
