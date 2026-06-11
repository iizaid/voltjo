# External Skills Manifest

Downloaded for: VoltJo account/settings UI/UX improvement phase.

Safety policy: all external skills are used as read-only instruction. No
downloaded scripts were executed. No npm packages were installed for this
external-skills step.

## Downloaded Skills

### anthropic-frontend-design

- Source: https://github.com/anthropics/skills/tree/main/skills/frontend-design
- Repository: anthropics/skills
- Downloaded files: `SKILL.md`, `LICENSE.txt`
- License visible: Apache-2.0 in `LICENSE.txt`
- Trust/reputation notes: official Anthropic skills repository; active and widely
  referenced in public agent-skill searches.
- Why selected: provides design-lead guidance for reshaping existing UI with a
  deliberate visual point of view instead of generic templates.
- Used for: restraint, hierarchy, typography, motion restraint, and adapting the
  page to VoltJo's Arabic-first EV identity.
- Scripts found: no downloaded scripts.
- Scripts executed: no.
- Safe as read-only instruction: yes.

### vercel-web-design-guidelines

- Source skill: https://github.com/vercel-labs/agent-skills/tree/main/skills/web-design-guidelines
- Guidelines source: https://github.com/vercel-labs/web-interface-guidelines/blob/main/command.md
- Repository: vercel-labs/agent-skills and vercel-labs/web-interface-guidelines
- Downloaded files: `SKILL.md`, `web-interface-guidelines-command.md`
- License visible: no license file visible from the downloaded skill folder/API
  metadata during this pass.
- Trust/reputation notes: Vercel Labs repository, active and highly visible in
  public agent-skill searches.
- Why selected: concise review rules for accessibility, focus states, forms,
  performance, navigation semantics, and interaction states.
- Used for: account page UI review, forms polish, button/link semantics, focus
  states, and reduced visual friction.
- Scripts found: no downloaded scripts.
- Scripts executed: no.
- Safe as read-only instruction: yes.

### mgifford-accessibility-forms

- Source: https://github.com/mgifford/accessibility-skills/tree/main/skills/forms
- Repository: mgifford/accessibility-skills
- Downloaded files: `SKILL.md`
- License visible: AGPL-3.0 in repository `LICENSE`
- Trust/reputation notes: public accessibility-focused skill collection derived
  from documented best-practice guides; small but current.
- Why selected: account/settings includes editable profile fields, selects, and
  async form feedback.
- Used for: labels, input types, autocomplete, inline feedback, and preserving
  accessible form behavior.
- Scripts found: no downloaded scripts.
- Scripts executed: no.
- Safe as read-only instruction: yes.

### mgifford-accessibility-keyboard

- Source: https://github.com/mgifford/accessibility-skills/tree/main/skills/keyboard
- Repository: mgifford/accessibility-skills
- Downloaded files: `SKILL.md`
- License visible: AGPL-3.0 in repository `LICENSE`
- Trust/reputation notes: public accessibility-focused skill collection derived
  from documented best-practice guides; small but current.
- Why selected: account/settings contains navigation, buttons, modal behavior,
  and form controls that must remain keyboard usable.
- Used for: visible focus, native controls, logical tab order, no keyboard traps,
  and modal keyboard expectations.
- Scripts found: no downloaded scripts.
- Scripts executed: no.
- Safe as read-only instruction: yes.

### mgifford-accessibility-color-contrast

- Source: https://github.com/mgifford/accessibility-skills/tree/main/skills/color-contrast
- Repository: mgifford/accessibility-skills
- Downloaded files: `SKILL.md`
- License visible: AGPL-3.0 in repository `LICENSE`
- Trust/reputation notes: public accessibility-focused skill collection derived
  from documented best-practice guides; small but current.
- Why selected: the page redesign changes visual surface, muted text, button,
  status, and focus colors.
- Used for: keeping normal text, non-text UI boundaries, and focus indicators
  readable on the light VoltJo palette.
- Scripts found: no downloaded scripts.
- Scripts executed: no.
- Safe as read-only instruction: yes.

### mgifford-accessibility-touch-pointer

- Source: https://github.com/mgifford/accessibility-skills/tree/main/skills/touch-pointer
- Repository: mgifford/accessibility-skills
- Downloaded files: `SKILL.md`, `README.md`
- License visible: AGPL-3.0 in repository `LICENSE`
- Trust/reputation notes: public accessibility-focused skill collection derived
  from documented best-practice guides; small but current.
- Why selected: the account page and avatar modal have many tap/click targets
  and must stay usable on mobile.
- Used for: touch target sizing, pointer cancellation, label-in-name, and
  mobile-friendly button spacing.
- Scripts found: no downloaded scripts.
- Scripts executed: no.
- Safe as read-only instruction: yes.

## Safety Review Summary

- Downloaded content types: Markdown and license text only.
- Unknown scripts executed: no.
- Package installation from external skills: no.
- Suspicious shell commands in downloaded skills: none in the selected skill
  files. The mgifford repository README contains example installation commands;
  they were not executed.
- Secret/token requests: none in selected skill files.

