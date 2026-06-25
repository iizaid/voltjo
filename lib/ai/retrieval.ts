import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { queryNeedsTranslation, translateQueryToEnglish } from "@/lib/ai/query-translator";
import type { Citation, RetrievalConfidence } from "@/lib/ai/types";
import type { KnowledgeCategory } from "@/lib/ai/intent";

/**
 * RAG-lite retrieval over `vehicle_knowledge`. Pure shaping/gating/assembly
 * helpers live here alongside the single DB entry point (`retrieveKnowledgeChunks`),
 * which calls the `search_vehicle_knowledge` RPC through the SERVICE-ROLE client —
 * the only client that can read the `to authenticated` table for anonymous chats.
 */

/** Internal, camelCased chunk shape (post-RPC). */
export type KnowledgeChunk = {
  id: string;
  vehicleId: string;
  category: string;
  section: string;
  content: string;
  sourceRef: string | null;
  sourceFile: string | null;
  pageRef: string | null;
  confidence: string;
  confidenceRaw: string | null;
  rank: number;
};

// ts_rank thresholds — calibrate against the golden eval set (P1). ts_rank values
// are small and unbounded-ish; these are conservative launch defaults.
export const TAU_LOW = 0.02;
export const TAU_HIGH = 0.1;

// Token-budget the assembled context. Rough char→token ≈ 4; ~2K-token ceiling.
const MAX_CONTEXT_CHARS = 6000;
const MAX_CHUNK_CHARS = 600;

const CONFIDENCE_LABEL_AR: Record<string, string> = {
  official: "رسمي",
  dealer: "من الوكيل",
  owner_reported: "من ملاك",
  estimate: "تقديري",
  needs_review: "بحاجة لتحقق",
  unknown: "غير مؤكد",
};

type RpcRow = {
  id: string;
  vehicle_id: string;
  category: string;
  section: string;
  content: string;
  source_ref: string | null;
  source_file: string | null;
  page_ref: string | null;
  confidence: string;
  confidence_raw: string | null;
  rank: number;
};

function mapRow(row: RpcRow): KnowledgeChunk {
  return {
    id: row.id,
    vehicleId: row.vehicle_id,
    category: row.category,
    section: row.section,
    content: row.content,
    sourceRef: row.source_ref,
    sourceFile: row.source_file,
    pageRef: row.page_ref,
    confidence: row.confidence,
    confidenceRaw: row.confidence_raw,
    rank: typeof row.rank === "number" ? row.rank : 0,
  };
}

/**
 * Run the FTS RPC for one set of vehicle ids, soft-narrowing on category: try with
 * the detected category first; if it returns nothing, retry once without it so a
 * wrong intent guess never starves an answerable question. Never throws — a DB or
 * config failure degrades to `[]` (context is best-effort).
 */
export async function retrieveKnowledgeChunks(params: {
  vehicleIds: string[];
  query: string;
  category: KnowledgeCategory | null;
  limit: number;
}): Promise<KnowledgeChunk[]> {
  const { vehicleIds, query, category, limit } = params;
  if (vehicleIds.length === 0) return [];

  // The vehicle_knowledge corpus is English. Arabic query tokens from
  // websearch_to_tsquery('simple', arabic_text) can never match English tsvector
  // entries, so we translate Arabic (or Arabic-dominant) queries to English before
  // FTS. English-only queries bypass translation entirely. On translation failure
  // the original query is used — retrieval degrades gracefully.
  const q = query.trim();
  if (!q) return [];

  const DEBUG = process.env.RAG_DEBUG === "1";
  const d = (...a: unknown[]) => DEBUG && console.log("[RAG:retrieval]", ...a);

  const needsTranslation = queryNeedsTranslation(q);
  const ftsQuery = needsTranslation ? await translateQueryToEnglish(q) : q;
  if (needsTranslation) {
    d("Arabic query detected — translated for FTS:", JSON.stringify(q), "→", JSON.stringify(ftsQuery));
  }
  d("RPC args: vehicles=", vehicleIds, "ftsQuery=", ftsQuery, "category=", category, "limit=", limit);

  const admin = createAdminClient();
  if (!admin) {
    d("SILENT FAIL: createAdminClient() returned null — SUPABASE_SERVICE_ROLE_KEY missing?");
    return [];
  }

  const run = async (rpcQuery: string, cat: KnowledgeCategory | null) => {
    d("RPC call: p_query=", rpcQuery, "p_category=", cat);
    const { data, error } = await admin.rpc("search_vehicle_knowledge", {
      p_vehicle_ids: vehicleIds,
      p_query: rpcQuery,
      p_category: cat,
      p_limit: limit,
    });
    if (error) {
      d("SILENT FAIL: RPC error:", error.message, error.code);
      return [] as KnowledgeChunk[];
    }
    if (!data) {
      d("SILENT FAIL: RPC returned null data");
      return [] as KnowledgeChunk[];
    }
    d("RPC returned", (data as RpcRow[]).length, "rows");
    return (data as RpcRow[]).map(mapRow);
  };

  try {
    // Primary attempt: use the (possibly translated) English FTS query with the
    // detected category filter for maximum precision.
    const primary = await run(ftsQuery, category);
    if (primary.length > 0) return primary;

    // Soft-narrow: category may have been mis-classified — retry once without it.
    if (category !== null) {
      d("Primary returned 0 rows, soft-narrowing without category filter");
      return await run(ftsQuery, null);
    }

    d("All retrieval paths exhausted — returning []");
    return primary; // already []
  } catch (err) {
    d("SILENT FAIL: exception in retrieveKnowledgeChunks:", err);
    return [];
  }
}

/**
 * Retrieval-confidence gate (two-dimensional honesty, plan §6):
 *   HIGH   — official/dealer evidence with a meaningful rank.
 *   MEDIUM — graded-but-soft evidence (estimate/needs_review/owner_reported) or
 *            decent-rank hits.
 *   LOW    — no chunks, all-unknown evidence, or only weak-rank hits.
 */
export function computeRetrievalConfidence(chunks: KnowledgeChunk[]): RetrievalConfidence {
  if (chunks.length === 0) return "LOW";

  const topRank = chunks.reduce((m, c) => Math.max(m, c.rank), 0);

  const hasStrong = chunks.some(
    (c) => (c.confidence === "official" || c.confidence === "dealer") && c.rank >= TAU_HIGH,
  );
  if (hasStrong) return "HIGH";

  if (chunks.every((c) => c.confidence === "unknown")) return "LOW";
  if (topRank < TAU_LOW) return "LOW";

  return "MEDIUM";
}

/** Build the public Citation for a chunk. */
export function toCitation(chunk: KnowledgeChunk): Citation {
  return {
    section: chunk.section,
    sourceRef: chunk.sourceRef,
    sourceFile: chunk.sourceFile,
    pageRef: chunk.pageRef,
    confidence: chunk.confidence,
    confidenceRaw: chunk.confidenceRaw,
  };
}

/** Inline citation tag, e.g. "[المصدر: S5 ص.209 — ثقة: official(EU)→needs_review]". */
function citationTag(chunk: KnowledgeChunk): string {
  const ref = chunk.sourceRef ? `المصدر: ${chunk.sourceRef}` : "المصدر: غير محدد";
  const page = chunk.pageRef ? ` ص.${chunk.pageRef}` : "";
  const conf = chunk.confidenceRaw ?? CONFIDENCE_LABEL_AR[chunk.confidence] ?? chunk.confidence;
  return `[${ref}${page} — ثقة: ${conf}]`;
}

/** Trim a chunk body to the budget, preferring a sentence/newline boundary. */
function trimToBudget(content: string, max: number): string {
  const text = content.trim();
  if (text.length <= max) return text;
  const slice = text.slice(0, max);
  const boundary = Math.max(
    slice.lastIndexOf("۔"),
    slice.lastIndexOf("."),
    slice.lastIndexOf("\n"),
    slice.lastIndexOf("،"),
  );
  return (boundary > max * 0.5 ? slice.slice(0, boundary + 1) : slice).trim() + " …";
}

/**
 * Assemble the token-budgeted grounded context block and the parallel citation
 * list. Returns `contextText: null` only when there is genuinely nothing to add
 * (no structured facts AND no chunks) — that signals the caller to disclaim.
 */
export function assembleGroundedContext(
  structuredText: string | null,
  chunks: KnowledgeChunk[],
): { contextText: string | null; citations: Citation[] } {
  const citations: Citation[] = [];
  const sections: string[] = [];
  let used = 0;

  if (structuredText && structuredText.trim()) {
    const block = structuredText.trim();
    sections.push(`معلومات السيارة:\n${block}`);
    used += block.length;
  }

  if (chunks.length > 0) {
    const lines: string[] = [];
    for (const chunk of chunks) {
      const body = trimToBudget(chunk.content, MAX_CHUNK_CHARS);
      // Citation tag is kept in the citations array for API consumers only.
      // It is NOT included in the context text sent to the AI — exposing
      // source metadata in the prompt causes the AI to echo it to the user.
      const entry = `- ${chunk.section}:\n${body}`;
      if (used + entry.length > MAX_CONTEXT_CHARS && lines.length > 0) break;
      lines.push(entry);
      citations.push(toCitation(chunk));
      used += entry.length;
    }
    if (lines.length > 0) {
      sections.push(`معلومات:\n${lines.join("\n\n")}`);
    }
  }

  if (sections.length === 0) return { contextText: null, citations: [] };
  return { contextText: sections.join("\n\n"), citations };
}
