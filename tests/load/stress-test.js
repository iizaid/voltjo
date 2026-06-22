/* global __ENV */
/**
 * VoltJo Ramping Stress & Load Test
 *
 * Tests public-facing pages under graduated concurrent load.
 *
 * Usage:
 *   k6 run tests/load/stress-test.js
 *   k6 run -e BASE_URL=https://staging.voltjo.com tests/load/stress-test.js
 */

import http from "k6/http";
import { check, sleep } from "k6";
import { Rate, Trend } from "k6/metrics";

const errorRate = new Rate("errors");
const pageLoadTime = new Trend("page_load_time");

// Default to local production server.
const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";

export const options = {
  stages: [
    { duration: "10s", target: 10 }, // Ramp up to 10 VUs
    { duration: "15s", target: 10 }, // Hold at 10 VUs
    { duration: "15s", target: 30 }, // Ramp up to 30 VUs
    { duration: "15s", target: 30 }, // Hold at 30 VUs
    { duration: "15s", target: 50 }, // Ramp up to 50 VUs
    { duration: "15s", target: 50 }, // Hold at 50 VUs
    { duration: "10s", target: 0 },  // Ramp down to 0 VUs
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
  // Select a random route from the list to simulate varied user browsing behavior
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

  // Sleep randomly between 1 to 2 seconds to simulate real user thinking time
  sleep(1 + Math.random());
}

export function handleSummary(data) {
  return {
    stdout: JSON.stringify(
      {
        test: "stress-test",
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
