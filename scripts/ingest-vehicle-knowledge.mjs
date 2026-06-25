#!/usr/bin/env node
/**
 * VoltJo — Vehicle knowledge ingestion (RAG-lite bridge, roadmap §B.3)
 *
 * Walks `public/cars/{folder}/04 - AI Data/*.md` and `.../05 - Trims/*.md`,
 * splits each file on `##` headings (one chunk per section), extracts
 * source/page/confidence metadata, computes a SHA-256 content hash, and
 * idempotently upserts into `public.vehicle_knowledge` keyed by
 * (vehicle_id, category, section). Unchanged chunks (same hash) are skipped.
 *
 * Safe to run repeatedly (e.g. on every deploy). Markdown only; PDFs ignored.
 *
 * Usage:
 *   node scripts/ingest-vehicle-knowledge.mjs            # ingest
 *   node scripts/ingest-vehicle-knowledge.mjs --dry-run  # parse + report, no writes
 *
 * Requires (read from .env.local or the environment):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY   (server-only; bypasses RLS for the write)
 */

import { createHash } from "node:crypto";
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "..");
const CARS_DIR = join(REPO_ROOT, "public", "cars");
const DRY_RUN = process.argv.includes("--dry-run");

// ------------------------------------------------------------------
// Minimal .env.local loader (no dotenv dependency).
// ------------------------------------------------------------------
function loadEnvLocal() {
  const envPath = join(REPO_ROOT, ".env.local");
  if (!existsSync(envPath)) return;
  for (const rawLine of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = val;
  }
}

// ------------------------------------------------------------------
// Folder → DB slug. Only folders whose vehicle exists in
// `supported_vehicles` can be ingested (FK constraint). Folders absent
// from this map are skipped and reported as coverage holes.
// ------------------------------------------------------------------
const FOLDER_SLUG = {
  "01 - BYD Song Plus DM-i 2025": "byd-song-plus-dmi-2025",
  "02 - BYD Song Pro DM-i 2025": "byd-song-pro-dmi-2025",
  "03 - BYD Sealion 05 DM-i 2025": "byd-sealion-05-dmi-2025",
  "06 - Tesla Model 3": "tesla-model-3-2025",
  "10 - Dongfeng Mage PHEV": "dongfeng-mage-phev-2026",
  "12 - Toyota RAV4 Hybrid": "toyota-rav4-hybrid-2025",
};

// Filename → category. Files under `05 - Trims/` always map to `trims`.
const FILE_CATEGORY = {
  "battery-and-charging.md": "battery_charging",
  "engine-and-fuel.md": "engine_fuel",
  "maintenance.md": "maintenance",
  "safety-and-warnings.md": "safety",
  "vehicle-profile.md": "profile",
  "ai-context-summary.md": "profile",
  "unresolved-questions.md": "profile",
  "extraction-checklist.md": "profile",
  "jordan-market-summary.md": "market",
};

const AI_DATA_DIR = "04 - AI Data";
const TRIMS_DIR = "05 - Trims";

// Confidence enum severity: higher = more conservative (Jordan-facing). When a
// grade is a chain ('official (export) → needs_review' or 'estimate / needs_review')
// we keep the MOST conservative token in `confidence` and the full text in
// `confidence_raw`.
const CONF_SEVERITY = {
  unknown: 5,
  needs_review: 4,
  estimate: 3,
  owner_reported: 2,
  dealer: 1,
  official: 0,
};

function tokenToConfidence(seg) {
  const s = seg.toLowerCase();
  if (s.includes("needs_review") || s.includes("needs review")) return "needs_review";
  if (s.includes("official")) return "official";
  if (s.includes("dealer")) return "dealer";
  if (s.includes("owner")) return "owner_reported";
  if (s.includes("estimate")) return "estimate";
  if (s.includes("database")) return "estimate"; // inferred-from-DB ⇒ treat as estimate
  return "unknown"; // 'pending', 'n/a', blank, anything unrecognized
}

/** Collapse a raw confidence string to the most conservative enum value. */
function normalizeConfidence(raw) {
  if (!raw) return "unknown";
  const segments = raw.split(/→|->|\/|,/).map((x) => x.trim()).filter(Boolean);
  const candidates = (segments.length ? segments : [raw]).map(tokenToConfidence);
  return candidates.reduce(
    (worst, c) => (CONF_SEVERITY[c] > CONF_SEVERITY[worst] ? c : worst),
    "official"
  );
}

// ------------------------------------------------------------------
// Markdown chunking + metadata extraction.
// ------------------------------------------------------------------

/** First `field:` value on a line, stopping at the `·` separator or EOL. */
function firstField(text, field) {
  const re = new RegExp(`${field}\\s*:\\s*([^·\\n]+)`, "i");
  const m = text.match(re);
  return m ? m[1].trim() : null;
}

/** Pick the most conservative confidence appearing anywhere in a section. */
function sectionConfidence(text) {
  const re = /confidence\s*:\s*([^·\n]+)/gi;
  let m;
  const raws = [];
  while ((m = re.exec(text)) !== null) raws.push(m[1].trim());
  if (!raws.length) return { confidence: "unknown", confidence_raw: null };
  // Choose the raw whose normalized form is most conservative.
  let bestRaw = raws[0];
  let best = normalizeConfidence(raws[0]);
  for (const r of raws.slice(1)) {
    const n = normalizeConfidence(r);
    if (CONF_SEVERITY[n] > CONF_SEVERITY[best]) {
      best = n;
      bestRaw = r;
    }
  }
  return { confidence: best, confidence_raw: bestRaw };
}

/**
 * Split a Markdown file into chunks — one per `##` heading. Content before the
 * first `##` (H1 + preamble: format notes, warnings) is kept as `__intro__`.
 */
function chunkMarkdown(raw) {
  const lines = raw.split(/\r?\n/);
  const chunks = [];
  let section = "__intro__";
  let buf = [];

  const flush = () => {
    const body = buf.join("\n").trim();
    // Drop sections with no meaningful content — e.g. stub placeholders whose
    // body is just "-" or empty bullets/table scaffolding. Keep anything with at
    // least one letter or digit (Arabic ranges included).
    const meaningful = /[\p{L}\p{N}]/u.test(body);
    if (body && meaningful) chunks.push({ section, body });
    buf = [];
  };

  for (const line of lines) {
    const h = line.match(/^##\s+(.*)$/); // H2 only (## ...), not ### or #
    if (h) {
      flush();
      section = h[1].trim() || "untitled";
    } else {
      buf.push(line);
    }
  }
  flush();
  return chunks;
}

function sha256(text) {
  return createHash("sha256").update(text, "utf8").digest("hex");
}

/**
 * Build the DB row for one chunk (without vehicle_id / content_hash).
 *
 * `section` is qualified with the source-file stem (e.g. "vehicle-profile / Overview").
 * Several source files map to the same `category` (4 → profile, 3 → trims), so the
 * raw `##` heading is NOT unique within (vehicle, category); qualifying by file stem
 * keeps the spec's `unique (vehicle_id, category, section)` collision-free and adds
 * document provenance for later citations.
 */
function buildChunkFields(rawSection, body, category, fileStem) {
  const section = `${fileStem} / ${rawSection}`;
  const sourceRef = firstField(body, "source");
  const sourceFile = firstField(body, "(?:source file|file)");
  const pageRef = firstField(body, "page");
  const market = firstField(body, "market") || "jordan";
  const { confidence, confidence_raw } = sectionConfidence(body);
  return {
    category,
    section,
    content: body,
    source_ref: sourceRef,
    source_file: sourceFile,
    page_ref: pageRef,
    market: market.toLowerCase().includes("jordan") ? "jordan" : market,
    confidence,
    confidence_raw,
  };
}

// ------------------------------------------------------------------
// Filesystem walk: collect every ingestable Markdown file.
// ------------------------------------------------------------------
function collectFiles() {
  const targets = []; // { folder, slug, file, category, path }
  const skippedFolders = []; // { folder, files }

  if (!existsSync(CARS_DIR)) {
    throw new Error(`Cars directory not found: ${CARS_DIR}`);
  }

  for (const folder of readdirSync(CARS_DIR).sort()) {
    const folderPath = join(CARS_DIR, folder);
    if (!statSync(folderPath).isDirectory()) continue;

    const slug = FOLDER_SLUG[folder];
    const mdFiles = [];

    for (const sub of [AI_DATA_DIR, TRIMS_DIR]) {
      const subPath = join(folderPath, sub);
      if (!existsSync(subPath)) continue;
      for (const file of readdirSync(subPath)) {
        if (!file.toLowerCase().endsWith(".md")) continue; // ignore PDFs etc.
        const category =
          sub === TRIMS_DIR ? "trims" : FILE_CATEGORY[file] || "profile";
        mdFiles.push({ file, category, path: join(subPath, file) });
      }
    }

    if (!slug) {
      if (mdFiles.length) skippedFolders.push({ folder, files: mdFiles.length });
      continue;
    }
    for (const f of mdFiles) targets.push({ folder, slug, ...f });
  }

  return { targets, skippedFolders };
}

// ------------------------------------------------------------------
// Main
// ------------------------------------------------------------------
async function main() {
  loadEnvLocal();
  const log = (...a) => console.log(...a);

  log(`\n🚗 VoltJo vehicle-knowledge ingestion${DRY_RUN ? " (DRY RUN)" : ""}`);
  log("─".repeat(60));

  const { targets, skippedFolders } = collectFiles();

  // Parse all chunks up front (pure, side-effect-free).
  const rowsBySlug = new Map(); // slug → array of chunk fields
  const fileStats = []; // per-file { folder, file, category, chunks }
  let totalChunks = 0;

  for (const t of targets) {
    const raw = readFileSync(t.path, "utf8");
    const chunks = chunkMarkdown(raw);
    let count = 0;
    const fileStem = t.file.replace(/\.md$/i, "");
    for (const { section, body } of chunks) {
      const fields = buildChunkFields(section, body, t.category, fileStem);
      if (!rowsBySlug.has(t.slug)) rowsBySlug.set(t.slug, []);
      // Guard against duplicate (category, section) within a vehicle — the
      // unique constraint forbids it; keep the first, warn on collisions.
      const list = rowsBySlug.get(t.slug);
      const dup = list.find(
        (r) => r.category === fields.category && r.section === fields.section
      );
      if (dup) {
        log(
          `  ⚠️  duplicate section skipped: ${t.slug} / ${fields.category} / "${fields.section}" (${basename(t.path)})`
        );
        continue;
      }
      list.push(fields);
      count++;
      totalChunks++;
    }
    fileStats.push({ folder: t.folder, file: t.file, category: t.category, chunks: count });
  }

  log(`\n📄 Files parsed: ${fileStats.length}`);
  log(`🧩 Chunks parsed: ${totalChunks}`);
  if (skippedFolders.length) {
    log(`\n⏭️  Skipped folders (no DB row — coverage holes):`);
    for (const s of skippedFolders) log(`    - ${s.folder} (${s.files} file(s))`);
  }

  if (DRY_RUN) {
    log(`\n✅ Dry run complete — no writes. Chunks per vehicle:`);
    for (const [slug, rows] of rowsBySlug) log(`    - ${slug}: ${rows.length}`);

    // ---- Offline validation stats (no DB needed) ----
    const allRows = [...rowsBySlug.values()].flat();
    const byCategory = {};
    const byConfidence = {};
    let withSource = 0;
    let withPage = 0;
    const lengths = [];
    const seenKeys = new Set();
    let dupKeys = 0;
    for (const r of allRows) {
      byCategory[r.category] = (byCategory[r.category] || 0) + 1;
      byConfidence[r.confidence] = (byConfidence[r.confidence] || 0) + 1;
      if (r.source_ref) withSource++;
      if (r.page_ref) withPage++;
      lengths.push(r.content.length);
      // duplicate detection is per (vehicle, category, section); approximate
      // here with category+section across the flat list for a global sanity check.
    }
    // Per-vehicle uniqueness check (the real constraint).
    for (const [slug, rows] of rowsBySlug) {
      const keys = new Set();
      for (const r of rows) {
        const k = `${slug}|${r.category}|${r.section}`;
        if (keys.has(k)) dupKeys++;
        keys.add(k);
        seenKeys.add(k);
      }
    }
    lengths.sort((a, b) => a - b);
    const sum = lengths.reduce((a, b) => a + b, 0);
    log(`\n🧮 Chunks by category:`);
    for (const [c, n] of Object.entries(byCategory).sort()) log(`    - ${c}: ${n}`);
    log(`\n🏷️  Chunks by confidence:`);
    for (const [c, n] of Object.entries(byConfidence).sort()) log(`    - ${c}: ${n}`);
    log(`\n🔗 Metadata coverage:`);
    log(`    - with source_ref: ${withSource}/${allRows.length}`);
    log(`    - with page_ref:   ${withPage}/${allRows.length}`);
    log(`\n📏 Content length (chars): min=${lengths[0]} median=${lengths[Math.floor(lengths.length / 2)]} max=${lengths[lengths.length - 1]} avg=${Math.round(sum / lengths.length)}`);
    log(`\n🔁 Duplicate (vehicle,category,section) keys: ${dupKeys} (must be 0)`);
    return;
  }

  // ----------------------------------------------------------------
  // Connect (service role) and resolve slug → vehicle_id.
  // ----------------------------------------------------------------
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    console.error(
      "\n❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY " +
        "(set them in .env.local or the environment)."
    );
    process.exit(1);
  }
  const supabase = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const slugs = [...rowsBySlug.keys()];
  const { data: vehicles, error: vErr } = await supabase
    .from("supported_vehicles")
    .select("id, slug")
    .in("slug", slugs);
  if (vErr) {
    console.error(`\n❌ Failed to load vehicles: ${vErr.message}`);
    process.exit(1);
  }
  const idBySlug = new Map(vehicles.map((v) => [v.slug, v.id]));
  for (const slug of slugs) {
    if (!idBySlug.has(slug)) {
      log(`  ⚠️  slug not in supported_vehicles (skipping ${rowsBySlug.get(slug).length} chunks): ${slug}`);
    }
  }

  let inserted = 0;
  let updated = 0;
  let skipped = 0;

  for (const [slug, rows] of rowsBySlug) {
    const vehicleId = idBySlug.get(slug);
    if (!vehicleId) continue;

    // Existing hashes for change detection.
    const { data: existing, error: eErr } = await supabase
      .from("vehicle_knowledge")
      .select("category, section, content_hash")
      .eq("vehicle_id", vehicleId);
    if (eErr) {
      console.error(`\n❌ Failed to read existing knowledge for ${slug}: ${eErr.message}`);
      process.exit(1);
    }
    const existingHash = new Map(
      (existing || []).map((r) => [`${r.category} ${r.section}`, r.content_hash])
    );

    const toUpsert = [];
    for (const r of rows) {
      const hash = sha256(r.content);
      const key = `${r.category} ${r.section}`;
      const prev = existingHash.get(key);
      if (prev === hash) {
        skipped++;
        continue;
      }
      if (prev === undefined) inserted++;
      else updated++;
      toUpsert.push({ vehicle_id: vehicleId, content_hash: hash, ...r });
    }

    if (toUpsert.length) {
      const { error: uErr } = await supabase
        .from("vehicle_knowledge")
        .upsert(toUpsert, { onConflict: "vehicle_id,category,section" });
      if (uErr) {
        console.error(`\n❌ Upsert failed for ${slug}: ${uErr.message}`);
        process.exit(1);
      }
    }
    log(`  ✓ ${slug}: ${toUpsert.length} written, ${rows.length - toUpsert.length} unchanged`);
  }

  log("\n" + "─".repeat(60));
  log(`📊 Done. inserted=${inserted}  updated=${updated}  skipped(unchanged)=${skipped}`);
  log(`   total chunks processed: ${totalChunks}`);
}

main().catch((err) => {
  console.error("\n❌ Ingestion crashed:", err);
  process.exit(1);
});
