---
name: semgrep-scan
description: Run Semgrep static analysis (SAST) security scanning on the VoltJo codebase. Use when asked to scan for vulnerabilities, run a security/SAST scan, check changed files for security issues, or audit code before committing. Complements the runtime DAST scanner in scripts/security-scan.mjs.
---

# Semgrep SAST Scan

Static application security testing for this Next.js + Supabase + Upstash project.
Semgrep runs via the official Docker image (`semgrep/semgrep`) because Semgrep has
no native Windows binary. Docker Desktop must be running.

## Commands

- Full repository scan (human-readable):
  ```
  npm run security:sast
  ```
- Scan only files changed this session (fast, pre-commit check):
  ```
  npm run security:sast:changed
  ```
- Raw JSON (for tooling):
  ```
  node scripts/semgrep-scan.mjs --json
  ```

## Rulesets

Registry packs: `p/default`, `p/javascript`, `p/typescript`, `p/react`,
`p/nextjs`, `p/secrets`, `p/owasp-top-ten` (community, no login required).
Project rules: [.semgrep/voltjo-rules.yml](../../../.semgrep/voltjo-rules.yml)
— service-role key exposure, `NEXT_PUBLIC_` secrets, `dangerouslySetInnerHTML`,
`eval`/`Function`. Ignore paths: [.semgrepignore](../../../.semgrepignore).

Override packs with `SEMGREP_CONFIGS="p/foo,p/bar"` (full) or
`SEMGREP_CONFIGS_CHANGED=...` (changed mode).

## How to run a scan

1. Confirm Docker is running (`docker info`). If not, start Docker Desktop.
2. Run the appropriate command above. Exit code 1 means findings were reported;
   0 means clean.
3. Triage findings by severity (ERROR > WARNING > INFO). For each, either fix the
   code or, if it is a confirmed false positive, add a `# nosemgrep: <rule-id>`
   comment on the offending line.

## Automation

A `Stop` hook ([.claude/settings.json](../../settings.json)) runs a quiet
changed-files scan when the agent finishes and surfaces any findings. It never
blocks. To disable, remove the `Stop` entry from settings.json (requires a
Claude Code restart to take effect).

## Relationship to other scanners

- This (SAST) reads source code for dangerous patterns.
- [scripts/security-scan.mjs](../../../scripts/security-scan.mjs) (DAST) attacks
  the running server (SQLi/XSS/IDOR/rate-limit). Run both for full coverage.
