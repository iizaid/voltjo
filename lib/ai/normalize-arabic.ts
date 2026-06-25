/**
 * Arabic-aware text normalizer — the single source of truth for matching user
 * text against vehicle aliases and for building full-text queries.
 *
 * Pure and runtime-agnostic (no `server-only`, no I/O) so it can be reused by the
 * retrieval layer, the alias-seed test, and any future client-side hinting.
 *
 * Normalization steps (order matters):
 *   1. NFKC — fold presentation/compatibility forms to canonical code points.
 *   2. Strip tatweel and Arabic diacritics/tashkeel + superscript alef.
 *   3. Unify alef variants (أ إ آ ٱ) -> ا, ta-marbuta (ة) -> ه, alef-maqsura (ى) -> ي,
 *      waw-hamza (ؤ) -> و, ya-hamza (ئ) -> ي, and drop the bare hamza (ء).
 *   4. Fold Arabic-Indic and extended Arabic digits to ASCII 0–9.
 *   5. Lowercase (Latin), replace any non-letter/non-digit/non-space with a space,
 *      collapse runs of whitespace, and trim.
 *
 * The output keeps Arabic letters, Latin letters, and digits separated by single
 * spaces — a stable form both alias matching and `websearch_to_tsquery('simple')`
 * can rely on.
 */

// Tatweel (U+0640), tashkeel + Quranic marks (U+064B–U+065F), and superscript
// alef (U+0670). Built from an ASCII-escaped string so the class provably
// EXCLUDES Arabic-Indic digits (U+0660–U+0669), which must survive to step 4.
// eslint-disable-next-line no-misleading-character-class -- combining marks are the deliberate target
const DIACRITICS = new RegExp("[\\u0640\\u064B-\\u065F\\u0670]", "g");

// Built from escapes (not a literal class) to avoid a misleading combined-char
// class: أ إ آ ٱ = U+0623 U+0625 U+0622 U+0671 -> ا
const ALEF_VARIANTS = new RegExp("[\\u0623\\u0625\\u0622\\u0671]", "g");
const TA_MARBUTA = /ة/g; // ة -> ه
const ALEF_MAQSURA = /ى/g; // ى -> ي
const WAW_HAMZA = /ؤ/g; // ؤ -> و
const YA_HAMZA = /ئ/g; // ئ -> ي
const BARE_HAMZA = /ء/g; // ء -> (drop)

const ARABIC_INDIC_DIGITS = /[٠-٩]/g; // ٠–٩
const EXTENDED_ARABIC_DIGITS = /[۰-۹]/g; // ۰–۹

export function normalizeArabic(input: string): string {
  if (!input) return "";

  let s = input.normalize("NFKC");

  s = s.replace(DIACRITICS, "");
  s = s.replace(ALEF_VARIANTS, "ا"); // ا
  s = s.replace(TA_MARBUTA, "ه"); // ه
  s = s.replace(ALEF_MAQSURA, "ي"); // ي
  s = s.replace(WAW_HAMZA, "و"); // و
  s = s.replace(YA_HAMZA, "ي"); // ي
  s = s.replace(BARE_HAMZA, "");

  s = s.replace(ARABIC_INDIC_DIGITS, (d) => String(d.charCodeAt(0) - 0x0660));
  s = s.replace(EXTENDED_ARABIC_DIGITS, (d) => String(d.charCodeAt(0) - 0x06f0));

  s = s.toLowerCase();
  // Keep letters (any script), numbers, and spaces; everything else -> space.
  s = s.replace(/[^\p{L}\p{N}\s]/gu, " ");
  s = s.replace(/\s+/g, " ").trim();

  return s;
}

/**
 * Whole-token / contiguous-phrase containment on already-normalized strings.
 * Pads both sides with spaces so `needle` must align on word boundaries — avoids
 * "mage" matching inside "image" or "rav4" inside "xrav4".
 */
export function normalizedContains(haystackNorm: string, needleNorm: string): boolean {
  if (!haystackNorm || !needleNorm) return false;
  return ` ${haystackNorm} `.includes(` ${needleNorm} `);
}
