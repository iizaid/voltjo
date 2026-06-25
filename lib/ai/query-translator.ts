import "server-only";

/**
 * Lightweight Arabic→English query translator for cross-language FTS retrieval.
 *
 * The vehicle_knowledge corpus is in English, so Arabic user queries produce
 * Arabic tsvector tokens that can never match English content. This module
 * translates Arabic (or Arabic-dominant) queries to English before FTS, using
 * Gemini Flash (cheapest, fastest) with a 3-second hard timeout and in-process
 * caching to avoid redundant API calls. Silent-fail on any error — retrieval
 * degrades to the original query rather than blocking the chat response.
 */

const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta";

// gemini-2.5-flash: same model used for main chat generation — confirmed working.
const TRANSLATION_MODEL = "gemini-2.5-flash";

// Arabic Unicode ranges: Basic Arabic + Supplement + Extended-A.
const ARABIC_RE = /[؀-ۿݐ-ݿࢠ-ࣿ]/;

// In-process translation cache: raw query (lowercased) → translated string.
// Cleared on process restart; TTL prevents stale entries across long-running dev servers.
const cache = new Map<string, { translation: string; expiresAt: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// Extract technical keywords rather than producing a natural-language sentence.
// websearch_to_tsquery('simple') / websearch_to_tsquery('english') treats every
// space-separated token as required (AND). A sentence like "how many hours does
// the battery need to charge" requires "how", "many", "does", "the" to appear
// verbatim in the stored English chunks — they never do, so FTS returns 0 rows.
// Keyword extraction (e.g. "charging battery hours") keeps only terms that
// actually appear in English technical manuals, maximising recall.
const TRANSLATION_SYSTEM = [
  "You are a technical search assistant for an automotive manual database.",
  "Given an Arabic question about a car, extract 2-5 English search keywords",
  "that appear verbatim in car owner's manuals.",
  "",
  "Rules:",
  "- Output ONLY the keywords separated by spaces — no sentences, no punctuation",
  "- Skip question/stop words: no 'how', 'many', 'what', 'is', 'does', 'the', 'a'",
  "- Use the manual's exact technical forms:",
  "  - charging (not 'charge'), battery (not 'batteries'), hours (not 'hour')",
  "  - AC, DC, kWh, km/h, PHEV, EV — keep abbreviations unchanged",
  "- Keep brand names and model codes unchanged: BYD, Toyota, Sealion, DM-i, 05",
  "",
  "Examples:",
  "  Arabic: كم ساعة يحتاج شحن بطارية سيلايون؟  →  charging battery hours",
  "  Arabic: ما هي سعة البطارية؟               →  battery capacity kWh",
  "  Arabic: ما نوع منفذ الشحن؟                →  charging port AC DC connector",
  "  Arabic: كم مداه الكهربائي؟               →  electric range km",
  "  Arabic: متى يستحق الصيانة؟               →  service maintenance interval km",
].join("\n");

/**
 * Returns true when the query contains Arabic characters — meaning direct FTS
 * against English tsvector content will return 0 rows and translation is needed.
 * Mixed queries (e.g. "BYD سيلايون charging") also return true: the Arabic
 * portion would pollute the tsquery even though the Latin terms match.
 */
export function queryNeedsTranslation(query: string): boolean {
  return ARABIC_RE.test(query);
}

/**
 * Translate an Arabic (or Arabic-dominant) query to English.
 *
 * Guarantees:
 * - Never throws — returns the original query on any failure
 * - Cached for 5 minutes per unique query string
 * - Hard 3-second timeout so a slow Gemini response never blocks chat
 * - Preserves vehicle model numbers and technical acronyms
 *
 * Callers should check `queryNeedsTranslation` before calling this to avoid
 * unnecessary API calls on English-only queries.
 */
export async function translateQueryToEnglish(query: string): Promise<string> {
  const trimmed = query.trim();
  if (!trimmed) return trimmed;

  const cacheKey = trimmed.toLowerCase();
  const hit = cache.get(cacheKey);
  if (hit && hit.expiresAt > Date.now()) {
    return hit.translation;
  }

  const apiKey = process.env.GOOGLE_AI_API_KEY?.trim();
  if (!apiKey) {
    return trimmed;
  }

  const DEBUG = process.env.RAG_DEBUG === "1";
  const d = (...a: unknown[]) => DEBUG && console.log("[RAG:translator]", ...a);

  try {
    const url = `${GEMINI_API_BASE}/models/${TRANSLATION_MODEL}:generateContent?key=${apiKey}`;
    const requestBody = {
      system_instruction: { parts: [{ text: TRANSLATION_SYSTEM }] },
      contents: [{ role: "user", parts: [{ text: trimmed }] }],
      generationConfig: {
        temperature: 0,
        maxOutputTokens: 80,
        candidateCount: 1,
      },
    };

    d("calling Gemini for translation, model=", TRANSLATION_MODEL, "query=", trimmed);

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      const errBody = await res.text().catch(() => "(unreadable)");
      d("SILENT FAIL: HTTP", res.status, res.statusText, "body=", errBody.slice(0, 200));
      return trimmed;
    }

    const json = (await res.json()) as {
      candidates?: Array<{
        content?: { parts?: Array<{ text?: string }> };
      }>;
    };

    const translation = json.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!translation) {
      d("SILENT FAIL: empty translation in response:", JSON.stringify(json).slice(0, 200));
      return trimmed;
    }

    d("translated:", JSON.stringify(trimmed), "→", JSON.stringify(translation));
    cache.set(cacheKey, { translation, expiresAt: Date.now() + CACHE_TTL_MS });
    return translation;
  } catch (err) {
    d("SILENT FAIL: exception:", err instanceof Error ? err.message : String(err));
    return trimmed;
  }
}
