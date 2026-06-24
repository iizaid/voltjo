# VoltJo Chat — Mobile UX Audit

> Verified against `components/chat/*` on 2026-06-24/25. The app is RTL Arabic;
> the sidebar lives on the **right** and slides from the right.

## Breakpoint matrix

Tailwind breakpoints in use: `sm` 640, `md` 768, `lg` 1024. The chat shell
switches to single-column drawer mode below `lg`.

| Target | Width | Sidebar | Composer | Model selector | Verdict |
|---|---|---|---|---|---|
| iPhone SE | 375 | ✅ slide drawer (288px), overlay scrim | ✅ full-width, 16px font (no zoom) | ✅ bottom sheet w/ safe-area | 🟡 touch-delete bug |
| iPhone Pro Max | 430 | ✅ drawer | ✅ | ✅ bottom sheet | 🟡 touch-delete bug |
| Small Android | 360 | ✅ drawer | ✅ | ✅ bottom sheet | 🟡 touch-delete bug |
| Tablet (portrait) | 768 | ✅ becomes static at `lg` only (1024); 768–1023 still drawer | ✅ | ⚠️ selector switches to popover at `md` (768) while sidebar still drawer — consistent | 🟢 acceptable |
| Desktop | ≥1024 | ✅ static, resizable, collapsible | ✅ | ✅ popover | 🟢 |

## What already works (do not regress)

- **Proper slide drawer**: `fixed inset-y-0 right-0 z-50 … translate-x-full
  lg:static lg:translate-x-0` with a tap-scrim
  (`ChatSidebar.tsx:147-153`, `ChatShell.tsx:290-297`). This satisfies the
  "sidebar must become a proper slide drawer" requirement already.
- **Safe areas**: header uses `env(safe-area-inset-top)`, footer and model
  sheet use `env(safe-area-inset-bottom)` (`ChatSidebar.tsx:168,295`,
  `ChatComposer.tsx:422`).
- **Full-height**: `h-dvh` on the shell (`ChatShell.tsx:289`) — dynamic viewport
  height, correct under mobile browser chrome.
- **iOS zoom-safe input**: composer textarea is `text-[16px]` on mobile
  (`ChatComposer.tsx:278`); inputs ≥16px prevent Safari focus-zoom.
- **No horizontal scroll**: `overflow-hidden` on shell; `min-w-0` guards on flex
  children; message bubbles capped at `min(680px,90%)` with `break-words`.
- **RTL correctness**: `dir="rtl"` at shell + `[unicode-bidi:plaintext]` on
  user/assistant text so mixed Arabic/Latin (model names, specs) renders
  correctly (`ChatMessage.tsx:88,119`).
- **Model selector** is a true bottom sheet on mobile with a pull bar and
  scrim (`ChatComposer.tsx:407-426`).

## Issues found

### 🟠 P1-M1 — Conversation delete unreachable on touch
`ChatSidebar.tsx:271-278` — the per-row delete button is
`hidden … group-hover:block`. Touch devices never fire `:hover`, so a mobile
user cannot delete an individual conversation (only "clear all" from the account
menu). **Fix:** make the action always visible on coarse pointers (e.g. a
trailing kebab/trash shown unconditionally below `lg`, or detect
`(pointer: coarse)`), or add swipe-to-reveal.

### 🟠 P1-M2 — Rename uses blocking `window.prompt`
`ChatShell.tsx:148` — native `prompt()` is jarring on mobile, unstyled, and
bypasses the design system. Also rename is bound to **double-click** only
(`ChatSidebar.tsx:255`) — there is no touch path to rename at all. **Fix:**
inline rename field (reuse the confirm-delete pattern already in the row) +
expose it from a row action menu.

### 🟡 P2-M3 — Keyboard "Enter = send" on mobile
`ChatComposer.tsx:272-277` — Enter (without Shift) submits. On phones the
return key is the only Enter, so users who want a newline can't insert one and
may send prematurely. **Fix:** on coarse pointers, let Enter insert a newline
and rely on the send button (which exists and is thumb-reachable).

### 🟡 P2-M4 — Auto-scroll jank
`ChatThread.tsx:51-55` — `scrollIntoView({behavior:"smooth"})` runs on every
`messages` change, including each fake-typewriter tick, causing continuous
smooth-scroll churn on long answers on low-end Androids. **Fix:** scroll once on
new message; use `behavior:"auto"` during streaming and only pin to bottom when
the user is already near the bottom.

### 🟡 P2-M5 — Scrim is a `<button>` covering the viewport
`ChatShell.tsx:291-296` — functional and accessible-labelled, but uses
`bg-black/10` (very faint). Consider `bg-black/30` for clearer modality on
bright screens. Cosmetic.

### 🔵 P3-M6 — No pull-to-refresh / swipe-back gestures
Native-app-like gestures (swipe from edge to open drawer, swipe row to delete)
are absent. Nice-to-have for the "native-app-like UX" goal.

## No issues found for

- Horizontal overflow (checked flex `min-w-0` + `break-words` + capped bubbles).
- Clipped/overlapping elements at 360/375/430/768.
- Safe-area handling (top + bottom covered).
- Full-height behaviour (`h-dvh`).
- RTL layout direction and bidi text.

## Fix priority for this launch

1. **P1-M1** touch-delete (functional gap) — fix now.
2. **P1-M2** rename UX (functional gap on touch) — fix now.
3. P2-M3/M4 — fast follow.
4. P3-M6 — post-launch polish.
