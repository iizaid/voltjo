/* global __ENV */

import http from "k6/http";
import { check, sleep } from "k6";

const BASE_URL = __ENV.BASE_URL || "https://voltjo.mousatam96.workers.dev";

export const options = {
  stages: [
    { duration: "30s", target: 5 },
    { duration: "1m", target: 10 },
    { duration: "30s", target: 0 },
  ],
  thresholds: {
    http_req_failed: ["rate<0.02"],
    http_req_duration: ["p(95)<2500"],
  },
};

const pages = [
  "/",
  "/vehicles",
  "/charging-calculator",
  "/charging-map",
  "/assistant",
  "/privacy",
  "/terms",
  "/data-deletion",
];

export default function () {
  for (const path of pages) {
    const res = http.get(`${BASE_URL}${path}`, {
      tags: { page: path },
    });

    check(res, {
      [`${path} status is 200`]: (r) => r.status === 200,
      [`${path} no server error`]: (r) => r.status < 500,
      [`${path} has body`]: (r) => r.body && r.body.length > 500,
    });

    sleep(0.4);
  }

  sleep(1);
}
