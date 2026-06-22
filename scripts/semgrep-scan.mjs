/**
 * VoltJo Semgrep SAST runner (Docker-backed)
 *
 * Runs static analysis security scanning over the source tree using the
 * official `semgrep/semgrep` Docker image — Semgrep has no native Windows
 * binary, so Docker is the reliable cross-platform path.
 *
 * Modes:
 *   node scripts/semgrep-scan.mjs            Full scan of the repo (human output)
 *   node scripts/semgrep-scan.mjs --changed  Scan only git-changed code files
 *   node scripts/semgrep-scan.mjs --json     Emit raw Semgrep JSON
 *   node scripts/semgrep-scan.mjs --hook     Quiet changed-files scan for the
 *                                            Claude Code Stop hook. Always exits 0
 *                                            and surfaces findings via systemMessage.
 *
 * Exit codes (non-hook modes): 0 = clean, 1 = findings, 2 = runner error.
 */

import { spawnSync } from "node:child_process";

const IMAGE = process.env.SEMGREP_IMAGE || "semgrep/semgrep:latest";

// Registry rulesets (community packs, no login required) tuned for this stack.
// Override with SEMGREP_CONFIGS="p/foo,p/bar".
const FULL_CONFIGS = (process.env.SEMGREP_CONFIGS ||
  "p/default,p/javascript,p/typescript,p/react,p/nextjs,p/secrets,p/owasp-top-ten")
  .split(",")
  .map((c) => c.trim())
  .filter(Boolean);

// Lighter set for fast changed-file / hook scans.
const CHANGED_CONFIGS = (process.env.SEMGREP_CONFIGS_CHANGED ||
  "p/javascript,p/typescript,p/react,p/nextjs,p/secrets")
  .split(",")
  .map((c) => c.trim())
  .filter(Boolean);

// Project-local custom rules (mounted inside the container at /src).
const LOCAL_RULES = ".semgrep/voltjo-rules.yml";

const CODE_EXT = /\.(m?js|cjs|jsx|ts|tsx)$/i;

const args = new Set(process.argv.slice(2));
const isHook = args.has("--hook");
const isChanged = isHook || args.has("--changed");
const asJson = args.has("--json");

function git(cmdArgs) {
  const r = spawnSync("git", cmdArgs, { encoding: "utf8" });
  return r.status === 0 ? r.stdout.trim() : "";
}

function repoRoot() {
  return git(["rev-parse", "--show-toplevel"]) || process.cwd();
}

function dockerAvailable() {
  const r = spawnSync("docker", ["info"], { stdio: "ignore" });
  return r.status === 0;
}

/** Tracked changes vs HEAD + untracked files, filtered to scannable code. */
function changedFiles(root) {
  const tracked = git(["-C", root, "diff", "--name-only", "--diff-filter=ACMR", "HEAD"]);
  const untracked = git(["-C", root, "ls-files", "--others", "--exclude-standard"]);
  const all = [...tracked.split("\n"), ...untracked.split("\n")]
    .map((f) => f.trim())
    .filter((f) => f && CODE_EXT.test(f));
  return [...new Set(all)];
}

function buildSemgrepArgs(configs, targets) {
  const flags = [];
  for (const c of configs) flags.push("--config", c);
  flags.push("--config", `/src/${LOCAL_RULES}`);
  if (asJson || isHook) flags.push("--json");
  flags.push("--metrics=off", "--disable-version-check", "--quiet");
  // In changed/hook mode, restrict to the specific files; otherwise scan /src.
  if (targets && targets.length) flags.push(...targets);
  return flags;
}

function runSemgrep(root, configs, targets) {
  const dockerArgs = [
    "run",
    "--rm",
    "-v",
    `${root}:/src`,
    "-w",
    "/src",
    IMAGE,
    "semgrep",
    "scan",
    ...buildSemgrepArgs(configs, targets),
  ];
  return spawnSync("docker", dockerArgs, {
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
}

function summarizeFindings(jsonStr) {
  let data;
  try {
    data = JSON.parse(jsonStr);
  } catch {
    return { count: 0, lines: [] };
  }
  const results = Array.isArray(data.results) ? data.results : [];
  const lines = results.map((r) => {
    const sev = (r.extra?.severity || "INFO").toUpperCase();
    const msg = (r.extra?.message || r.check_id || "").split("\n")[0].slice(0, 140);
    const loc = `${r.path}:${r.start?.line ?? "?"}`;
    return `  [${sev}] ${loc} — ${msg} (${r.check_id})`;
  });
  return { count: results.length, lines };
}

// ------------------------------------------------------------
// Hook mode: quiet, never blocks, reports via systemMessage.
// ------------------------------------------------------------
function emitHook(systemMessage) {
  const out = systemMessage
    ? { systemMessage, suppressOutput: false }
    : { suppressOutput: true };
  process.stdout.write(JSON.stringify(out));
  process.exit(0);
}

function main() {
  const root = repoRoot();

  if (!dockerAvailable()) {
    if (isHook) return emitHook(null); // never block the agent
    console.error(
      "\x1b[31m[semgrep] Docker daemon is not running. Start Docker Desktop and retry.\x1b[0m"
    );
    process.exit(2);
  }

  let targets = null;
  if (isChanged) {
    targets = changedFiles(root);
    if (targets.length === 0) {
      if (isHook) return emitHook(null);
      console.log("\x1b[32m[semgrep] No changed code files to scan.\x1b[0m");
      process.exit(0);
    }
  }

  const configs = isChanged ? CHANGED_CONFIGS : FULL_CONFIGS;

  if (!isHook) {
    // Banner goes to stderr so --json keeps stdout clean for piping.
    console.error(
      `\n[semgrep] Scanning ${targets ? `${targets.length} changed file(s)` : "full tree"} with: ${configs.join(", ")}, ${LOCAL_RULES}\n`
    );
  }

  const res = runSemgrep(root, configs, targets);

  if (res.error) {
    if (isHook) return emitHook(null);
    console.error(`\x1b[31m[semgrep] Failed to run: ${res.error.message}\x1b[0m`);
    process.exit(2);
  }

  if (isHook) {
    const { count, lines } = summarizeFindings(res.stdout || "");
    if (count === 0) return emitHook(null);
    const top = lines.slice(0, 15).join("\n");
    const more = count > 15 ? `\n  …and ${count - 15} more.` : "";
    return emitHook(
      `Semgrep found ${count} SAST finding(s) in files changed this session:\n${top}${more}\n` +
        `Run \`npm run security:sast:changed\` for full details.`
    );
  }

  if (asJson) {
    process.stdout.write(res.stdout || "");
  } else {
    if (res.stdout) process.stdout.write(res.stdout);
    if (res.stderr) process.stderr.write(res.stderr);
  }

  // Semgrep exits 1 when findings exist; mirror that for CI.
  process.exit(res.status === 0 ? 0 : 1);
}

main();
