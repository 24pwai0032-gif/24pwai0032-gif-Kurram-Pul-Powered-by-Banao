import "server-only";
import { LLMConfigError, LLMRequestError } from "@/lib/ai/provider";

/** Error codes the client can branch on. */
export type ApiErrorCode =
  | "invalid_request"
  | "llm_not_configured"
  | "llm_request_failed"
  | "bad_model_output"
  | "internal_error";

export function errorResponse(code: ApiErrorCode, message: string, status: number): Response {
  return Response.json({ error: message, code }, { status });
}

/** Maps an error thrown around callLLM() to a JSON response. Shared by every AI route. */
export function llmErrorResponse(error: unknown): Response {
  if (error instanceof LLMConfigError) {
    return errorResponse("llm_not_configured", error.message, 503);
  }
  if (error instanceof LLMRequestError) {
    console.error(`[llm] ${error.message}`);
    return errorResponse("llm_request_failed", error.message, error.status === 429 ? 429 : 502);
  }
  console.error("[llm] unexpected error", error);
  return errorResponse("internal_error", "Something went wrong while generating a response.", 500);
}
