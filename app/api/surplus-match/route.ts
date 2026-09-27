import { z } from "zod";
import { errorResponse, llmErrorResponse } from "@/lib/ai/errorResponse";
import { withLanguage } from "@/lib/ai/language";
import { activeLLM, callLLM } from "@/lib/ai/provider";
import { buildSurplusMatchInput, SURPLUS_MATCH_SYSTEM_PROMPT } from "@/lib/ai/surplusMatchPrompt";
import { LOCALES } from "@/lib/i18n";
import { SeedReportsSchema } from "@/lib/schemas";

// Room for the 45 s request timeout in lib/ai/provider.ts.
export const maxDuration = 60;

// The reports, plus the reader's language: the answer is written in it.
const RequestSchema = SeedReportsSchema.extend({ language: z.enum(LOCALES).optional() });

/**
 * POST /api/surplus-match: the AI's review of which areas' surplus can cover which
 * shortages nearby. Body: current reports and triage cases in the seed-reports.json shape.
 */
export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => undefined);
  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("invalid_request", `Invalid request body:\n${z.prettifyError(parsed.error)}`, 400);
  }

  try {
    const text = await callLLM(withLanguage(SURPLUS_MATCH_SYSTEM_PROMPT, parsed.data.language), buildSurplusMatchInput(parsed.data, Date.now()));
    const { label, model } = activeLLM();
    return Response.json({ text, provider: label, model, generatedAt: new Date().toISOString() });
  } catch (error) {
    return llmErrorResponse(error);
  }
}
