# Repository Cleanup and Deployment Artifact Audit

## Goal

Safely identify generated files, stale files, duplicate plans, and deployment artifacts before staging verification.

## Scope

- Top-level repository folders/files.
- `.gitignore` coverage for generated artifacts.
- Tracked generated files.
- Planning file organization under `plans/`.
- Deployment artifact consistency for Next.js and Cloudflare/OpenNext.

## Out Of Scope

- Deleting source code, docs, migrations, vehicle data, or project assets.
- Touching `public/cars/**` beyond read-only audit.
- Modifying `.agents/**`, `skills-lock.json`, AI behavior, payment, or vehicle data.

## Top-Level Folder Audit

| Path | Purpose | Cleanup posture |
| --- | --- | --- |
| `.agents/` | Local agent skills/config | Do not touch without explicit approval |
| `.antigravitycli/` | Local CLI metadata; currently tracked empty JSON exists | Needs human review |
| `.github/` | CI workflow | Keep |
| `.next/` | Next.js build output | Generated, ignored, safe to remove locally |
| `.open-next/` | OpenNext Cloudflare build output | Generated, ignored, safe to remove locally |
| `app/` | Next.js App Router pages and API routes | Keep |
| `claude theme/` | Design/reference notes; currently tracked | Needs human review |
| `components/` | React components | Keep |
| `data/` | Product/navigation data | Keep |
| `docs/` | Stable operational docs | Keep |
| `lib/` | Shared app/server libraries | Keep |
| `node_modules/` | Installed dependencies | Generated, ignored, safe to remove locally |
| `plans/` | Planning, audit, handoff, future phase docs | Keep |
| `public/` | Static assets and vehicle research | Keep; do not touch `public/cars/**` |
| `supabase/` | Schema and migrations | Keep; read-only unless a future migration phase is approved |
| `tests/` | Local test/load scripts; currently untracked k6 script exists | Needs human review before committing |

## Files Likely Involved

- `.gitignore`
- `README.md`
- `docs/staging-smoke-tests.md`
- `docs/monitoring.md`
- `plans/**`
- `wrangler.jsonc`
- `open-next.config.ts`
- `.github/workflows/ci.yml`

## Safety Rules

- Prefer report-only for uncertain cleanup candidates.
- Remove only ignored, generated local artifacts if explicitly requested.
- Do not remove tracked files automatically.
- Use `git ls-files` before proposing removal.

## Current Cleanup Candidates

| Candidate | Classification | Reason | Proposed command |
| --- | --- | --- | --- |
| `.next/` | Safe to remove locally | Generated Next build output; ignored | `Remove-Item -Recurse -Force .next` |
| `.open-next/` | Safe to remove locally | Generated OpenNext build output; ignored | `Remove-Item -Recurse -Force .open-next` |
| `node_modules/` | Safe to remove locally | Installed dependencies; ignored | `Remove-Item -Recurse -Force node_modules` |
| `tsconfig.tsbuildinfo` | Needs human review | Generated TypeScript cache but currently tracked | `git rm --cached tsconfig.tsbuildinfo` after approval |
| `temp_pricing.json` | Needs human review | Empty tracked file; unclear if intentionally kept | Review then `git rm temp_pricing.json` if obsolete |
| `pricing_original.tsx` | Needs human review | Tracked historical pricing artifact outside app routes | Review before moving/removing |
| `claude theme/` | Needs human review | Tracked design/reference folder outside docs/plans | Review before moving/removing |
| `.antigravitycli/` | Needs human review | Tracked local CLI metadata folder | Review before removing |
| `public/cars/**` | Do not touch | Research/source material and explicitly protected | None |
| `.agents/**`, `skills-lock.json` | Do not touch | Agent tooling explicitly protected | None |

## Acceptance Criteria

- `plans/00-current-project-handoff.md` exists and is current.
- Important planning docs are under `plans/`.
- Generated artifact ignores are present.
- Tracked generated files are reported, not removed without approval.
- Required checks pass.

## Commands To Run

```bash
git status --short
git ls-files .next .open-next node_modules .wrangler .vercel coverage test-results playwright-report dist out
npm test
npm run lint
npm run build
npm run cf:build
```

## Final Report Requirements

- Files moved/renamed.
- Generated artifacts found.
- Tracked generated files found.
- Cleanup candidates by classification.
- Commands run and results.
