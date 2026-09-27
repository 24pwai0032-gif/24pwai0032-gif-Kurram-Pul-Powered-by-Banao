import type { Locale } from "@/lib/i18n";
import type { SeedReports } from "@/lib/schemas";
import type { TriageReply } from "@/lib/triage";

/** Browser-side helpers for calling the app's own API routes. */

export class ApiError extends Error {
  name = "ApiError";
  readonly code: string | undefined;
  readonly status: number;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

async function postJson(url: string, body: unknown): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new ApiError("Couldn't reach the server. Check your connection.", 0, "network_error");
  }

  const json: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const error = json as { error?: unknown; code?: unknown } | null;
    throw new ApiError(
      typeof error?.error === "string" ? error.error : `Request failed (HTTP ${response.status}).`,
      response.status,
      typeof error?.code === "string" ? error.code : undefined,
    );
  }
  return json;
}

/** A free-text AI answer: what /api/aggregate, /api/surplus-match and /api/forecast return. */
export interface AiText {
  text: string;
  provider: string;
  model: string;
  generatedAt: string;
}

async function fetchAiText(url: string, body: object): Promise<AiText> {
  const json = (await postJson(url, body)) as Partial<AiText> | null;
  if (!json || typeof json.text !== "string") {
    throw new ApiError("The server sent an unexpected response.", 500, "bad_response");
  }
  return json as AiText;
}

// Each AI text is written in `language`, the reader's UI language.
export const fetchSummary = (data: SeedReports, language: Locale) => fetchAiText("/api/aggregate", { ...data, language });
export const fetchMatchReview = (data: SeedReports, language: Locale) =>
  fetchAiText("/api/surplus-match", { ...data, language });
/** The forecast route reads the closure history on the server, so it only needs the language. */
export const fetchForecast = (_data: SeedReports, language: Locale) => fetchAiText("/api/forecast", { language });

export type TriageResponse = TriageReply & { provider: string; model: string };

export async function fetchTriage(description: string, language: Locale): Promise<TriageResponse> {
  const json = (await postJson("/api/triage", { description, language })) as Partial<TriageResponse> | null;
  if (json?.kind !== "classification" && json?.kind !== "clarification") {
    throw new ApiError("The server sent an unexpected response.", 500, "bad_response");
  }
  return json as TriageResponse;
}
