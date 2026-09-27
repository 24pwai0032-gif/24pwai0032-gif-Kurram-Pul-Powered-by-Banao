import { z } from "zod";
import { errorResponse, llmErrorResponse } from "@/lib/ai/errorResponse";
import { TRIAGE_KEEP_IN_ENGLISH, withLanguage } from "@/lib/ai/language";
import { activeLLM, callLLM } from "@/lib/ai/provider";
import { buildTriageInput, TRIAGE_SYSTEM_PROMPT } from "@/lib/ai/triagePrompt";
import { parseTriageReply } from "@/lib/ai/triageReply";
import { LOCALES } from "@/lib/i18n";
import { MAX_DESCRIPTION_CHARS } from "@/lib/triage";

// Room for the 45 s request timeout in lib/ai/provider.ts.
export const maxDuration = 60;

const TriageRequestSchema = z.strictObject({
  description: z.string().trim().min(2).max(MAX_DESCRIPTION_CHARS),
  language: z.enum(LOCALES).optional(),
});

/**
 * POST /api/triage: classifies a patient description into an urgency tier and next step,
 * or returns the one clarifying question the spec allows for fragmentary messages.
 * Logging the case to the dashboard happens in the browser store, not here.
 */
export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => undefined);
  const parsed = TriageRequestSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("invalid_request", `Invalid request body:\n${z.prettifyError(parsed.error)}`, 400);
  }

  let text: string;
  try {
    text = await callLLM(
      withLanguage(TRIAGE_SYSTEM_PROMPT, parsed.data.language, TRIAGE_KEEP_IN_ENGLISH),
      buildTriageInput(parsed.data.description),
    );
  } catch (error) {
    return llmErrorResponse(error);
  }

  const reply = parseTriageReply(text);
  if (!reply) {
    console.error(`[triage] unreadable model reply: ${text.slice(0, 500)}`);
    return errorResponse("bad_model_output", "The classifier's reply couldn't be read. Please try again.", 502);
  }

  const { label, model } = activeLLM();
  return Response.json({ ...reply, provider: label, model });
}
