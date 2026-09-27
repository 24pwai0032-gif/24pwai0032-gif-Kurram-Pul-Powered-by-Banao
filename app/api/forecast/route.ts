import { z } from "zod";
import { errorResponse, llmErrorResponse } from "@/lib/ai/errorResponse";
import { FORECAST_KEEP_IN_ENGLISH, withLanguage } from "@/lib/ai/language";
import { buildForecasterInput, FORECASTER_SYSTEM_PROMPT } from "@/lib/ai/forecasterPrompt";
import { activeLLM, callLLM } from "@/lib/ai/provider";
import { closureHistory } from "@/lib/data";
import { LOCALES } from "@/lib/i18n";

// Room for the 45 s request timeout in lib/ai/provider.ts.
export const maxDuration = 60;

const RequestSchema = z.strictObject({ language: z.enum(LOCALES).optional() });

/**
 * POST /api/forecast: closure-risk estimate from data/closure-history.json. The history
 * is read on the server, so the body only carries the reader's language. POST rather than GET so that
 * link prefetchers and crawlers can't trigger a paid LLM call.
 */
export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => ({}));
  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("invalid_request", `Invalid request body:\n${z.prettifyError(parsed.error)}`, 400);
  }

  try {
    const text = await callLLM(
      withLanguage(FORECASTER_SYSTEM_PROMPT, parsed.data.language, FORECAST_KEEP_IN_ENGLISH),
      buildForecasterInput(closureHistory, new Date()),
    );
    const { label, model } = activeLLM();
    return Response.json({ text, provider: label, model, generatedAt: new Date().toISOString() });
  } catch (error) {
    return llmErrorResponse(error);
  }
}
