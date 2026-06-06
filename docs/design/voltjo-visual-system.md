# VoltJo Visual System

VoltJo uses the Firecrawl-style reference only as a design-quality input. It must not copy Firecrawl branding, logo, text, or page structure. The adapted direction is a calm Arabic-first EV/PHEV platform for Jordan.

## Direction

- Clean white canvas with warm off-white card surfaces.
- One functional orange accent, used for primary CTAs, active states, small dots, and key highlights.
- Hairline gridline borders define structure more than heavy shadows.
- Cards stay quiet: thin border, soft vellum background when needed, minimal shadow/ring.
- Buttons and tags use pill radii.
- Typography stays Arabic-first with stable RTL rhythm and no negative tracking on Arabic body text.

## Tokens

- `--voltjo-orange`: primary action and accent.
- `--voltjo-orange-glow`: soft halo for orange actions.
- `--voltjo-black` / `--voltjo-ink`: main text.
- `--voltjo-muted`: secondary text.
- `--voltjo-border`: gridline and card borders.
- `--voltjo-surface`: white cards.
- `--voltjo-surface-soft`: warm off-white cards and chips.
- `--voltjo-radius-card`: normal cards.
- `--voltjo-radius-pill`: buttons, chips, tags.
- `--voltjo-shadow-soft`: occasional elevated marketing card.

## Components

- Primary buttons are orange pills with white text and a soft orange ring.
- Secondary buttons are white pills with a hairline border.
- Cards use thin borders, low-contrast surfaces, and subtle shadow rings.
- Icons remain stroke-based; supporting icons are muted, key states can use orange.
- Section labels should be compact, pill-like, and use orange only as a small marker.

## Motion

- Use existing animation libraries only.
- Keep hover motion subtle: small translate or color change.
- Avoid noisy loops unless they communicate state.
- Respect `prefers-reduced-motion` through the global CSS rule.

## RTL Rules

- Arabic pages remain `dir="rtl"` where already set.
- Spacing must use logical or RTL-aware class choices when possible.
- Do not force Latin layout direction except where an existing diagram/grid intentionally requires it.

## Do Not Do

- Do not add blue, purple, or green decorative accents.
- Do not use orange as a large background block.
- Do not copy Firecrawl logo, wordmark, product copy, or page structure.
- Do not imply real AI, active payments, verified vehicle data, or complete charging station coverage.
- Do not change routing, data fetching, auth, API, or deployment behavior as part of visual refinement.
