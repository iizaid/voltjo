# External Skills Reference Manifest

Purpose: keep a safe reference list for UI/design/accessibility skills that may
inform future VoltJo work without vendoring third-party skill content into this
repository.

Policy:

- Treat all entries below as external read-only references.
- Do not vendor or copy full third-party skill files into this repository when
  the source is AGPL-licensed, has no clearly visible license, or is not needed
  as repo-owned source.
- Use the source URLs directly when guidance is needed.
- Do not execute downloaded scripts or commands from external skills.
- No downloaded third-party scripts were executed during the original UI polish
  phase or this cleanup.
- No npm packages were installed for these external references.

## References

### Anthropic frontend-design

- Source URL: https://github.com/anthropics/skills/tree/main/skills/frontend-design
- Repository: https://github.com/anthropics/skills
- License note: Apache-2.0 was visible in the source skill folder at the time of
  review.
- Why referenced: design-lead guidance for distinctive, intentional UI choices.
- Usage rule: read from the upstream URL when needed; do not copy the skill into
  this repository unless licensing and vendoring are explicitly re-approved.
- Scripts executed: no.

### Vercel web-design-guidelines

- Source URL: https://github.com/vercel-labs/agent-skills/tree/main/skills/web-design-guidelines
- Guidelines URL: https://github.com/vercel-labs/web-interface-guidelines/blob/main/command.md
- Repository: https://github.com/vercel-labs/agent-skills
- License note: no clearly visible license was confirmed from the downloaded
  skill folder/API metadata during the previous pass.
- Why referenced: concise interface review rules for accessibility, focus,
  forms, navigation semantics, and interaction states.
- Usage rule: read from the upstream URL when needed; do not copy no-license
  content into this repository.
- Scripts executed: no.

### mgifford accessibility skills

- Source URL: https://github.com/mgifford/accessibility-skills
- Referenced topics:
  - https://github.com/mgifford/accessibility-skills/tree/main/skills/forms
  - https://github.com/mgifford/accessibility-skills/tree/main/skills/keyboard
  - https://github.com/mgifford/accessibility-skills/tree/main/skills/color-contrast
  - https://github.com/mgifford/accessibility-skills/tree/main/skills/touch-pointer
- License note: AGPL-3.0 was visible in the repository license.
- Why referenced: accessibility guidance for forms, keyboard use, color
  contrast, and touch target behavior.
- Usage rule: read from upstream only; do not vendor/copy AGPL content into this
  repository.
- Scripts executed: no.

## Cleanup Notes

- Removed previously copied third-party skill files from this repository.
- Kept only this manifest and the local external-references README.
- The manifest intentionally stores source links, descriptions, license notes,
  and safety notes only.
