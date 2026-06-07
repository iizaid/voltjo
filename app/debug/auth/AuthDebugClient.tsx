"use client";

import { useCallback, useEffect, useState } from "react";
import {
  isAuthDebugEnabled,
  readAuthDebugEvents,
  clearAuthDebugEvents,
  type AuthDebugEvent,
} from "@/lib/auth/auth-debug";

type HealthData = {
  authenticated: boolean;
  hasProfile: boolean;
  onboardingCompleted: boolean | null;
  hasSupabaseUrl: boolean;
  hasSupabaseAnonKey: boolean;
  cookieCount: number;
  hasSupabaseCookieNamePrefix: boolean;
  hasSupabaseAuthTokenCookie: boolean;
  hasSupabaseCodeVerifierCookie: boolean;
  requestUrlPath?: string;
  safeQueryParamNames?: string[];
  timestamp: string;
};

function buildReport(
  events: AuthDebugEvent[],
  health: HealthData | null,
  locationPath: string,
  locationParams: string[],
): string {
  const lines = [
    "=== VoltJo Auth Debug Report ===",
    `Generated: ${new Date().toISOString()}`,
    "",
    "--- Current Location ---",
    `Path: ${locationPath}`,
    `Query param names: ${locationParams.join(", ") || "(none)"}`,
    "",
    "--- Health Check ---",
    health ? JSON.stringify(health, null, 2) : "(not loaded)",
    "",
    `--- Auth Events (${events.length}) ---`,
    ...events.map((e, i) => `[${i + 1}] ${JSON.stringify(e)}`),
  ];
  return lines.join("\n");
}

export function AuthDebugClient() {
  const [events, setEvents] = useState<AuthDebugEvent[]>([]);
  const [health, setHealth] = useState<HealthData | null>(null);
  const [healthLoading, setHealthLoading] = useState(false);
  const [healthError, setHealthError] = useState(false);
  const [copyDone, setCopyDone] = useState(false);
  const [locationPath, setLocationPath] = useState("");
  const [locationParams, setLocationParams] = useState<string[]>([]);

  const loadEvents = useCallback(() => {
    setEvents(readAuthDebugEvents());
  }, []);

  const fetchHealth = useCallback(async () => {
    setHealthLoading(true);
    setHealthError(false);
    try {
      const res = await fetch("/api/health/auth");
      const data = (await res.json()) as HealthData;
      setHealth(data);
    } catch {
      setHealthError(true);
    } finally {
      setHealthLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEvents();
    void fetchHealth();
    const u = new URL(window.location.href);
    setLocationPath(u.pathname);
    setLocationParams([...u.searchParams.keys()]);
  }, [loadEvents, fetchHealth]);

  const handleClear = () => {
    clearAuthDebugEvents();
    loadEvents();
  };

  const handleCopy = async () => {
    const report = buildReport(events, health, locationPath, locationParams);
    try {
      await navigator.clipboard.writeText(report);
      setCopyDone(true);
      setTimeout(() => setCopyDone(false), 2000);
    } catch {
      // Non-fatal — clipboard may be unavailable
    }
  };

  if (!isAuthDebugEnabled()) {
    return (
      <main className="grid min-h-dvh place-items-center p-8" dir="ltr">
        <p className="font-mono text-sm text-gray-500">Auth debug is disabled.</p>
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-white p-6" dir="ltr">
      <h1 className="mb-1 font-mono text-base font-bold">VoltJo Auth Debug</h1>
      <p className="mb-6 font-mono text-xs text-gray-400">
        Safe diagnostic view — no tokens, emails, or IDs shown.
      </p>

      {/* Current URL info */}
      <section className="mb-6">
        <h2 className="mb-2 font-mono text-xs font-bold uppercase tracking-wide text-gray-500">
          Current Location
        </h2>
        <div className="rounded border border-gray-200 bg-gray-50 p-3 font-mono text-xs">
          <div>
            <span className="text-gray-400">path: </span>
            <span>{locationPath || "(loading)"}</span>
          </div>
          <div>
            <span className="text-gray-400">query param names: </span>
            <span>
              {locationParams.length > 0 ? locationParams.join(", ") : "(none)"}
            </span>
          </div>
        </div>
      </section>

      {/* Health check */}
      <section className="mb-6">
        <h2 className="mb-2 font-mono text-xs font-bold uppercase tracking-wide text-gray-500">
          Health Check
        </h2>
        <div className="rounded border border-gray-200 bg-gray-50 p-3 font-mono text-xs">
          {healthLoading ? (
            <span className="text-gray-400">Loading...</span>
          ) : healthError ? (
            <span className="text-red-500">
              Failed to load /api/health/auth
            </span>
          ) : health ? (
            <pre className="whitespace-pre-wrap">
              {JSON.stringify(health, null, 2)}
            </pre>
          ) : (
            <span className="text-gray-400">Not loaded</span>
          )}
        </div>
        <button
          type="button"
          onClick={() => void fetchHealth()}
          className="mt-2 rounded border border-gray-200 bg-white px-3 py-1 font-mono text-xs hover:bg-gray-50"
        >
          Refresh health check
        </button>
      </section>

      {/* Debug events */}
      <section>
        <h2 className="mb-2 font-mono text-xs font-bold uppercase tracking-wide text-gray-500">
          Auth Events ({events.length})
        </h2>
        <div className="mb-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void handleCopy()}
            className="rounded border border-gray-200 bg-white px-3 py-1 font-mono text-xs hover:bg-gray-50"
          >
            {copyDone ? "Copied!" : "Copy debug report"}
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="rounded border border-gray-200 bg-white px-3 py-1 font-mono text-xs hover:bg-gray-50"
          >
            Clear debug events
          </button>
          <button
            type="button"
            onClick={loadEvents}
            className="rounded border border-gray-200 bg-white px-3 py-1 font-mono text-xs hover:bg-gray-50"
          >
            Refresh events
          </button>
        </div>
        {events.length === 0 ? (
          <div className="rounded border border-gray-200 bg-gray-50 p-4 font-mono text-xs text-gray-400">
            No events recorded. Set NEXT_PUBLIC_AUTH_DEBUG=true, redeploy, then
            attempt a sign-in.
          </div>
        ) : (
          <div className="space-y-2">
            {events.map((event, index) => (
              <div
                key={`${event.id}-${index}`}
                className="rounded border border-gray-200 bg-gray-50 p-3 font-mono text-xs"
              >
                <div className="mb-1 font-bold text-gray-700">
                  [{index + 1}] {event.stage}
                </div>
                <pre className="whitespace-pre-wrap text-gray-500">
                  {JSON.stringify({ ...event, stage: undefined }, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
