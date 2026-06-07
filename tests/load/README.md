# VoltJo Load Test Harness

Safe, conservative smoke tests using [k6](https://k6.io/). These scripts are for **local and staging environments only**.

---

## IMPORTANT: Do Not Run Against Production

**Never** run these scripts against `voltjo.com` or any live production URL without explicit team approval. The defaults are conservative but still generate traffic that does not belong on a production origin.

---

## Prerequisites

### Install k6

**macOS (Homebrew):**
```bash
brew install k6
```

**Windows (Winget):**
```bash
winget install k6 --source winget
```

**Linux:**
```bash
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update && sudo apt-get install k6
```

Verify: `k6 version`

---

## Running Tests Locally

Start the dev server first:
```bash
npm run dev
```

Then run a smoke test:
```bash
npm run load:public
# or
npm run load:auth-health
```

Or run directly with k6:
```bash
k6 run tests/load/public-smoke.js
k6 run tests/load/auth-health-smoke.js
```

---

## Running Against Staging

Pass the `BASE_URL` environment variable:
```bash
k6 run -e BASE_URL=https://staging.voltjo.com tests/load/public-smoke.js
k6 run -e BASE_URL=https://staging.voltjo.com tests/load/auth-health-smoke.js
```

---

## Default Settings

| Script | VUs | Duration | p95 Threshold | Error Rate Threshold |
|---|---|---|---|---|
| `public-smoke.js` | 3 | 30s | < 2000ms | < 1% |
| `auth-health-smoke.js` | 2 | 20s | < 2000ms | < 1% |

These defaults are intentionally minimal. To test at higher load, increase `vus` and `duration` in the script — but only on staging and only with team approval.

---

## How to Interpret Results

After a run, k6 prints a summary. Key metrics:

| Metric | What It Means |
|---|---|
| `http_req_duration p(95)` | 95% of requests completed within this time. Target: < 2000ms |
| `http_req_duration p(99)` | 99th percentile — catches tail latency spikes |
| `http_req_failed` | Fraction of failed requests (non-2xx or timeout). Target: < 1% |
| `errors` | Custom check failures (unexpected status codes, missing fields) |

A healthy run shows all thresholds as `✓`. A failing run shows `✗` with the threshold that was exceeded.

---

## How to Stop Tests

Press `Ctrl+C` at any time. k6 will print a partial summary and exit cleanly.

---

## How to Increase Load Gradually (Staging Only, With Approval)

To ramp up, use the `stages` option instead of fixed `vus`/`duration`:

```js
export const options = {
  stages: [
    { duration: "30s", target: 5 },  // ramp up to 5 VUs
    { duration: "1m",  target: 5 },  // hold at 5 VUs
    { duration: "15s", target: 0 },  // ramp down
  ],
  thresholds: {
    http_req_duration: ["p(95)<2000"],
    http_req_failed: ["rate<0.01"],
  },
};
```

Only increase VUs after reviewing Cloudflare Workers observability logs and Supabase query performance. Never run more than 20 VUs without a dedicated staging environment and team approval.

---

## Available npm Scripts

```bash
npm run load:public        # public-smoke.js against localhost:3000
npm run load:auth-health   # auth-health-smoke.js against localhost:3000
```

These scripts are excluded from the normal test/build pipeline (`npm test`, `npm run build`).

---

## Cloudflare Observability

After deploying, check Cloudflare dashboard:
- Workers and Pages → voltjo → Observability → Logs
- Filter by `outcome: exception` or `status_code >= 500`
- Check `cpu_time` and `wall_time` for Worker performance

---

## Rollback After Bad Load Test

If a load test causes issues on staging:
1. Stop the test: `Ctrl+C`
2. Check Cloudflare logs for 5xx or Worker CPU limit hits
3. If Redis rate limiting triggered: wait for the window to expire (default 10 minutes for chat)
4. Redeploy stable commit if needed: `npx wrangler rollback`
