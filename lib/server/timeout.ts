import "server-only";

export async function withTimeout<T>({
  promise,
  timeoutMs,
  errorMessage,
}: {
  promise: Promise<T>;
  timeoutMs: number;
  errorMessage?: string;
}): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(errorMessage ?? "Operation timed out"));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

/**
 * Combine multiple AbortSignals into one that aborts as soon as ANY input does.
 * Prefers the native `AbortSignal.any` when available (Workers/modern runtimes)
 * and falls back to a manual implementation otherwise. `undefined` inputs are
 * ignored so callers can pass optional signals directly.
 */
export function combineAbortSignals(
  ...signals: Array<AbortSignal | undefined>
): AbortSignal | undefined {
  const present = signals.filter((s): s is AbortSignal => Boolean(s));
  if (present.length === 0) return undefined;
  if (present.length === 1) return present[0];

  const anyFn = (AbortSignal as unknown as {
    any?: (signals: AbortSignal[]) => AbortSignal;
  }).any;
  if (typeof anyFn === "function") {
    return anyFn(present);
  }

  const controller = new AbortController();
  const onAbort = () => controller.abort();
  for (const s of present) {
    if (s.aborted) {
      controller.abort();
      break;
    }
    s.addEventListener("abort", onAbort, { once: true });
  }
  return controller.signal;
}

/**
 * Run `work` under a hard deadline backed by a real AbortController, so that
 * when the deadline elapses the underlying operation is actually CANCELLED
 * (e.g. an in-flight fetch) rather than merely abandoned via Promise.race.
 *
 * The signal is passed into `work`, which must thread it down to any cancellable
 * I/O (fetch, retries, backoff). On timeout the controller is aborted and the
 * returned promise rejects with `errorMessage`. No provider call may keep
 * running after the deadline.
 */
export async function runWithAbortableTimeout<T>({
  work,
  timeoutMs,
  errorMessage,
}: {
  work: (signal: AbortSignal) => Promise<T>;
  timeoutMs: number;
  errorMessage?: string;
}): Promise<T> {
  const controller = new AbortController();
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  // The timeout both ABORTS the work (so an in-flight fetch is cancelled, no
  // orphaned provider call) AND rejects the race (so the route returns promptly
  // even if a provider were to ignore the signal). Belt and suspenders.
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      controller.abort();
      reject(new Error(errorMessage ?? "Operation timed out"));
    }, timeoutMs);
  });

  try {
    return await Promise.race([work(controller.signal), timeoutPromise]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}
