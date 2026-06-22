/* global __ENV */
/**
 * VoltJo Extreme Stress & Load Test
 *
 * Simulates intense concurrent traffic (up to 150 VUs).
 *
 * Usage:
 *   k6 run -e BASE_URL=http://127.0.0.1:3000 tests/load/extreme-stress-test.js
 */

import http from "k6/http";
import { check, sleep } from "k6";
import { Rate, Trend } from "k6/metrics";

const errorRate = new Rate("errors");
const pageLoadTime = new Trend("page_load_time");

const BASE_URL = __ENV.BASE_URL || "http://127.0.0.1:3000";

export const options = {
  stages: [
    { duration: "15s", target: 50 },  // Ramp to 50 VUs
    { duration: "20s", target: 50 },  // Hold at 50 VUs
    { duration: "20s", target: 100 }, // Ramp to 100 VUs
    { duration: "20s", target: 100 }, // Hold at 100 VUs
    { duration: "20s", target: 150 }, // Ramp to 150 VUs (extreme load)
    { duration: "20s", target: 150 }, // Hold at 150 VUs
    { duration: "15s", target: 0 },   // Ramp down to 0 VUs
  ],
  thresholds: {
    http_req_duration: ["p(95)<3000"], // p95 response time under 3s
    http_req_failed: ["rate<0.05"],    // Less than 5% HTTP request failures
    errors: ["rate<0.05"],             // Less than 5% validation check failures
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
  const route = publicRoutes[Math.floor(Math.random() * publicRoutes.length)];
  const url = `${BASE_URL}${route.path}`;
  
  const res = http.get(url, {
    tags: { page: route.label },
    timeout: "10s",
  });

  const ok = check(res, {
    [`${route.label}: status 200`]: (r) => r.status === 200,
    [`${route.label}: response time < 3s`]: (r) => r.timings.duration < 3000,
  });

  errorRate.add(!ok);
  pageLoadTime.add(res.timings.duration, { page: route.label });

  // Real users sleep around 1 to 2 seconds between clicks
  sleep(1 + Math.random());
}

export function handleSummary(data) {
  return {
    stdout: JSON.stringify(
      {
        test: "extreme-stress-test",
        base_url: BASE_URL,
        timestamp: new Date().toISOString(),
        total_requests: data.metrics.http_reqs?.values?.count ?? 0,
        p95_ms: Math.round(
          data.metrics.http_req_duration?.values?.["p(95)"] ?? 0,
        ),
        p99_ms: Math.round(
          data.metrics.http_req_duration?.values?.["p(99)"] ?? 0,
        ),
        error_rate: data.metrics.http_req_failed?.values?.rate ?? 0,
      },
      null,
      2,
    ),
  };
}
