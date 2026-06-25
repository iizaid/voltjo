import { normalizeArabic } from "@/lib/ai/normalize-arabic";

/**
 * Rule-based intent classification (no ML). Maps a user message to a
 * `vehicle_knowledge.category` so retrieval can narrow the FTS query. Returns
 * `null` when no category dominates — the retrieval layer then queries without a
 * category filter (and soft-narrows on miss). Keeping this rule-based is a
 * deliberate launch trade-off: cheap, deterministic, and good enough because
 * wrong guesses are recoverable via the soft-narrow fallback.
 */

export type KnowledgeCategory =
  | "battery_charging"
  | "engine_fuel"
  | "maintenance"
  | "safety"
  | "trims"
  | "market"
  | "profile";

// Authored in natural Arabic/English, then normalized once at module load so the
// keywords compare cleanly against a normalized message (e.g. 'بطارية' -> 'بطاريه').
const RAW_KEYWORDS: Record<Exclude<KnowledgeCategory, "profile">, string[]> = {
  battery_charging: [
    "شحن", "يشحن", "اشحن", "بطارية", "البطارية", "كيلوواط", "قابس", "منفذ",
    "شاحن", "ساعة", "كم ساعة", "ac", "dc", "kwh", "kw", "charger", "charging",
    "charge", "battery", "plug", "fast charge",
  ],
  engine_fuel: [
    "محرك", "بنزين", "وقود", "استهلاك", "عزم", "حصان", "هجين", "هايبرد", "مدى",
    "لتر", "engine", "fuel", "consumption", "hybrid", "range", "torque", "petrol",
  ],
  maintenance: [
    "صيانة", "زيت", "فلتر", "خدمة", "كيلومتر", "دوري", "تغيير الزيت",
    "service", "oil", "filter", "interval", "maintenance",
  ],
  safety: [
    "سلامة", "تحذير", "حادث", "وسادة", "هوائية", "فرامل", "تصادم", "اعطال",
    "safety", "warning", "airbag", "abs", "brake", "crash",
  ],
  trims: [
    "فئة", "فئات", "مواصفات", "اصدار", "نسخة", "تجهيزات", "باقة",
    "trim", "trims", "package", "variant", "equipment", "spec", "specs",
  ],
  market: [
    "سعر", "اسعار", "الاردن", "اردن", "ضمان", "وكيل", "توفر", "دينار",
    "كم سعرها", "price", "jordan", "warranty", "dealer", "availability",
  ],
};

type NormalizedRule = { category: Exclude<KnowledgeCategory, "profile">; keywords: string[] };

const RULES: NormalizedRule[] = Object.entries(RAW_KEYWORDS).map(([category, keywords]) => ({
  category: category as Exclude<KnowledgeCategory, "profile">,
  keywords: Array.from(new Set(keywords.map(normalizeArabic).filter(Boolean))),
}));

// Tie-break priority when two categories score equally. Charging/maintenance/
// safety are the highest-value grounded intents; market/trims are broad.
const PRIORITY: Exclude<KnowledgeCategory, "profile">[] = [
  "battery_charging",
  "maintenance",
  "safety",
  "engine_fuel",
  "trims",
  "market",
];

/** A keyword matches if it appears as a whole token/phrase, or — for Arabic
 *  tokens ≥4 chars — as a substring (Arabic glues prefixes like ال/و/ب). Short
 *  tokens (≤3, e.g. 'ac','dc') require a word boundary to avoid false hits. */
function keywordHits(messageNorm: string, keyword: string): boolean {
  const padded = ` ${messageNorm} `;
  if (keyword.includes(" ")) return padded.includes(` ${keyword} `);
  if (keyword.length <= 3) return padded.includes(` ${keyword} `);
  // Arabic words rarely stand alone (الشحن, وبطارية) → allow substring.
  if (/[؀-ۿ]/.test(keyword)) return messageNorm.includes(keyword);
  return padded.includes(` ${keyword} `);
}

/**
 * Classify the (raw or normalized) message into a knowledge category, or null.
 * Accepts raw text and normalizes internally, so callers need not pre-normalize.
 */
export function detectIntent(message: string): KnowledgeCategory | null {
  const norm = normalizeArabic(message);
  if (!norm) return null;

  let best: { category: Exclude<KnowledgeCategory, "profile">; score: number } | null = null;

  for (const rule of RULES) {
    let score = 0;
    for (const kw of rule.keywords) {
      if (keywordHits(norm, kw)) score += 1;
    }
    if (score === 0) continue;
    if (
      !best ||
      score > best.score ||
      (score === best.score && PRIORITY.indexOf(rule.category) < PRIORITY.indexOf(best.category))
    ) {
      best = { category: rule.category, score };
    }
  }

  return best ? best.category : null;
}
