import { describe, it, expect } from "vitest";
import {
  runWithAbortableTimeout,
  combineAbortSignals,
} from "@/lib/server/timeout";

describe("runWithAbortableTimeout", () => {
  it("returns the work result when it finishes in time", async () => {
    const result = await runWithAbortableTimeout({
      timeoutMs: 1000,
      work: async () => "ok",
    });
    expect(result).toBe("ok");
  });

  it("aborts the provided signal and rejects on timeout", async () => {
    let aborted = false;
    const promise = runWithAbortableTimeout({
      timeoutMs: 10,
      errorMessage: "deadline",
      work: (signal) =>
        new Promise((resolve) => {
          signal.addEventListener("abort", () => {
            aborted = true;
            // A well-behaved worker stops; we never resolve here.
          });
          // Simulate a long-running call that ignores resolution.
          setTimeout(() => resolve("late"), 1000);
        }),
    });

    await expect(promise).rejects.toThrow("deadline");
    expect(aborted).toBe(true);
  });

  it("propagates a work error that occurs before the deadline", async () => {
    const promise = runWithAbortableTimeout({
      timeoutMs: 1000,
      work: async () => {
        throw new Error("boom");
      },
    });
    await expect(promise).rejects.toThrow("boom");
  });
});

describe("combineAbortSignals", () => {
  it("returns undefined when no signals are given", () => {
    expect(combineAbortSignals(undefined, undefined)).toBeUndefined();
  });

  it("passes through a single signal", () => {
    const c = new AbortController();
    expect(combineAbortSignals(c.signal, undefined)).toBe(c.signal);
  });

  it("aborts the combined signal when any input aborts", () => {
    const a = new AbortController();
    const b = new AbortController();
    const combined = combineAbortSignals(a.signal, b.signal);
    expect(combined?.aborted).toBe(false);
    b.abort();
    expect(combined?.aborted).toBe(true);
  });

  it("is already aborted if an input was aborted before combining", () => {
    const a = new AbortController();
    a.abort();
    const b = new AbortController();
    const combined = combineAbortSignals(a.signal, b.signal);
    expect(combined?.aborted).toBe(true);
  });
});
