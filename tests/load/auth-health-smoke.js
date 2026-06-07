/* global __ENV */
/**
 * VoltJo Auth Health Endpoint Smoke Test
 *
 * Tests /api/health/auth only. No login attempts. No credentials sent.
 * Verifies the endpoint is reachable and responds correctly.
 *
 * Usage:
 *   k6 run tests/load/auth-health-smoke.js
 *   k6 run -e BASE_URL=https://staging.voltjo.com tests/load/auth-health-smoke.js
 *
 * WARNING: Never run with high VUs or long duration against production.
 * See tests/load/README.md for guidance.
 */

import http from "k6/http";
import { check, sleep } from "k6";
import { Rate } from "k6/metrics";

const errorRate = new Rate("errors");

// Default to localhost. Must be overridden explicitly for staging/prod.
const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";

export const options = {
  // Conservative defaults. Increase only with explicit team approval.
  vus: 2,
  duration: "20s",
  thresholds: {
    http_req_duration: ["p(95)<2000"],
    http_req_failed: ["rate<0.01"],
    errors: ["rate<0.01"],
  },
};

export default function () {
  const url = `${BASE_URL}/api/health/auth`;
  const res = http.get(url, {
    tags: { endpoint: "health-auth" },
    timeout: "10s",
  });

  const ok = check(res, {
    "health-auth: status 200": (r) => r.status === 200,
    "health-auth: response time < 2s": (r) => r.timings.duration < 2000,
    "health-auth: has authenticated field": (r) => {
      try {
        const body = JSON.parse(r.body);
        return typeof body.authenticated === "boolean";
      } catch {
        return false;
      }
    },
    "health-auth: no cache": (r) =>
      (r.headers["Cache-Control"] || "").includes("no-store"),
  });

  errorRate.add(!ok);
  sleep(1);
}

export function handleSummary(data) {
  return {
    stdout: JSON.stringify(
      {
        test: "auth-health-smoke",
        base_url: BASE_URL,
        timestamp: new Date().toISOString(),
        p95_ms: Math.round(
          data.metrics.http_req_duration?.values?.["p(95)"] ?? 0,
        ),
        error_rate: data.metrics.http_req_failed?.values?.rate ?? 0,
      },
      null,
      2,
    ),
  };
}
