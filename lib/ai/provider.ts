import "server-only";
import OpenAI, { APIConnectionError, APIConnectionTimeoutError, APIError } from "openai";

/**
 * The single entry point for LLM calls. API routes call callLLM() and never import
 * a provider SDK themselves, so switching providers is an .env change, not a code change.
 *
 * Both providers speak the OpenAI Chat Completions protocol (xAI's API is
 * OpenAI-compatible), so they share one client and differ only in configuration.
 * "server-only" makes the build fail if a client component ever imports this file.
 */

export const LLM_PROVIDERS = ["openai", "grok"] as const;
export type LLMProvider = (typeof LLM_PROVIDERS)[number];

interface ProviderConfig {
  label: string;
  apiKeyVar: string;
  modelVar: string;
  defaultModel: string;
  /** undefined = the SDK default (https://api.openai.com/v1, or OPENAI_BASE_URL if set). */
  baseURL: string | undefined;
}

const PROVIDER_CONFIG: Record<LLMProvider, ProviderConfig> = {
  openai: {
    label: "OpenAI",
    apiKeyVar: "OPENAI_API_KEY",
    modelVar: "OPENAI_MODEL",
    defaultModel: "gpt-6-luna",
    baseURL: undefined,
  },
  grok: {
    label: "Grok (xAI)",
    apiKeyVar: "GROK_API_KEY",
    modelVar: "GROK_MODEL",
    defaultModel: "grok-4.7",
    baseURL: "https://api.x.ai/v1",
  },
};

const DEFAULT_PROVIDER: LLMProvider = "openai";

// Real calls took 3-19 s (the summary is the slowest), so 45 s leaves headroom.
const REQUEST_TIMEOUT_MS = 45_000;
// One retry, only for failures that come back fast (dropped connection, rate limit, 5xx) and
// only if the first attempt ended within RETRY_WINDOW_MS. A timed-out call is never retried,
// so the worst case stays under the API routes' 60 s limit.
const RETRY_WINDOW_MS = 10_000;
const RETRY_DELAY_MS = 800;

function isQuickTransientFailure(error: unknown): boolean {
  if (error instanceof APIConnectionTimeoutError) return false;
  if (error instanceof APIConnectionError) return true;
  return error instanceof APIError && (error.status === 429 || (error.status ?? 0) >= 500);
}

/** Setup problem (unknown LLM_PROVIDER, missing API key). Fix .env.local and restart. */
export class LLMConfigError extends Error {
  name = "LLMConfigError";
}

/** The provider was called but the call failed: bad key, rate limit, timeout, or empty reply. */
export class LLMRequestError extends Error {
  name = "LLMRequestError";
  readonly provider: LLMProvider;
  /** HTTP status from the provider, when there was one. */
  readonly status: number | undefined;

  constructor(message: string, provider: LLMProvider, status?: number, options?: ErrorOptions) {
    super(message, options);
    this.provider = provider;
    this.status = status;
  }
}

function resolveProvider(): LLMProvider {
  const value = process.env.LLM_PROVIDER?.trim().toLowerCase() || DEFAULT_PROVIDER;
  if (!(LLM_PROVIDERS as readonly string[]).includes(value)) {
    throw new LLMConfigError(`LLM_PROVIDER must be one of: ${LLM_PROVIDERS.join(", ")} (got "${value}").`);
  }
  return value as LLMProvider;
}

/** The active provider and model, safe to log or show in the UI (never includes the key). */
export function activeLLM(): { provider: LLMProvider; label: string; model: string } {
  const provider = resolveProvider();
  const config = PROVIDER_CONFIG[provider];
  return {
    provider,
    label: config.label,
    model: process.env[config.modelVar]?.trim() || config.defaultModel,
  };
}

/**
 * Sends one system prompt and one user message to the configured provider and
 * returns the reply text. Throws LLMConfigError or LLMRequestError on failure.
 */
export async function callLLM(systemPrompt: string, userInput: string): Promise<string> {
  const { provider, label, model } = activeLLM();
  const config = PROVIDER_CONFIG[provider];

  const apiKey = process.env[config.apiKeyVar]?.trim();
  if (!apiKey) {
    throw new LLMConfigError(
      `${config.apiKeyVar} is not set. Add it to .env.local, or to your host's environment variables (LLM_PROVIDER=${provider}).`,
    );
  }

  // Retries are handled below rather than by the SDK, which would also retry timeouts.
  const client = new OpenAI({ apiKey, baseURL: config.baseURL, timeout: REQUEST_TIMEOUT_MS, maxRetries: 0 });
  const request = () =>
    client.chat.completions.create({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userInput },
      ],
    });

  let completion: OpenAI.Chat.ChatCompletion;
  const started = Date.now();
  try {
    try {
      completion = await request();
    } catch (error) {
      if (!isQuickTransientFailure(error) || Date.now() - started > RETRY_WINDOW_MS) throw error;
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      completion = await request();
    }
  } catch (error) {
    if (error instanceof APIError) {
      // The SDK's message already starts with the HTTP status, e.g. "401 Incorrect API key provided".
      throw new LLMRequestError(`${label} request failed: ${error.message}`, provider, error.status, {
        cause: error,
      });
    }
    throw error;
  }

  const choice = completion.choices[0];
  const text = choice?.message?.content?.trim();
  if (!text) {
    throw new LLMRequestError(
      `${label} returned an empty reply (finish_reason: ${choice?.finish_reason ?? "none"}).`,
      provider,
    );
  }
  return text;
}
