#!/usr/bin/env node
/* global console */
// No external dependencies required.

const lines = [
  "=== VoltJo Auth Debug Helper ===",
  "",
  "STEP 1: Set the environment variable",
  "  NEXT_PUBLIC_AUTH_DEBUG=true",
  "",
  "  Local:      add to .env.local and restart npm run dev",
  "  Cloudflare: Workers & Pages → voltjo → Settings → Variables and Secrets",
  "              then redeploy (npm run deploy)",
  "",
  "STEP 2: URLs to open in a browser",
  "  Health check: <your-domain>/api/health/auth",
  "  Debug UI:     <your-domain>/debug/auth",
  "",
  "STEP 3: Manual OAuth test checklist",
  "  [ ] Open an incognito / private window",
  "  [ ] Navigate to /debug/auth → click 'Clear debug events'",
  "  [ ] Navigate to /start",
  "  [ ] Complete the onboarding questions",
  "  [ ] Click the Google or GitHub button",
  "  [ ] After redirect / failure, navigate to /debug/auth",
  "  [ ] Click 'Copy debug report'",
  "  [ ] The copied text contains no secrets, tokens, or PII — safe to share",
  "",
  "REMINDER: OAuth flows require a browser.",
  "  The provider redirect and callback cannot be tested from the terminal.",
  "",
  "REMINDER: Disable NEXT_PUBLIC_AUTH_DEBUG before production launch.",
  "  Set it to false (or remove it) and redeploy.",
];

console.log(lines.join("\n"));
