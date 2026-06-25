import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the service-role client so retrieval can be exercised without a DB.
const mockRpc = vi.fn();
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ rpc: mockRpc }),
}));

// Mock the query translator. Default: identity (returns query unchanged) so
// existing tests that pass Arabic strings still work without asserting on
// translation. Individual multilingual tests override this via vi.mocked().
const mockTranslate = vi.fn(async (q: string) => q);
vi.mock("@/lib/ai/query-translator", () => ({
  queryNeedsTranslation: (q: string) => /[؀-ۿ]/.test(q),
  translateQueryToEnglish: (q: string) => mockTranslate(q),
}));

import {
  retrieveKnowledgeChunks,
  computeRetrievalConfidence,
  assembleGroundedContext,
  type KnowledgeChunk,
} from "@/lib/ai/retrieval";

function chunk(overrides: Partial<KnowledgeChunk> = {}): KnowledgeChunk {
  return {
    id: "c1",
    vehicleId: "v1",
    category: "battery_charging",
    section: "vehicle-profile / Charging",
    content: "AC 11kW, DC 80kW, 10–80% ~30 min.",
    sourceRef: "S5",
    sourceFile: "owner-manual.pdf",
    pageRef: "209",
    confidence: "dealer",
    confidenceRaw: "dealer",
    rank: 0.2,
    ...overrides,
  };
}

const rpcRow = {
  id: "c1",
  vehicle_id: "v1",
  category: "battery_charging",
  section: "sec",
  content: "body",
  source_ref: "S5",
  source_file: "f.pdf",
  page_ref: "209",
  confidence: "dealer",
  confidence_raw: "dealer",
  rank: 0.2,
};

describe("retrieveKnowledgeChunks", () => {
  beforeEach(() => {
    mockRpc.mockReset();
    mockTranslate.mockReset();
    mockTranslate.mockImplementation(async (q: string) => q); // identity by default
  });

  it("returns [] without calling the RPC when no vehicle ids", async () => {
    const out = await retrieveKnowledgeChunks({ vehicleIds: [], query: "شحن", category: null, limit: 4 });
    expect(out).toEqual([]);
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it("maps snake_case RPC rows into camelCase chunks", async () => {
    mockRpc.mockResolvedValueOnce({ data: [rpcRow], error: null });
    const out = await retrieveKnowledgeChunks({ vehicleIds: ["v1"], query: "charging time", category: "battery_charging", limit: 4 });
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({ vehicleId: "v1", sourceRef: "S5", pageRef: "209", confidence: "dealer", rank: 0.2 });
  });

  it("soft-narrows: retries with null category when the categorized query is empty", async () => {
    mockRpc
      .mockResolvedValueOnce({ data: [], error: null })      // categorized attempt
      .mockResolvedValueOnce({ data: [rpcRow], error: null }); // broadened retry
    const out = await retrieveKnowledgeChunks({ vehicleIds: ["v1"], query: "charging", category: "safety", limit: 4 });
    expect(out).toHaveLength(1);
    expect(mockRpc).toHaveBeenCalledTimes(2);
    expect(mockRpc.mock.calls[0][1].p_category).toBe("safety");
    expect(mockRpc.mock.calls[1][1].p_category).toBeNull();
  });

  it("does not retry when category was already null", async () => {
    mockRpc.mockResolvedValueOnce({ data: [], error: null });
    const out = await retrieveKnowledgeChunks({ vehicleIds: ["v1"], query: "charging", category: null, limit: 4 });
    expect(out).toEqual([]);
    expect(mockRpc).toHaveBeenCalledTimes(1);
  });

  it("degrades to [] on RPC error", async () => {
    mockRpc.mockResolvedValueOnce({ data: null, error: { message: "boom" } });
    const out = await retrieveKnowledgeChunks({ vehicleIds: ["v1"], query: "charging", category: null, limit: 4 });
    expect(out).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Multilingual retrieval — proves Arabic and English queries both reach FTS
// with English text, producing identical retrieval conditions.
// ---------------------------------------------------------------------------

describe("multilingual retrieval", () => {
  beforeEach(() => {
    mockRpc.mockReset();
    mockTranslate.mockReset();
    mockTranslate.mockImplementation(async (q: string) => q); // identity by default
  });

  it("translates an Arabic-only query to English before calling FTS", async () => {
    mockTranslate.mockResolvedValueOnce("battery charging time hours");
    mockRpc.mockResolvedValueOnce({ data: [rpcRow], error: null });

    await retrieveKnowledgeChunks({
      vehicleIds: ["v1"],
      query: "كم ساعة شحن البطارية",
      category: "battery_charging",
      limit: 4,
    });

    expect(mockTranslate).toHaveBeenCalledWith("كم ساعة شحن البطارية");
    // FTS receives English, not Arabic
    expect(mockRpc.mock.calls[0][1].p_query).toBe("battery charging time hours");
  });

  it("bypasses translation for English-only queries", async () => {
    mockRpc.mockResolvedValueOnce({ data: [rpcRow], error: null });

    await retrieveKnowledgeChunks({
      vehicleIds: ["v1"],
      query: "battery charging time",
      category: "battery_charging",
      limit: 4,
    });

    expect(mockTranslate).not.toHaveBeenCalled();
    expect(mockRpc.mock.calls[0][1].p_query).toBe("battery charging time");
  });

  it("translates mixed Arabic+English queries so Arabic tokens don't pollute tsquery", async () => {
    mockTranslate.mockResolvedValueOnce("BYD Sealion charging");
    mockRpc.mockResolvedValueOnce({ data: [rpcRow], error: null });

    await retrieveKnowledgeChunks({
      vehicleIds: ["v1"],
      query: "BYD سيلايون charging",
      category: "battery_charging",
      limit: 4,
    });

    expect(mockTranslate).toHaveBeenCalledWith("BYD سيلايون charging");
    expect(mockRpc.mock.calls[0][1].p_query).toBe("BYD Sealion charging");
  });

  it("Arabic and English equivalent queries both pass English text to FTS", async () => {
    const englishEquivalent = "how many hours does Sealion battery charging take";

    // --- Arabic query path ---
    mockTranslate.mockResolvedValueOnce(englishEquivalent);
    mockRpc.mockResolvedValueOnce({ data: [rpcRow], error: null });

    await retrieveKnowledgeChunks({
      vehicleIds: ["v1"],
      query: "كم ساعة يحتاج شحن بطارية سيلايون",
      category: "battery_charging",
      limit: 4,
    });
    const arabicFtsQuery: string = mockRpc.mock.calls[0][1].p_query;

    mockRpc.mockReset();

    // --- English query path ---
    await retrieveKnowledgeChunks({
      vehicleIds: ["v1"],
      query: englishEquivalent,
      category: "battery_charging",
      limit: 4,
    });
    const englishFtsQuery: string = mockRpc.mock.calls[0][1].p_query;

    // Both paths send English text to FTS — retrieval conditions are identical.
    expect(arabicFtsQuery).toBe(englishEquivalent);
    expect(englishFtsQuery).toBe(englishEquivalent);
    expect(arabicFtsQuery).toBe(englishFtsQuery);
  });

  it("falls back to original query and soft-narrows when translation returns identity", async () => {
    // Simulates translation returning the Arabic string (e.g. API key missing)
    mockTranslate.mockResolvedValueOnce("كم ساعة شحن البطارية");
    mockRpc
      .mockResolvedValueOnce({ data: [], error: null })       // no match with Arabic
      .mockResolvedValueOnce({ data: [rpcRow], error: null }); // soft-narrow succeeds

    const out = await retrieveKnowledgeChunks({
      vehicleIds: ["v1"],
      query: "كم ساعة شحن البطارية",
      category: "battery_charging",
      limit: 4,
    });

    // Soft-narrow (null category) still rescues retrieval even when translation fails.
    expect(out).toHaveLength(1);
    expect(mockRpc).toHaveBeenCalledTimes(2);
    expect(mockRpc.mock.calls[1][1].p_category).toBeNull();
  });

  it("each Arabic query example from the requirements retrieves chunks via translation", async () => {
    const cases: Array<{ arabic: string; english: string }> = [
      { arabic: "كم ساعة شحن البطارية؟",   english: "how many hours to charge the battery" },
      { arabic: "كم يستغرق الشحن؟",         english: "how long does charging take" },
      { arabic: "ما هي سعة البطارية؟",      english: "what is the battery capacity" },
      { arabic: "ما هو نوع الشاحن؟",        english: "what type of charger" },
    ];

    for (const { arabic, english } of cases) {
      mockRpc.mockReset();
      mockTranslate.mockReset();
      mockTranslate.mockResolvedValueOnce(english);
      mockRpc.mockResolvedValueOnce({ data: [rpcRow], error: null });

      const out = await retrieveKnowledgeChunks({
        vehicleIds: ["v1"],
        query: arabic,
        category: "battery_charging",
        limit: 4,
      });

      expect(out).toHaveLength(1);
      expect(mockRpc.mock.calls[0][1].p_query).toBe(english);
    }
  });
});

describe("computeRetrievalConfidence", () => {
  it("LOW for no chunks", () => {
    expect(computeRetrievalConfidence([])).toBe("LOW");
  });

  it("HIGH for official/dealer evidence above the rank threshold", () => {
    expect(computeRetrievalConfidence([chunk({ confidence: "dealer", rank: 0.2 })])).toBe("HIGH");
    expect(computeRetrievalConfidence([chunk({ confidence: "official", rank: 0.15 })])).toBe("HIGH");
  });

  it("MEDIUM for strong confidence but weak rank", () => {
    expect(computeRetrievalConfidence([chunk({ confidence: "dealer", rank: 0.05 })])).toBe("MEDIUM");
  });

  it("MEDIUM for estimate/needs_review evidence", () => {
    expect(computeRetrievalConfidence([chunk({ confidence: "estimate", rank: 0.2 })])).toBe("MEDIUM");
    expect(computeRetrievalConfidence([chunk({ confidence: "needs_review", rank: 0.2 })])).toBe("MEDIUM");
  });

  it("LOW when all evidence is unknown", () => {
    expect(computeRetrievalConfidence([chunk({ confidence: "unknown", rank: 0.2 })])).toBe("LOW");
  });

  it("LOW when the best rank is below the floor", () => {
    expect(computeRetrievalConfidence([chunk({ confidence: "estimate", rank: 0.005 })])).toBe("LOW");
  });
});

describe("assembleGroundedContext", () => {
  it("returns null context when there is neither structured text nor chunks", () => {
    expect(assembleGroundedContext(null, [])).toEqual({ contextText: null, citations: [] });
  });

  it("includes structured facts when present even with no chunks", () => {
    const out = assembleGroundedContext("السيارة: تويوتا راف4", []);
    expect(out.contextText).toContain("بيانات موثّقة");
    expect(out.contextText).toContain("راف4");
    expect(out.citations).toHaveLength(0);
  });

  it("emits a documents block with inline citation tags and parallel citations", () => {
    const out = assembleGroundedContext("بيانات", [chunk()]);
    expect(out.contextText).toContain("أدلة من الوثائق");
    expect(out.contextText).toContain("[المصدر: S5 ص.209");
    expect(out.citations).toHaveLength(1);
    expect(out.citations[0]).toMatchObject({ sourceRef: "S5", pageRef: "209", confidence: "dealer" });
  });
});
