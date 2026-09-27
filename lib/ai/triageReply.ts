import type { UrgencyTier } from "@/lib/schemas";
import type { TriageReply } from "@/lib/triage";

/**
 * Reads the classifier's reply. The spec prompt asks for JSON but doesn't fix the shape
 * of a clarifying question, so this accepts the variations models actually produce:
 * code fences, tier names like "Needs Medicine / Supplies", "none" as a supply, and
 * a question under keys like clarifying_question or question.
 * Returns null when the reply can't be understood.
 */
export function parseTriageReply(text: string): TriageReply | null {
  const json = extractJsonObject(text);

  if (!json) {
    // No JSON at all, but a short plain question is still a usable clarifying question.
    const plain = text.trim();
    return plain.endsWith("?") && plain.length <= 300 ? { kind: "clarification", question: plain } : null;
  }

  const question = findQuestion(json);
  const tier = normalizeTier(json.urgency_tier);

  if (tier) {
    return {
      kind: "classification",
      urgency_tier: tier,
      reason: asText(json.reason) ?? "",
      recommended_action: asText(json.recommended_action) ?? "",
      supply_needed: normalizeSupply(json.supply_needed),
      follow_up_question: question,
    };
  }
  return question ? { kind: "clarification", question } : null;
}

function extractJsonObject(text: string): Record<string, unknown> | null {
  const unfenced = text.replace(/```(?:json)?/gi, "");
  const start = unfenced.indexOf("{");
  const end = unfenced.lastIndexOf("}");
  if (start === -1 || end <= start) return null;
  try {
    const value: unknown = JSON.parse(unfenced.slice(start, end + 1));
    return typeof value === "object" && value !== null && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

function asText(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function normalizeTier(value: unknown): UrgencyTier | null {
  const tier = asText(value)?.toLowerCase();
  if (!tier) return null;
  if (tier.includes("critical") || tier.includes("evacuat")) return "critical";
  if (tier.includes("suppl") || tier.includes("medicine")) return "needs_supplies";
  if (tier.includes("routine") || tier.includes("monitor")) return "routine";
  return null;
}

// Real models write "no supply" many ways instead of null: "None specified; urgent medical
// assessment is needed", "Not specified", "Unknown", "No specific supply", "N/A - refer". No
// supply name starts like that, so anything that does is treated as no supply at all.
const NO_SUPPLY_PHRASE =
  /^(?:none|nothing|null|nil|n\/?a|unknown|unspecified|not\s+(?:applicable|specified|needed|required|identified|known)|no\s+(?:(?:specific|particular|additional|immediate)\s+)?(?:supply|supplies|medicine|medicines|medication|medications|item|items)|-+)(?=$|[\s.,;:!(—–-])/i;
// A bare "No" counts too, but "No insulin at home" still names insulin.
const BARE_NO = /^no(?=$|[.,;:!(—–-])/i;

function normalizeSupply(value: unknown): string | null {
  const supply = Array.isArray(value) ? value.filter((v) => typeof v === "string").join(", ") : asText(value);
  if (!supply || NO_SUPPLY_PHRASE.test(supply) || BARE_NO.test(supply)) return null;
  return supply;
}

function findQuestion(json: Record<string, unknown>): string | null {
  for (const [key, value] of Object.entries(json)) {
    if (/question|clarif/i.test(key)) {
      const question = asText(value);
      if (question) return question;
    }
  }
  return null;
}
