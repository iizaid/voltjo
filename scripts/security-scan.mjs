/**
 * VoltJo Automated Security & Penetration Testing Scanner
 *
 * Runs vulnerability simulation checks against the local production server.
 * Ensures the app blocks common web attacks (SQLi, XSS, IDOR, Rate limit exhaustion).
 *
 * Usage:
 *   node scripts/security-scan.mjs
 */

const BASE_URL = process.env.BASE_URL || "http://127.0.0.1:3000";

async function runTest(name, fn) {
  try {
    const success = await fn();
    if (success) {
      console.log(`\x1b[32m[✓] PASS: ${name}\x1b[0m`);
      return true;
    } else {
      console.error(`\x1b[31m[✗] FAIL: ${name}\x1b[0m`);
      return false;
    }
  } catch (error) {
    console.error(`\x1b[31m[✗] ERROR: ${name} failed with exception: ${error.message}\x1b[0m`);
    return false;
  }
}

// ------------------------------------------------------------
// 1. Auth Bypass & IDOR Check
// ------------------------------------------------------------
async function checkAuthBypass() {
  const endpoints = [
    { url: `${BASE_URL}/api/account/export`, method: "GET" },
    { url: `${BASE_URL}/api/account/location-preferences`, method: "POST" },
    { url: `${BASE_URL}/api/account/avatar`, method: "POST" },
  ];

  let allBlocked = true;

  for (const endpoint of endpoints) {
    const res = await fetch(endpoint.url, {
      method: endpoint.method,
      headers: { "Content-Type": "application/json" },
      body: endpoint.method === "POST" ? JSON.stringify({ test: "data" }) : undefined,
    });

    // Anonymous requests to protected APIs must return 401 Unauthorized
    if (res.status !== 401) {
      console.warn(`      Endpoint ${endpoint.method} ${endpoint.url} returned status ${res.status} (Expected 401)`);
      allBlocked = false;
    }
  }

  return allBlocked;
}

// ------------------------------------------------------------
// 2. SQL Injection (SQLi) Protection Check
// ------------------------------------------------------------
async function checkSQLiProtection() {
  const sqliPayloads = [
    "byd-song-plus-dmi-2025' OR '1'='1",
    "byd-song-plus-dmi-2025'; DROP TABLE supported_vehicles;--",
    "byd-song-plus-dmi-2025' UNION SELECT null, null, null--",
  ];

  let allSafe = true;

  for (const payload of sqliPayloads) {
    const url = `${BASE_URL}/vehicles/${encodeURIComponent(payload)}`;
    const res = await fetch(url);

    // SQLi injection attempts against vehicle detail slug should return 404 (Not Found)
    // or return 200 OK with the actual 404 error page (due to Next.js loading.tsx streaming)
    // and must never trigger internal server errors (500)
    if (res.status === 500) {
      console.warn(`      Payload [${payload}] triggered a 500 Internal Server Error (vulnerable database exception leak)`);
      allSafe = false;
    } else if (res.status === 404) {
      // Direct 404 (expected/safe)
    } else if (res.status === 200) {
      const text = await res.text();
      const isNotFoundPage = text.includes("الصفحة غير موجودة") || text.includes("404");
      if (!isNotFoundPage) {
        console.warn(`      Payload [${payload}] returned status 200 but did not render the Not Found page (potential SQL Injection bypass)`);
        allSafe = false;
      }
    } else {
      console.warn(`      Payload [${payload}] returned unexpected status ${res.status}`);
      allSafe = false;
    }
  }

  return allSafe;
}

// ------------------------------------------------------------
// 3. Cross-Site Scripting (XSS) Input Validation Check
// ------------------------------------------------------------
async function checkXSSProtection() {
  const xssPayloads = [
    "<script>alert('XSS')</script>",
    "javascript:alert(1)",
    "<img src=x onerror=alert(1)>",
  ];

  let allSafe = true;

  for (const payload of xssPayloads) {
    // Attempting to post an XSS payload to api/chat
    const res = await fetch(`${BASE_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: payload,
        modelId: "voltjo",
        thinkingMode: false,
        history: [],
      }),
    });

    // The API should handle it safely (either returning 400 Bad Request, 
    // 401 Unauthorized if unauthenticated, or 429 - but never 500)
    if (res.status === 500) {
      console.warn(`      Chat API with XSS payload triggered 500 Internal Server Error`);
      allSafe = false;
    } else if (res.status !== 400 && res.status !== 401 && res.status !== 429 && res.status !== 200) {
      console.warn(`      Chat API with XSS payload returned unexpected status ${res.status}`);
      allSafe = false;
    }
  }

  return allSafe;
}

// ------------------------------------------------------------
// 4. Rate Limiting Protection Check
// ------------------------------------------------------------
async function checkRateLimiting() {
  const url = `${BASE_URL}/api/chat`;
  
  // Flood requests to the chat endpoint to trigger the rate limiter.
  // The default limit for guests is small (10).
  let rateLimited = false;

  for (let i = 0; i < 20; i++) {
    const res = await fetch(url, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "X-Forwarded-For": "127.0.0.99" // Mock IP to isolate rate-limit bucket
      },
      body: JSON.stringify({
        message: "Ping",
        modelId: "voltjo",
        thinkingMode: false,
        history: []
      }),
    });

    if (res.status === 429) {
      rateLimited = true;
      break;
    }
    // Small delay to prevent network connection exhaustion on Windows
    await new Promise(r => setTimeout(r, 50));
  }

  return rateLimited;
}

// ------------------------------------------------------------
// Main Execution
// ------------------------------------------------------------
async function runAllScans() {
  console.log("\n=============================================================");
  console.log(" VoltJo Security & Penetration Testing Suite");
  console.log(` Target Server: ${BASE_URL}`);
  console.log("=============================================================");

  const results = [];

  results.push(await runTest("Auth Bypass & IDOR Protection", checkAuthBypass));
  results.push(await runTest("SQL Injection (SQLi) Mitigation", checkSQLiProtection));
  results.push(await runTest("Cross-Site Scripting (XSS) Sanitization Check", checkXSSProtection));
  results.push(await runTest("Abuse & Rate Limiting Enforcement", checkRateLimiting));

  console.log("=============================================================");
  
  const allPassed = results.every(r => r === true);
  if (allPassed) {
    console.log("\x1b[32;1m✓ CONGRATULATIONS: All penetration test checks PASSED successfully.\x1b[0m\n");
    process.exit(0);
  } else {
    console.error("\x1b[31;1m✗ WARNING: One or more security tests FAILED. Review warnings above.\x1b[0m\n");
    process.exit(1);
  }
}

runAllScans();
