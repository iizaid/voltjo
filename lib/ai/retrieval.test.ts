import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the service-role client so retrieval can be exercised without a DB.
// Name is `mock`-prefixed so vitest's hoisted vi.mock factory may reference it.
const mockRpc = vi.fn();
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ rpc: mockRpc }),
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
  beforeEach(() => mockRpc.mockReset());

  it("returns [] without calling the RPC when no vehicle ids", async () => {
    const out = await retrieveKnowledgeChunks({ vehicleIds: [], query: "شحن", category: null, limit: 4 });
    expect(out).toEqual([]);
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it("maps snake_case RPC rows into camelCase chunks", async () => {
    mockRpc.mockResolvedValueOnce({ data: [rpcRow], error: null });
    const out = await retrieveKnowledgeChunks({ vehicleIds: ["v1"], query: "شحن", category: "battery_charging", limit: 4 });
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({ vehicleId: "v1", sourceRef: "S5", pageRef: "209", confidence: "dealer", rank: 0.2 });
  });

  it("soft-narrows: retries with null category when the categorized query is empty", async () => {
    mockRpc
      .mockResolvedValueOnce({ data: [], error: null }) // categorized attempt
      .mockResolvedValueOnce({ data: [rpcRow], error: null }); // broadened retry
    const out = await retrieveKnowledgeChunks({ vehicleIds: ["v1"], query: "شحن", category: "safety", limit: 4 });
    expect(out).toHaveLength(1);
    expect(mockRpc).toHaveBeenCalledTimes(2);
    expect(mockRpc.mock.calls[0][1].p_category).toBe("safety");
    expect(mockRpc.mock.calls[1][1].p_category).toBeNull();
  });

  it("does not retry when category was already null", async () => {
    mockRpc.mockResolvedValueOnce({ data: [], error: null });
    const out = await retrieveKnowledgeChunks({ vehicleIds: ["v1"], query: "شحن", category: null, limit: 4 });
    expect(out).toEqual([]);
    expect(mockRpc).toHaveBeenCalledTimes(1);
  });

  it("degrades to [] on RPC error", async () => {
    mockRpc.mockResolvedValueOnce({ data: null, error: { message: "boom" } });
    const out = await retrieveKnowledgeChunks({ vehicleIds: ["v1"], query: "شحن", category: null, limit: 4 });
    expect(out).toEqual([]);
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
