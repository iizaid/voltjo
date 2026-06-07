/* global __ENV */
/**
 * VoltJo Public Pages Smoke Test
 *
 * Tests public-facing pages only. No authentication. No destructive requests.
 * Default config is intentionally conservative.
 *
 * Usage:
 *   k6 run tests/load/public-smoke.js
 *   k6 run -e BASE_URL=https://staging.voltjo.com tests/load/public-smoke.js
 *
 * WARNING: Never run with high VUs or long duration against production.
 * See tests/load/README.md for guidance.
 */

import http from "k6/http";
import { check, sleep } from "k6";
import { Rate, Trend } from "k6/metrics";

const errorRate = new Rate("errors");
const pageLoadTime = new Trend("page_load_time");

// Default to localhost. Must be overridden explicitly for staging/prod.
const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";

export const options = {
  // Conservative defaults. Increase only with explicit team approval.
  vus: 3,
  duration: "30s",
  thresholds: {
    http_req_duration: ["p(95)<2000"],
    http_req_failed: ["rate<0.01"],
    errors: ["rate<0.01"],
  },
};

const publicRoutes = [
  { path: "/", label: "home" },
  { path: "/vehicles", label: "vehicles-list" },
  { path: "/charging-calculator", label: "charging-calculator" },
  { path: "/privacy", label: "privacy" },
  { path: "/terms", label: "terms" },
];

export default function () {
  for (const route of publicRoutes) {
    const url = `${BASE_URL}${route.path}`;
    const res = http.get(url, {
      tags: { page: route.label },
      timeout: "10s",
    });

    const ok = check(res, {
      [`${route.label}: status 200`]: (r) => r.status === 200,
      [`${route.label}: response time < 2s`]: (r) => r.timings.duration < 2000,
    });

    errorRate.add(!ok);
    pageLoadTime.add(res.timings.duration, { page: route.label });

    sleep(1);
  }
}

export function handleSummary(data) {
  return {
    stdout: JSON.stringify(
      {
        test: "public-smoke",
        base_url: BASE_URL,
        timestamp: new Date().toISOString(),
        thresholds_passed: !data.metrics.http_req_failed?.thresholds?.some(
          (t) => t.ok === false,
        ),
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
