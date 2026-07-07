import { GoogleGenAI } from "@google/genai";

/**
 * Parses all Gemini API keys from environment variable (GEMINI_API_KEY).
 * Supports comma-separated keys for automatic key rotation.
 */
export function getGeminiKeys(): string[] {
  const envKey = process.env.GEMINI_API_KEY || "";
  return envKey
    .split(",")
    .map((k) => k.trim())
    .filter((k) => k.length > 0);
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Runs a GenAI operation, automatically rotating between available API keys
 * and retrying on transient errors with backoff.
 */
export async function runWithRetry<T>(
  operation: (ai: GoogleGenAI) => Promise<T>,
  maxAttemptsPerKey = 2
): Promise<T> {
  const keys = getGeminiKeys();
  if (keys.length === 0) {
    throw new Error("GEMINI_API_KEY environment variable is not configured.");
  }

  let lastError: any = null;

  for (let keyIndex = 0; keyIndex < keys.length; keyIndex++) {
    const apiKey = keys[keyIndex];
    const ai = new GoogleGenAI({ apiKey });

    for (let attempt = 0; attempt < maxAttemptsPerKey; attempt++) {
      try {
        return await operation(ai);
      } catch (err: any) {
        lastError = err;
        const status = err?.status ?? err?.httpErrorCode ?? 0;
        const errStr = JSON.stringify(err) + " " + (err?.message || "");
        const isTransient =
          status === 429 ||
          status === 503 ||
          errStr.includes("429") ||
          errStr.includes("503") ||
          errStr.includes("quota") ||
          errStr.includes("rate limit") ||
          errStr.includes("temporarily exceeded") ||
          errStr.includes("RESOURCE_EXHAUSTED");

        if (isTransient) {
          const delay = (attempt + 1) * 1500;
          console.warn(
            `[Gemini Client] Transient error on key index ${keyIndex} (attempt ${attempt + 1}/${maxAttemptsPerKey}): ${err?.message || err}. Waiting ${delay}ms...`
          );
          if (attempt < maxAttemptsPerKey - 1) {
            await sleep(delay);
          }
        } else {
          // If it's a non-rate-limit error (e.g. invalid arguments or bad authentication), throw immediately
          console.error("[Gemini Client] Non-transient error:", err);
          throw err;
        }
      }
    }

    console.warn(`[Gemini Client] Key index ${keyIndex} exhausted. Rotating to next key...`);
  }

  throw lastError || new Error("All configured Gemini API keys exhausted due to transient errors.");
}

/**
 * Runs a streaming or content-generation operation across multiple fallback models
 * and rotating API keys, retrying on transient errors.
 */
export async function runWithModelsAndRetry<T>(
  models: string[],
  operation: (ai: GoogleGenAI, model: string) => Promise<T>,
  maxAttemptsPerKey = 2
): Promise<T> {
  let lastError: any = null;

  for (const model of models) {
    try {
      return await runWithRetry((ai) => operation(ai, model), maxAttemptsPerKey);
    } catch (err: any) {
      lastError = err;
      const status = err?.status ?? err?.httpErrorCode ?? 0;
      const errStr = JSON.stringify(err) + " " + (err?.message || "");
      const isTransient =
        status === 429 ||
        status === 503 ||
        errStr.includes("429") ||
        errStr.includes("503") ||
        errStr.includes("quota") ||
        errStr.includes("rate limit") ||
        errStr.includes("temporarily exceeded") ||
        errStr.includes("RESOURCE_EXHAUSTED");

      if (isTransient) {
        console.warn(`[Gemini Client] Model ${model} rate-limited/exhausted on all keys. Trying next model...`);
      } else {
        console.error(`[Gemini Client] Model ${model} failed with non-transient error:`, err);
        // If it's not a transient rate-limiting error, we still try the next model just in case the model itself is not supported or deprecated
      }
    }
  }

  throw lastError || new Error("All candidate models and keys failed.");
}
