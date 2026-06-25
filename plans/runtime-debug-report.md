# VoltJo — Runtime Debug Report

> **Scope:** Code-only trace of the runtime path for message
> `"كم ساعة يحتاج شحن بطارية سيلايون 05؟"` on localhost,
> assuming migrations 012 / 013 / 014 are applied and 274 chunks are ingested.
> **Date:** 2026-06-25
> **No code was modified.**

---

## 0. TL;DR

The RAG pipeline lives or dies by a single environment variable: **`SUPABASE_SERVICE_ROLE_KEY`**.
Both the alias cache and the RPC retrieval call `createAdminClient()`, which returns `null`
when this key is absent. When it returns `null` both functions immediately return `[]` and the
entire retrieval path silently degrades. Vehicle detection then falls back to a catalog-slug
token match where `"sealion"` (Latin) ≠ `"سيلايون"` (Arabic), so the vehicle is likely not
matched, `contextText` is `null`, and the model receives the "no verified data" disclaimer
instead of facts. That is the most probable cause of the bad answer.

The `.env.example` comment still says `SUPABASE_SERVICE_ROLE_KEY` is "required only for
self-service account deletion" — it has never been updated to mention RAG. Any developer
who set up from that file without needing the deletion flow would not have this key in
`.env.local`, breaking all RAG silently.

---

## 1. Normalization of the input message

```
Input:    "كم ساعة يحتاج شحن بطارية سيلايون 05؟"
Step 1  NFKC          → no change (all in BMP, no compatibility forms)
Step 2  strip diacritics (U+064B–U+065F, U+0640, U+0670) → no change (none present)
Step 3  alef variants → no change (no أ/إ/آ/ٱ)
Step 3  ta-marbuta ة → ه : "ساعة" → "ساعه", "بطارية" → "بطاريه"
Step 3  alef-maqsura → no change; waw-hamza/ya-hamza/bare-hamza → no change
Step 4  Arabic-Indic digits → no change (05 is already ASCII)
Step 5  lowercase → no change (all Arabic)
        replace non-letter/digit/space → "؟" → " "
        collapse whitespace + trim

Output:   "كم ساعه يحتاج شحن بطاريه سيلايون 05"
```

---

## 2. Is the alias cache loading successfully?

**It depends entirely on `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`.**

`getCachedVehicleAliases()` in `lib/ai/vehicle-alias-cache.ts`:

```ts
async function loadAliases(): Promise<VehicleAlias[]> {
  const admin = createAdminClient();   // ← the gate
  if (!admin) return [];               // ← silent empty if key absent
  ...
}
```

`createAdminClient()` in `lib/supabase/admin.ts`:

```ts
export function createAdminClient(): SupabaseClient<Database> | null {
  const { url } = getSupabaseEnv();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) return null;   // ← returns null when key missing
  ...
}
```

| `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` | `createAdminClient()` | `getCachedVehicleAliases()` |
|---|---|---|
| Set and non-empty | `SupabaseClient` | Queries `vehicle_aliases`, returns 31 rows |
| Missing or empty | `null` | Returns `[]` immediately, **no DB query** |

**Key context:** `.env.example` line 15 states:
> *"Required only for self-service account deletion."*

This comment was written before Phase 1. Any developer who set up `.env.local` from this
file without needing the deletion flow would have left this key blank, making the alias
cache always return `[]`.

---

## 3. Is "سيلايون" matching any alias? What vehicle slug is detected?

### Path A — Alias cache returned 31 rows (key present)

`detectVehicleIds()` iterates every alias and calls `normalizedContains`:

```
Aliases that would match for "كم ساعه يحتاج شحن بطاريه سيلايون 05":

alias_norm = "سيلايون 05"
  paddedHaystack = " كم ساعه يحتاج شحن بطاريه سيلايون 05 "
  needle         = " سيلايون 05 "
  match?  YES  ✓   (trailing space supplied by the padding)

alias_norm = "سيلايون"
  paddedHaystack = " كم ساعه يحتاج شحن بطاريه سيلايون 05 "
  needle         = " سيلايون "
  match?  YES  ✓   (the space between "سيلايون" and "05" serves as the right boundary)
```

Both map to the same `vehicle_id` → BYD Sealion 05 DM-i 2025 (`slug: byd-sealion-05-dmi-2025`).
No other vehicle aliases touch `سيلايون`, `شحن`, or `بطاريه` in isolation.

**Result:** `matchedIds = [<byd-sealion-05-dmi-2025.id>]`

### Path B — Alias cache returned `[]` (key absent)

Falls through to the catalog token fallback:

```ts
const haystack = normalizeArabic(
  [vehicle.slug.replace(/-/g, " "), vehicle.nameAr, vehicle.nameEn].join(" "),
);
const significant = haystack.split(" ").filter((t) => t.length >= 4 && !/^\d+$/.test(t));
if (significant.some((token) => normalizedContains(normalizedMessage, token))) ...
```

For the Sealion 05:
- Slug tokens after normalizing `"byd sealion 05 dmi 2025"`: `byd`(3, skip), `sealion`(7 ✓), `dmi`(3, skip), `2025`(numeric, skip)
- Only English token ≥4 chars from slug: **`"sealion"`**
- `normalizedContains("كم ساعه يحتاج شحن بطاريه سيلايون 05", "sealion")` →
  `" كم ساعه يحتاج شحن بطاريه سيلايون 05 ".includes(" sealion ")` → **`false`**

Latin `"sealion"` does not appear in an Arabic message. The catalog token match from the
slug **fails**.

The `nameAr` column for the BYD Sealion 05 is the deciding factor for whether the fallback
succeeds:

| `nameAr` contains Arabic text with `سيلايون` | Catalog fallback result |
|---|---|
| Yes (e.g. `"سيلايون 05 BYD"`) | Token `"سيلايون"` (7 chars) → `normalizedContains` → **match** |
| No (English-only like `"BYD Sealion 05"`) | No Arabic tokens → **no match** |

This value cannot be determined from code alone. Based on the plan's pre-Phase-1 audit
(§1.2 L2: *"أتو 3, seal u, typos, Arabic morphology all miss"*) it is likely that the old
system — which also used `nameAr` — already failed for `سيلايون`, suggesting `nameAr`
either does not contain the Arabic transliteration or it did not normalize to `سيلايون`.

**Verdict on Path B:** vehicle detection almost certainly fails; `matchedIds = []`.

---

## 4. Does `retrieveKnowledgeChunks()` execute?

Only when `matchedVehicles.length >= 1` (checked in `buildVehicleContextForPrompt`):

```ts
} else if (matchedVehicles.length === 1) {
  chunks = await retrieveKnowledgeChunks({ ... });
}
```

And inside `retrieveKnowledgeChunks`:

```ts
const admin = createAdminClient();
if (!admin) return [];    // ← same gate as the alias cache
```

| Scenario | `retrieveKnowledgeChunks` called? | RPC fires? |
|---|---|---|
| Key present + vehicle matched | Yes | Yes |
| Key present + no vehicle matched | No (matchedVehicles.length === 0) | No |
| Key absent | Even if matched (Path B fallback), `admin = null` → returns `[]` immediately | No |

---

## 5. How many chunks should be returned?

Assuming Path A (key present, vehicle matched):

```ts
chunks = await retrieveKnowledgeChunks({
  vehicleIds: [sealion05Id],
  query: "كم ساعة يحتاج شحن بطارية سيلايون 05؟",   // raw message, not normalized
  category: "battery_charging",   // detectIntent result (see §7 below)
  limit: 4,
});
```

Inside `retrieveKnowledgeChunks`, the query is normalized before the RPC:
```ts
const q = normalizeArabic(query);
// q = "كم ساعه يحتاج شحن بطاريه سيلايون 05"
```

The RPC executes:
```sql
SELECT ... FROM vehicle_knowledge k
WHERE k.vehicle_id = any(p_vehicle_ids)
  AND k.category = 'battery_charging'            -- first attempt
  AND k.tsv @@ websearch_to_tsquery('simple', 'كم ساعه يحتاج شحن بطاريه سيلايون 05')
ORDER BY ts_rank(k.tsv, ...) DESC
LIMIT 4;
```

**TSV / FTS language mismatch risk:** The 274-chunk corpus was ingested from vehicle
documentation. If those documents are predominantly in English (exported PDF specs), the
`tsv` column contains English tokens. The Arabic query `"كم ساعه يحتاج شحن بطاريه سيلايون 05"`
would be tokenized by `websearch_to_tsquery('simple', ...)` into Arabic tokens, which
**would not match English-tokenized TSV**. The `'simple'` FTS config performs no stemming
and no Arabic↔English translation.

| Chunk content language | Arabic query matches TSV? | First-attempt result |
|---|---|---|
| Arabic | Likely YES (shared tokens: شحن, بطاريه) | ≥1 chunk |
| English | **NO** (Arabic tokens ≠ English tokens) | 0 chunks |

If the first attempt returns 0 chunks, the **soft-narrow** fires:

```ts
const primary = await run(category);           // battery_charging attempt
if (primary.length > 0 || category === null) return primary;
return await run(null);                        // broader retry without category filter
```

Even the broader retry with `category = null` uses the same Arabic FTS query and would
return 0 on English-only chunk content.

**Worst case:** 0 chunks returned regardless of soft-narrow if chunk content is English.
**Best case (Arabic chunks):** up to 4 `battery_charging` chunks for the Sealion 05.

---

## 6. Is `contextText` returned or null?

```ts
const structuredText = matchedVehicles.length
  ? matchedVehicles.map(buildVehicleSummaryText).join("\n\n")
  : null;

const { contextText, citations } = assembleGroundedContext(structuredText, chunks);
```

`assembleGroundedContext` returns `contextText: null` **only** when both `structuredText`
AND `chunks` are empty/null:

```ts
if (sections.length === 0) return { contextText: null, citations: [] };
```

| matchedVehicles | structuredText | chunks | contextText |
|---|---|---|---|
| `[]` (no match) | `null` | `[]` | **`null`** |
| `[sealion05]` + charging cols present in DB | non-null | `[]` (FTS miss) | **non-null** (structured only) |
| `[sealion05]` + all charging cols null in DB | non-null (partial) | `[]` | **non-null** (no charging facts) |
| `[sealion05]` + charging cols present + chunks | non-null | `[…]` | **non-null** (full grounded) |

The model receives a "no verified data" disclaimer **only** when `contextText = null`, i.e.
when the vehicle is **not detected at all**.

---

## 7. Intent detection (for completeness)

`detectIntent("كم ساعة يحتاج شحن بطارية سيلايون 05؟")` normalizes internally and scores:

```
Normalized: "كم ساعه يحتاج شحن بطاريه سيلايون 05"

battery_charging keywords hit:
  شحن          → substring match (Arabic ≥4 chars rule)  ✓
  بطاريه       → substring match                         ✓
  ساعه         → substring match                         ✓
  كم ساعه      → padded phrase match                     ✓
  (score ≥ 4)

All other categories: 0 matching keywords.
```

**Result:** `intent = "battery_charging"` — correct and unambiguous.

---

## 8. Under what exact condition does the model still say "specs are unconfirmed"?

There are three independent failure conditions, ordered by likelihood:

### Condition 1 — `SUPABASE_SERVICE_ROLE_KEY` missing (most likely)

`createAdminClient()` returns `null`. Both alias cache and RPC retrieval degrade silently
to `[]`. Catalog token fallback fails for Arabic `سيلايون` vs Latin `sealion`. No vehicle
detected. `contextText = null`. Prompt receives:

```
لا تتوفّر بيانات موثّقة لهذا السؤال في السياق. أجب بإرشاد عام واذكر بوضوح
أن التفاصيل الدقيقة غير مؤكدة للسوق الأردني، ولا تخترع أرقامًا أو مواصفات.
```

The model complies and says specs are pending confirmation. The `[البيانات الموثّقة]` tag
in the observed response is the model hallucinating a citation-style term from the prompt
rules text — the hardening instructions mention `«بيانات موثّقة»` and the model fabricated
a tag from it (exactly the §11 risk the plan warned about).

### Condition 2 — Vehicle detected but all charging columns are null

`matchedVehicles = [sealion05]` but `acChargeKw`, `dcChargeKw`, `charge1080Min` are all
`null` in the `supported_vehicles` row. `buildVehicleSummaryText` produces:

```
السيارة: ... | البطارية: X kWh | ... (no charging line)
```

Even with 0 FTS chunks, the model receives structured facts — but without charging times.
The grounding rules instruct: *"لا تخترع أبدًا أرقامًا ... ولا مدد صيانة"*. The model
would correctly say charging duration is not in its verified data.

### Condition 3 — FTS returns no chunks + structured data lacks charging facts

The vehicle is detected (structured text is built), but `battery_charging` chunks don't
exist in the ingested corpus for the Sealion 05, or the chunk content is in English and
the Arabic FTS query produces no hits. The soft-narrow retry also returns 0. Only
structured column data reaches the model. Same outcome as Condition 2 if charging columns
are missing.

---

## 9. Summary table

| Question | Answer |
|---|---|
| Is the alias cache loading aliases from Supabase? | **Only if `SUPABASE_SERVICE_ROLE_KEY` is set.** Silent `[]` otherwise. |
| Is "سيلايون" matching an alias? | **Yes** (Path A, key present): `"سيلايون 05"` and `"سيلايون"` both match via `normalizedContains`. |
| What vehicle slug is detected? | `byd-sealion-05-dmi-2025` (Path A). Unknown / likely none (Path B, key absent). |
| Does `retrieveKnowledgeChunks()` execute? | **Only when key is present and vehicle is matched.** Guarded by `if (!admin) return []`. |
| How many chunks returned? | Up to 4 (single-vehicle, `battery_charging`, soft-narrow). Possibly 0 if chunk content is in English (FTS language mismatch). |
| Is `contextText` returned or null? | Non-null if vehicle matched (structured data always present); null only if no vehicle detected. |
| Exact condition for "unconfirmed" answer | `SUPABASE_SERVICE_ROLE_KEY` absent in `.env.local` → alias miss → catalog token fallback fails for Arabic name → vehicle not detected → `contextText = null` → disclaimer branch → model complies. |

---

## 10. Root cause and fix

**Root cause:** `SUPABASE_SERVICE_ROLE_KEY` is undocumented as a RAG dependency.

`.env.example` currently says:
> *"Required only for self-service account deletion."*

Phase 1 added two new admin-client consumers:
- `lib/ai/vehicle-alias-cache.ts` — requires it to load aliases
- `lib/ai/retrieval.ts` — requires it to call the search RPC

**Required fix (`.env.example` comment update):**

```
# Service role key — required for:
#   1. Self-service account deletion
#   2. RAG retrieval (vehicle alias cache + search_vehicle_knowledge RPC)
# Without this key, RAG silently degrades to structured-column-only context
# and Arabic vehicle names like "سيلايون" will not be detected.
SUPABASE_SERVICE_ROLE_KEY=
```

**Secondary risk to verify:** Confirm the chunk content language in `vehicle_knowledge`.
If chunks are English-only, `websearch_to_tsquery('simple', <Arabic query>)` will return
0 rows for all questions. This would make RAG provide structured data only (no cited
document evidence) even with the key set.

**Verification steps (in order):**
1. Confirm `SUPABASE_SERVICE_ROLE_KEY` is set in `.env.local`.
2. Restart the dev server (env vars only load at startup in Next.js).
3. Ask the same question. If `contextText` is now non-null, the alias path is working.
4. Inspect server logs for `retrievalConfidence` — if still `"LOW"`, FTS returned 0 chunks (language mismatch risk).
5. In Supabase SQL editor: `SELECT content FROM vehicle_knowledge WHERE vehicle_id = '<sealion05_id>' LIMIT 3;` — confirm Arabic vs English content.
