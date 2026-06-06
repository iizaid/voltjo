# AI Vehicle Context Plan

> This document is historical. It records the audit state at the time it was written. Check `plans/00-current-project-handoff.md` and the current repository before assuming any item is still open.

## Goal

Prepare VoltJo chat for future vehicle-aware responses without adding a real AI provider yet.

## Current foundation

- `lib/ai/vehicle-context.ts` can now:
  - match vehicle names and slugs from user text
  - fetch a supported vehicle by slug
  - produce compact Arabic context strings
- No provider calls were added
- `getAiProvider` was not changed

## Planned integration path

Later, `/api/chat` can:

1. validate the incoming message
2. call `buildVehicleContextForPrompt(message)`
3. prepend the returned vehicle context to the provider prompt
4. send the final prompt to the real model provider

## Privacy considerations

- Vehicle context should come from public supported-vehicle data only
- No account-only profile fields should be injected unless the user is authenticated and privacy settings permit it
- Chat prompt assembly should keep user profile and supported vehicle data separate

## Limitations in the current phase

- Matching is keyword-based only
- No fuzzy model resolution yet
- No provider-side token budgeting yet
- No streaming integration yet
- No use of private user data in prompt context yet
