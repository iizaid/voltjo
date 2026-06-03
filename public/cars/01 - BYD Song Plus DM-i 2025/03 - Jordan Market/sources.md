# Sources — BYD Song Plus DM-i 2025

Access date for all entries: **2026-06-03** (updated in research pass 2).
Confidence labels: official / dealer / database / owner_reported / forum / unknown / needs_review.

> Identity note: "Song Plus DM-i" (China / GCC / Jordan) is the same platform sold as
> "Seal U DM-i" (Europe) and "Sealion 6 DM-i" (Australia). Export-named sources are useful
> but may differ from the Jordan unit — especially the **charging port** (GB/T vs CCS2).

---

## S1 — Jordan new-car listing: "BYD Song Plus DM-i 112KM Premium 2025"
- **URL:** https://jo.motory.com/en/new-cars/byd/song-plus/2025/byd-song-plus-dm-i-112km-premium-2025-262817/ · also https://jordan.hatla2ee.com/en/new-car/byd/Song-Plus
- **Source type:** dealer / marketplace listing · **Region:** Jordan
- **Model in source:** BYD Song Plus DM-i 112KM Premium 2025 (matches identity)
- **Downloaded:** none (direct fetch 403; data via search index)
- **Confidence:** dealer
- **Notes:** Jordan price 28,900 JOD (VAT incl.), 18.3 kWh, 112 km EV, 60 L tank, 218 HP system, 12.8" rotating screen, DiPilot, ~3.9 L/100km. Dealer "Bustami & Saheb".

## S2 — China-market specification databases
- **URLs:** https://data.carnewschina.com/byd/byd-song-plus-dm-i/2025 · https://cnevpost.com/2024/07/25/byd-launches-song-l-plus-dm-i/ · https://en.wikipedia.org/wiki/BYD_Song_Plus
- **Source type:** database / news · **Region:** China
- **Model in source:** BYD Song Plus DM-i (China, DM 5.0)
- **Downloaded:** none · **Confidence:** database (NEDC)
- **Notes:** Three China battery variants — 12.9 kWh (75 km), 18.3 kWh (112 km), 26.6 kWh (160 km); 60 L; 1.5 L ~101 HP engine-alone; ~3.9 L/100km depleted; ~1500 km combined. China port GB/T.

## S3 — BYD official GCC page (Kuwait): Song Plus DM-i
- **URL:** https://www.byd.com/kw/car/song-plus-dmi-en · **Source type:** official (regional) · **Region:** GCC
- **Model in source:** Song Plus DM-i (GCC) · **Downloaded:** none · **Confidence:** official (GCC), low detail
- **Notes:** Sparse: 890 km combined (NEDC, FWD), 6.9 L/100km, "Ocean X Face". No battery kWh/port/speeds. 890 km conflicts with ~1500 km (China) → needs_review.

## S4 — BYD Sealion 6 Vehicle Specifications (Australia, official PDF) — ALIAS — ⬇ DOWNLOADED
- **URL:** https://www.byd.com/content/dam/byd-site/au/product/sealion6/BYD%20SEALION%206%20Vehicle%20Specifications.pdf
- **Source type:** official PDF · **Region:** Australia (export)
- **Model in source:** Sealion 6 DM-i (export alias)
- **Downloaded file:** `02 - Specs/BYD-Sealion-6-DMi-Specs-AU-source-alias.pdf` (7.4 MB, 2 pages)
- **Confidence:** official (export) → for Jordan: needs_review
- **Notes:** Confirms **AC port Type 2 (7 kW)**, **DC port CCS2 (18 kW)**, V2L adaptor, BYD Blade (LFP), engine "Xiaoyun 1.5L" (Dynamic) / "1.5L turbo" (Premium), standard **ADR 81/02**. Trims: Dynamic, Premium. Numeric dimensions in the 2-column table were scrambled on text extraction → those dims = needs_review.

## S5 — BYD Seal U DM-i Owner's Manual (Europe, official PDF) — ALIAS — ⬇ DOWNLOADED
- **URL:** https://www.byd.com/content/dam/byd-site/eu/support/service/manual/20241025/BYD%20SEAL%20U%20DM-i%20Owner's%20Manual-Left-hand%20Drive-EN-General%20version%20for%20Europe-241022.pdf
- **Source type:** official owner's manual PDF · **Region:** Europe (export, LHD)
- **Model in source:** Seal U DM-i (export alias)
- **Downloaded file:** `01 - Manuals/BYD-Seal-U-DMi-Owner-Manual-EU-source-alias.pdf` (62 MB, 263 pages)
- **Confidence:** official (EU export) → for Jordan: needs_review
- **Notes:** Primary source for extracted safety, charging, towing, maintenance schedule, tire-pressure, and fluids facts (with page numbers) in the `04 - AI Data` files. See `01 - Manuals/manual-analysis.md`.

## S6 — MarkLines teardown index (platform identity)
- **URL:** https://www.marklines.com/en/teardown/byd-song_plus_seal_u_sealion_6_dm_i · **Source type:** database · **Region:** global
- **Model in source:** "Song Plus / Seal U / Sealion 6 DM-i" (one platform) · **Confidence:** database
- **Notes:** Basis for the alias/equivalence mapping.

## S7 — OpenSooq Jordan listings
- **URL:** https://jo.opensooq.com/en/cars/cars-for-sale/byd/song-plus · **Source type:** marketplace · **Region:** Jordan
- **Confidence:** owner_reported · **Notes:** Confirms active Jordan presence (used from ~20,000 JOD). Availability evidence only.

## S8 — BYD Seal 6 DM-i Touring (UK, official PDF) — ALIAS (different body)
- **URL:** https://www.byd.com/material/byd-site/byd-uk/specifications/SEAL%206%20DM-i%20TOURING-1225-BPS-UK-V2-web.pdf
- **Source type:** official PDF · **Region:** UK · **Confidence:** needs_review
- **Notes:** "Touring" = estate/wagon body, NOT the Song Plus SUV body. Do not reuse body/dimension data.

## S9 — shouce365.com China manual aggregator — ⛔ REJECTED
- **URL:** https://www.shouce365.com/byd/song_plus_dm_i_2025_owner_manual.html
- **Source type:** third-party manual mirror · **Region:** China
- **Model in source:** 宋PLUS DM-I 2025 使用说明书 (claims 47.3 MB, 312 pages — the exact China manual)
- **Downloaded:** none · **Confidence:** unknown → **rejected**
- **Notes:** **Expired TLS certificate** on fetch → not a trustworthy download source. The exact China manual likely exists, but obtain it from BYD's official China portal (S10), not this mirror.

## S10 — BYD China official manual portal
- **URL:** https://www.byd.com/cn/user-manual · **Source type:** official · **Region:** China
- **Model in source:** 宋PLUS DM-i (Chinese) · **Downloaded:** none · **Confidence:** official (China)
- **Notes:** Legitimate route to the exact China manual, but Chinese-language and likely JS/portal-gated; not retrieved this pass. Best target for closing the "exact manual" gap.

## S11 — Made-in-China resellers (chejiajia / luan-auto / sinoblvd) — ⚠ DOWN-WEIGHTED
- **URLs:** various made-in-china.com product pages for "2025 BYD Song Plus DM-i 75/112/160km"
- **Source type:** exporter/reseller listings · **Region:** China export · **Confidence:** needs_review (down-weighted)
- **Notes:** Useful only to confirm trim/range names. Contains errors (e.g. "battery capacity does not change" across ranges — contradicted by S2; "1.5T turbo" applied broadly — only some trims are turbo per S4). Do not use for final specs.

## S12 — gneenev.com (China spec/news)
- **URL:** https://www.gneenev.com/product/electric-cars-ev/499.html · https://www.gneenev.com/news/industry-news/603.html
- **Source type:** database/news · **Region:** China · **Confidence:** database
- **Notes:** China trim/price context: 75KM Luxury, 112KM Honor, 160KM Flagship; ~¥135,800–175,800; ~3.9 L/100km depleted.

## S13 — Bustami & Saheb (BSG) — official BYD Jordan dealer
- **URLs:** https://ecommerce.bsg.com.jo/en/byd-song-520-km-flagship-2 · https://www.mstc.com.jo/bustami-saheb
- **Source type:** dealer (official local distributor) · **Region:** Jordan
- **Model in source:** BYD Song DM-i 112KM Premium · **Downloaded:** none · **Confidence:** dealer
- **Notes:** Confirms **Bustami & Saheb Group appointed BYD's Jordan dealer partner in 2023**. Upgrades dealer status from inference to confirmed official distributor. Pages not deep-fetched; confirm full trim lineup + warranty directly here.

## S14 — BYD GCC/export regional pages (Bahrain / Caribbean RHD flyer)
- **URLs:** https://www.byd.com/en-bh/car/song-plus-dmi-en · https://www.byd.com/content/dam/byd-site/caribbean/product-detail/song-plus-dm-i-rhd/flyer/song-plus-dm-i-rhd-flyer-20240401.pdf
- **Source type:** official (regional/export) · **Region:** GCC / Caribbean (export)
- **Confidence:** official (export) → for Jordan: needs_review
- **Notes:** "Song Plus DM-i" sold under its own name in GCC/export with export connector. Caribbean flyer is RHD (Jordan is LHD) — use only as identity/feature evidence, not for hand/dimension specifics.

## S15 — BYD Saudi Arabia charging/electrification guide
- **URL:** https://www.byd.sa/en/electrification/charging/ · **Source type:** official (regional) · **Region:** GCC/Saudi
- **Confidence:** official (regional) · **Notes:** Confirms BYD export/GCC vehicles use **IEC 62196 Type 2 (AC) + CCS2 (DC)** whereas China-market uses **GB/T**. Basis for the conditional Jordan port reasoning (dealer/GCC stock likely Type2+CCS2).

---

## Rejected / down-weighted summary
- **S9 shouce365** — expired TLS certificate (untrusted mirror). Rejected as a download source.
- **S11 made-in-china resellers** — contain factual errors; down-weighted to needs_review.
- **S8 Seal 6 Touring (UK)** — wrong body (estate); excluded from SUV body/dimension reuse.
- Forums / random PDFs — not used.

## Conflicts to resolve
- **Combined range:** ~1500 km (China) vs 890 km (GCC NEDC) → different variant/standard → needs_review.
- **Fuel consumption:** 3.9 (China depleted) vs 4.95 (Jordan listing) vs 6.9 L/100km (GCC NEDC) → standard-dependent → needs_review.
- **Charging port (Jordan unit):** GB/T (China-direct) vs Type 2 + CCS2 (GCC/dealer/export) → conditional; primary evidence still needed → needs_review.
- **Engine:** 1.5L NA vs 1.5L turbo — varies by trim (S4: Dynamic NA / Premium turbo) → confirm for Jordan trim.
