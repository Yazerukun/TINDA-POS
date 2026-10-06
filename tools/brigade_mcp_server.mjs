// tools/brigade_mcp_server.ts
import path3 from "node:path";
import os from "node:os";
import fs3 from "node:fs";

// ../brigade/src/tideline/store/records.ts
import * as fs2 from "node:fs";
import * as path2 from "node:path";

// ../brigade/src/security/injection-patterns.ts
var PATTERNS = [
  // ── classic prompt injection (scope: all) ──
  { re: /ignore\s+(?:\w+\s+)*(?:previous|all|above|prior)\s+(?:\w+\s+)*instructions/i, id: "ignore_instructions", scope: "all" },
  { re: /system\s+prompt\s+override/i, id: "system_prompt_override", scope: "all" },
  { re: /disregard\s+(?:\w+\s+)*(?:instructions|rules|guidelines|safety)/i, id: "disregard_rules", scope: "all" },
  { re: /act\s+as\s+if\s+(?:\w+\s+)*no\s+(?:restrictions|rules|limits)/i, id: "no_restrictions", scope: "all" },
  { re: /<!--[^>]*(?:ignore|override|system\s+prompt|secret|hidden\s+instruction)[^>]*-->/i, id: "html_comment_injection", scope: "all" },
  { re: /translate\s+(?:\w+\s+)*and\s+(?:execute|run|eval)/i, id: "translate_and_execute", scope: "all" },
  { re: /do\s+not\s+(?:tell|inform|mention\s+to)\s+the\s+user/i, id: "do_not_tell_user", scope: "all" },
  // ── role-play / identity hijack (scope: context) ──
  { re: /you\s+are\s+(?:\w+\s+)*now\s+(?:a|an|the)\b/i, id: "you_are_now", scope: "context" },
  { re: /pretend\s+(?:you\s+are|to\s+be)/i, id: "pretend", scope: "context" },
  { re: /(?:output|reveal|print|repeat)\s+(?:\w+\s+)*(?:system|initial|original)\s+prompt/i, id: "reveal_system_prompt", scope: "context" },
  { re: /(?:respond|answer|reply)\s+without\s+(?:\w+\s+)*(?:restrictions|filters|safety)/i, id: "respond_without_safety", scope: "context" },
  { re: /you\s+have\s+been\s+(?:updated|upgraded|patched|reprogrammed)\s+to/i, id: "you_have_been_updated", scope: "context" },
  // ── C2 / promptware (scope: context) ──
  { re: /register\s+as\s+a\s+node/i, id: "c2_register_node", scope: "context" },
  { re: /(?:heartbeat|beacon|check-?in)\s+(?:to|with)\b/i, id: "c2_beacon", scope: "context" },
  { re: /\bpull\s+(?:\w+\s+)*task(?:ing|s)?\b/i, id: "c2_pull_tasks", scope: "context" },
  { re: /you\s+must\s+(?:\w+\s+)*(?:register|connect|report|beacon)\b/i, id: "c2_must_connect", scope: "context" },
  { re: /\b(?:cobalt\s+strike|sliver|havoc|mythic|metasploit)\b/i, id: "c2_framework", scope: "context" },
  { re: /\bcommand\s+and\s+control\b|\bc2\s+(?:server|channel|node)\b/i, id: "command_and_control", scope: "context" },
  { re: /\bunset\s+(?:\w+\s+)*(?:BRIGADE|CLAUDE|ANTHROPIC|OPENAI|AGENT)[A-Z_]*/, id: "anti_forensic_unset", scope: "context" },
  { re: /\bname\s+yourself\s+\w+/i, id: "identity_override", scope: "context" },
  { re: /never\s+(?:\w+\s+)*(?:create|write)\s+(?:\w+\s+)*(?:script|file)\s+(?:\w+\s+)*disk/i, id: "anti_forensic_disk", scope: "context" },
  { re: /only\s+use\s+one[\s-]?liners?\b/i, id: "anti_forensic_oneliner", scope: "context" },
  { re: /connect\s+to\s+the\s+network\b/i, id: "c2_network_connect", scope: "context" },
  // ── exfiltration ──
  { re: /(?:curl|wget)\b[^\n]*\$?[A-Za-z_]*(?:KEY|TOKEN|SECRET|PASSWORD)/i, id: "exfil_curl_secret", scope: "all" },
  { re: /\bcat\b[^\n]*(?:\.env\b|credentials\b|\.netrc\b|\.pgpass\b|\.npmrc\b|\.pypirc\b)/i, id: "exfil_cat_secrets", scope: "all" },
  { re: /(?:send|post|upload|transmit|exfiltrate)\s+(?:\w+\s+)*to\s+https?:\/\//i, id: "exfil_send_url", scope: "strict" },
  { re: /(?:include|output|print|share|leak|send|reveal|forward)\s+(?:\w+\s+)*(?:the\s+)?(?:conversation|chat\s+history|full\s+context)/i, id: "exfil_history", scope: "strict" },
  // ── persistence (scope: strict) ──
  { re: /authorized_keys|~?\/?\.ssh\b|\.brigade\/\.env/i, id: "persistence_ssh", scope: "strict" },
  { re: /(?:update|modify|append\s+to|overwrite|write\s+to|edit|change|add\s+to)\s+(?:\w+\s+)*(?:AGENTS\.md|CLAUDE\.md|\.cursorrules|\.clinerules|SOUL\.md)/i, id: "persistence_context_file", scope: "strict" },
  // ── hardcoded secret (scope: strict) ──
  { re: /(?:api[_-]?key|access[_-]?token|secret|password)\s*[:=]\s*["'](?:[^"']{20,}["']|[^"'\s]{20,})/i, id: "hardcoded_secret", scope: "strict" }
];
var INVISIBLE_CODEPOINTS = /[​-‍⁠⁢-⁤﻿‪-‮⁦-⁩]/;
function patternsForScope(scope) {
  if (scope === "all") return PATTERNS.filter((p) => p.scope === "all");
  if (scope === "context") return PATTERNS.filter((p) => p.scope !== "strict");
  return PATTERNS;
}
function scanForThreats(content, scope = "strict") {
  if (!content) return [];
  const out = [];
  for (const p of patternsForScope(scope)) {
    if (p.re.test(content)) out.push(p.id);
  }
  if (INVISIBLE_CODEPOINTS.test(content)) out.push("invisible_unicode");
  return out;
}
var MemoryThreatError = class extends Error {
  code = "memory:threat";
  threats;
  constructor(threats) {
    super(`memory content matched threat pattern(s): ${threats.join(", ")}`);
    this.name = "MemoryThreatError";
    this.threats = threats;
  }
};

// ../brigade/src/tideline/lifecycle/decay.ts
var DAY_MS = 864e5;
var BASE_HALF_LIFE_DAYS = 11.25;
var DECAY_BETA = 0.8;
function effectiveScore(rec, now = Date.now()) {
  if (rec.tier === "permanent") return 1;
  const daysSinceAccess = Math.max(0, (now - rec.lastAccessedAt) / DAY_MS);
  const adaptiveHalfLife = BASE_HALF_LIFE_DAYS * (1 + rec.importance);
  const lambda = Math.LN2 / Math.max(adaptiveHalfLife, 1e-3) * DECAY_BETA;
  const effectiveLambda = lambda * (1 + rec.decayRate);
  const decayed = rec.importance * Math.exp(-effectiveLambda * daysSinceAccess);
  const reinforcement = 1 + Math.log1p(rec.accessCount) * 0.1;
  return Math.max(0, Math.min(1, decayed * reinforcement));
}

// ../brigade/src/tideline/retrieval/scoring.ts
var K1 = 1.2;
var B = 0.75;
var STOPWORDS = /* @__PURE__ */ new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "by",
  "did",
  "do",
  "does",
  "for",
  "from",
  "had",
  "has",
  "have",
  "how",
  "i",
  "in",
  "is",
  "it",
  "its",
  "me",
  "my",
  "of",
  "on",
  "or",
  "that",
  "the",
  "this",
  "to",
  "was",
  "what",
  "when",
  "where",
  "which",
  "who",
  "will",
  "with",
  "you",
  "your"
]);
function tokenize(text2) {
  return text2.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter((t) => t.length > 0 && !STOPWORDS.has(t));
}
function bm25Score(records, query, now = Date.now(), opts = {}) {
  const qterms = [...new Set(tokenize(query))];
  if (qterms.length === 0 || records.length === 0) return [];
  const docs = records.map((r) => ({ record: r, tokens: tokenize(r.content) }));
  const N = docs.length;
  const avgLen = Math.max(1, docs.reduce((s, d) => s + d.tokens.length, 0) / N);
  const idf = /* @__PURE__ */ new Map();
  for (const t of qterms) {
    let n = 0;
    for (const d of docs) if (d.tokens.includes(t)) n += 1;
    idf.set(t, Math.log(1 + (N - n + 0.5) / (n + 0.5)));
  }
  const out = [];
  for (const d of docs) {
    const len = d.tokens.length;
    const tf = /* @__PURE__ */ new Map();
    for (const tok of d.tokens) if (idf.has(tok)) tf.set(tok, (tf.get(tok) ?? 0) + 1);
    let bm = 0;
    const matched = [];
    for (const t of qterms) {
      const f = tf.get(t) ?? 0;
      if (f === 0) continue;
      matched.push(t);
      const denom = f + K1 * (1 - B + B * len / avgLen);
      bm += (idf.get(t) ?? 0) * (f * (K1 + 1) / denom);
    }
    if (bm <= 0) continue;
    const effective = effectiveScore(d.record, now);
    const modulator = opts.modulate === false ? 1 : 0.5 + 0.5 * effective;
    const score = bm * modulator;
    const scored = { record: d.record, score };
    if (opts.breakdown) {
      scored.breakdown = { bm25: bm, matchedTerms: matched, effective, modulator, score };
    }
    out.push(scored);
  }
  out.sort((a, b) => b.score - a.score || b.record.createdAt - a.record.createdAt);
  return out;
}

// ../brigade/src/tideline/governance/write-gate.ts
var UNTRUSTED_SOURCES = /* @__PURE__ */ new Set([
  "tool_output",
  "retrieved_document",
  "compaction",
  "extraction"
]);
var PROTECTED_SEGMENTS = /* @__PURE__ */ new Set([
  "identity",
  "preference",
  "correction"
]);
function isUntrustedSource(source) {
  return source !== void 0 && UNTRUSTED_SOURCES.has(source);
}
function isTrustedTarget(source) {
  return !isUntrustedSource(source);
}
var WriteGateError = class extends Error {
  code = "write_gate_blocked";
  constructor(reason) {
    super(`memory write blocked: ${reason}`);
    this.name = "WriteGateError";
  }
};
function evaluateWriteGate(args) {
  if (!isUntrustedSource(args.sourceType)) return { allow: true };
  if (PROTECTED_SEGMENTS.has(args.segment)) {
    return {
      allow: false,
      reason: `a ${args.sourceType} source may not author a "${args.segment}" fact \u2014 authoritative segments (identity/preference/correction) are owner-only`
    };
  }
  const owned = args.supersedeTargets.find((t) => isTrustedTarget(t.sourceType));
  if (owned) {
    return {
      allow: false,
      reason: `a ${args.sourceType} source may not supersede owner-authored memory (${owned.memoryId})`
    };
  }
  return { allow: true };
}

// ../brigade/src/tideline/graph/links.ts
var MEMORY_LINK_KINDS = [
  "supersedes",
  "transition",
  "corrects",
  "derived_from",
  "supports",
  "causes",
  "caused_by",
  "part_of",
  "precedes",
  "follows",
  "enables",
  "blocks",
  "co_constrains",
  "located_at",
  "uses",
  "works_on",
  "contrasts_with",
  "contradicts",
  "relates_to",
  "same_topic",
  "relates"
];
var MEMORY_LINK_KIND_SET = new Set(MEMORY_LINK_KINDS);
var EXTRACTOR_FACTUAL_KINDS = [
  "causes",
  "caused_by",
  "part_of",
  "precedes",
  "follows",
  "enables",
  "blocks",
  "co_constrains",
  "located_at",
  "uses",
  "works_on",
  "contrasts_with",
  "relates_to"
];
var EXTRACTOR_FACTUAL_KIND_SET = new Set(EXTRACTOR_FACTUAL_KINDS);
function inverseLinkKind(kind) {
  switch (kind) {
    case "causes":
      return "caused_by";
    case "caused_by":
      return "causes";
    case "precedes":
      return "follows";
    case "follows":
      return "precedes";
    case "part_of":
      return "part_of";
    // membership reads both ways for recall (component ↔ whole)
    default:
      return kind;
  }
}
function linksFrom(record) {
  const mirrored = (record.supersedes ?? []).map((target) => ({ kind: "supersedes", target }));
  const byKey = /* @__PURE__ */ new Map();
  const order = [];
  for (const l of [...record.links ?? [], ...mirrored]) {
    const key = `${l.kind}|${l.target}`;
    const prior = byKey.get(key);
    if (!prior) {
      byKey.set(key, l);
      order.push(key);
    } else if (!prior.reason && l.reason) {
      byKey.set(key, l);
    }
  }
  return order.map((k) => byKey.get(k));
}
function backlinksTo(records, targetId) {
  const out = [];
  for (const r of records) {
    for (const l of linksFrom(r)) {
      if (l.target === targetId) out.push({ from: r.memoryId, kind: l.kind });
    }
  }
  return out;
}

// ../brigade/src/tideline/store/event-log.ts
import * as fs from "node:fs";
import * as path from "node:path";
var MemoryEventLog = class {
  constructor(file) {
    this.file = file;
  }
  get filePath() {
    return this.file;
  }
  append(event) {
    try {
      fs.mkdirSync(path.dirname(this.file), { recursive: true });
      fs.appendFileSync(this.file, `${JSON.stringify(event)}
`, "utf8");
    } catch {
    }
  }
  /** Read the full ordered history. Malformed lines are skipped (never throws). */
  readAll() {
    let raw;
    try {
      raw = fs.readFileSync(this.file, "utf8");
    } catch {
      return [];
    }
    const out = [];
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        const e = JSON.parse(trimmed);
        if (e && typeof e.memoryId === "string" && typeof e.kind === "string") out.push(e);
      } catch {
      }
    }
    return out;
  }
};

// ../brigade/src/tideline/embeddings/embedder.ts
import { createHash } from "node:crypto";
function features(text2) {
  const toks = text2.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter((t) => t.length > 0);
  const out = [];
  for (const t of toks) {
    out.push(`w:${t}`);
    const padded = `^${t}$`;
    for (let i = 0; i + 3 <= padded.length; i++) out.push(`g:${padded.slice(i, i + 3)}`);
  }
  return out;
}
function cosine(a, b) {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    const x = a[i] ?? 0;
    const y = b[i] ?? 0;
    dot += x * y;
    na += x * x;
    nb += y * y;
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}
var ATOM_CACHE_CAP = 5e4;
var HrrEmbedder = class {
  constructor(phases = 128) {
    this.phases = phases;
    this.dims = phases * 2;
    this.id = `hrr-v1:${this.dims}`;
  }
  id;
  dims;
  queryPreprocessing = "content-terms";
  // Keep the 0.3 recovery floor: raising it also suppresses genuine morphology
  // (e.g. "deploy" → "deploys"). Remove question scaffolding from recall queries
  // instead, so shared function words cannot supply the recovery signal. Random
  // feature collisions remain possible; this is not a learned semantic model.
  atomCache = /* @__PURE__ */ new Map();
  embed(texts) {
    return texts.map((t) => this.embedOne(t));
  }
  /** SHA-256-seeded phase atom for a feature: hash `feat:i` rounds, each digest
   *  → 16 uint16 → 16 phases in [0, 2π), until `phases` filled. Cached. */
  atom(feat) {
    const hit = this.atomCache.get(feat);
    if (hit) return hit;
    const out = new Float64Array(this.phases);
    let filled = 0;
    let round = 0;
    while (filled < this.phases) {
      const digest = createHash("sha256").update(`${feat}:${round}`).digest();
      for (let i = 0; i + 2 <= digest.length && filled < this.phases; i += 2) {
        const u16 = digest.readUInt16LE(i);
        out[filled++] = u16 * (2 * Math.PI) / 65536;
      }
      round++;
    }
    if (this.atomCache.size >= ATOM_CACHE_CAP) {
      const oldest = this.atomCache.keys().next().value;
      if (oldest !== void 0) this.atomCache.delete(oldest);
    }
    this.atomCache.set(feat, out);
    return out;
  }
  embedOne(text2) {
    const feats = features(text2);
    if (feats.length === 0) feats.push("w:__hrr_empty__");
    const sumCos = new Float64Array(this.phases);
    const sumSin = new Float64Array(this.phases);
    for (const f of feats) {
      const a = this.atom(f);
      for (let i = 0; i < this.phases; i++) {
        sumCos[i] = (sumCos[i] ?? 0) + Math.cos(a[i] ?? 0);
        sumSin[i] = (sumSin[i] ?? 0) + Math.sin(a[i] ?? 0);
      }
    }
    const vec = new Array(this.dims);
    for (let i = 0; i < this.phases; i++) {
      const phase = Math.atan2(sumSin[i] ?? 0, sumCos[i] ?? 0);
      vec[2 * i] = Math.cos(phase);
      vec[2 * i + 1] = Math.sin(phase);
    }
    let norm = 0;
    for (const x of vec) norm += x * x;
    norm = Math.sqrt(norm);
    if (norm > 0) for (let i = 0; i < this.dims; i++) vec[i] = (vec[i] ?? 0) / norm;
    return vec;
  }
};
var _default = new HrrEmbedder(128);
function getDefaultEmbedder() {
  return _default;
}

// ../brigade/src/tideline/retrieval/hybrid.ts
var DEFAULT_MIN_SIM = 0.3;
var DEFAULT_MMR_LAMBDA = 1;
var TRUST_BY_SOURCE = {
  user_instruction: 1,
  owner_message: 1,
  extraction: 0.9,
  dream: 0.85,
  compaction: 0.85,
  channel_message: 0.8,
  tool_output: 0.65,
  retrieved_document: 0.6
};
function trustFactor(r) {
  const base = r.sourceType ? TRUST_BY_SOURCE[r.sourceType] ?? 0.9 : 1;
  const conf = typeof r.confidence === "number" ? Math.max(0, Math.min(1, r.confidence)) : 1;
  return base * conf;
}
function prepareRecallQuery(query, embedder) {
  return embedder.queryPreprocessing === "content-terms" ? tokenize(query).join(" ") : query;
}
function recallHybrid(candidates, query, embedder, now = Date.now(), opts = {}) {
  const limit = opts.limit && opts.limit > 0 ? opts.limit : 8;
  const minSim = opts.minSim ?? embedder.minSim ?? DEFAULT_MIN_SIM;
  const lambda = opts.mmrLambda ?? DEFAULT_MMR_LAMBDA;
  if (candidates.length === 0) return [];
  const lex = bm25Score(candidates, query, now);
  const lexIds = new Set(lex.map((s) => s.record.memoryId));
  const vectorQuery = prepareRecallQuery(query, embedder);
  const qv = vectorQuery.length > 0 ? embedder.embed([vectorQuery])[0] ?? [] : [];
  const vecRank = /* @__PURE__ */ new Map();
  candidates.map((r) => ({ id: r.memoryId, sim: r.embedding && r.embedding.length === qv.length ? cosine(qv, r.embedding) : -1 })).filter((x) => x.sim >= minSim).sort((a, b) => b.sim - a.sim).forEach((x, i) => vecRank.set(x.id, i + 1));
  const primary = lex.map((s, i) => {
    const id = s.record.memoryId;
    return {
      record: s.record,
      score: s.score * trustFactor(s.record),
      lexRank: i + 1,
      ...vecRank.has(id) ? { vecRank: vecRank.get(id) } : {}
    };
  });
  primary.sort((a, b) => b.score - a.score || b.record.createdAt - a.record.createdAt);
  const byId = new Map(candidates.map((r) => [r.memoryId, r]));
  const minPrimary = primary.length ? primary[primary.length - 1]?.score ?? 0 : 1;
  const recovered = [...vecRank.keys()].filter((id) => !lexIds.has(id)).map((id) => ({ id, rank: vecRank.get(id) ?? Number.POSITIVE_INFINITY })).sort((a, b) => a.rank - b.rank).map((x, i) => {
    const record = byId.get(x.id);
    if (!record) return null;
    const decayDamp = 0.5 + 0.5 * effectiveScore(record, now);
    return {
      record,
      score: minPrimary * 0.5 * 0.9 ** i * trustFactor(record) * decayDamp,
      vecRank: x.rank
    };
  }).filter((x) => x !== null);
  return mmrRerank([...primary, ...recovered], lambda, limit);
}
function mmrRerank(scored, lambda, limit) {
  if (scored.length <= 1) return scored.slice(0, limit);
  const peak = Math.max(...scored.map((s) => s.score));
  const maxScore = peak > 0 ? peak : 1;
  const pool = scored.map((s) => ({ ...s, rel: s.score / maxScore }));
  const selected = [];
  while (selected.length < limit && pool.length > 0) {
    let bestIdx = 0;
    let bestVal = -Infinity;
    for (let i = 0; i < pool.length; i++) {
      const cand = pool[i];
      if (!cand) continue;
      let maxSim = 0;
      if (lambda < 1) {
        for (const s of selected) {
          const sim = cand.record.embedding && s.record.embedding && cand.record.embedding.length === s.record.embedding.length ? cosine(cand.record.embedding, s.record.embedding) : 0;
          if (sim > maxSim) maxSim = sim;
        }
      }
      const mmr = lambda * cand.rel - (1 - lambda) * maxSim;
      if (mmr > bestVal) {
        bestVal = mmr;
        bestIdx = i;
      }
    }
    const [picked] = pool.splice(bestIdx, 1);
    if (picked) selected.push(picked);
  }
  return selected.map(({ rel: _rel, ...s }) => s);
}
async function recallHybridAsync(candidates, query, embedder, now = Date.now(), opts = {}) {
  const vectorQuery = prepareRecallQuery(query, embedder);
  const qv = vectorQuery.length > 0 ? (await embedder.embed([vectorQuery]))[0] ?? [] : [];
  const preEmbedded = {
    id: embedder.id,
    dims: embedder.dims,
    ...embedder.minSim !== void 0 ? { minSim: embedder.minSim } : {},
    ...embedder.queryPreprocessing !== void 0 ? { queryPreprocessing: embedder.queryPreprocessing } : {},
    embed: () => [qv]
  };
  return recallHybrid(candidates, query, preEmbedded, now, opts);
}

// ../brigade/src/tideline/store/records.ts
var SEGMENT_DEFAULTS = {
  identity: { tier: "permanent", importance: 0.85, decayRate: 0.01 },
  correction: { tier: "long", importance: 0.8, decayRate: 0.015 },
  relationship: { tier: "long", importance: 0.75, decayRate: 0.02 },
  preference: { tier: "long", importance: 0.7, decayRate: 0.02 },
  project: { tier: "long", importance: 0.65, decayRate: 0.025 },
  knowledge: { tier: "long", importance: 0.6, decayRate: 0.03 },
  context: { tier: "short", importance: 0.4, decayRate: 0.08 }
};
var MEMORY_SEGMENTS = Object.keys(SEGMENT_DEFAULTS);
var FACTS_RELATIVE_PATH = path2.join("memory", "facts.jsonl");
var MAX_FACT_CONTENT_CHARS = 1e3;
var DEDUP_SIMILARITY = 0.85;
var IDEMPOTENT_COSINE_BAR = 0.45;
var IDEMPOTENT_JACCARD_BAR = 0.4;
function tokenSet(content) {
  return new Set(tokenize(content));
}
function normalizeSubjectKey(raw) {
  return raw.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "_").replace(/^_|_$/g, "");
}
function jaccard(a, b) {
  if (a.size === 0 && b.size === 0) return 0;
  let inter = 0;
  for (const t of a) if (b.has(t)) inter += 1;
  const union = a.size + b.size - inter;
  return union === 0 ? 0 : inter / union;
}
var SEGMENT_SPECIFICITY = {
  identity: 5,
  correction: 5,
  preference: 5,
  relationship: 3,
  project: 3,
  context: 1,
  knowledge: 1
};
function richnessTuple(r) {
  return [
    r.subjectKey ? 1 : 0,
    // a subject-bearing fact anchors a vault hub — keep it
    SEGMENT_SPECIFICITY[r.segment] ?? 0,
    // identity/preference/correction beat knowledge
    typeof r.confidence === "number" ? r.confidence : 0,
    // more-confident wins
    r.importance,
    // then importance
    r.accessCount
    // then confirmations (recall reinforcement / reasserts)
  ];
}
function compareRichness(a, b) {
  const ta = richnessTuple(a);
  const tb = richnessTuple(b);
  for (let i = 0; i < ta.length; i++) {
    if (ta[i] !== tb[i]) return ta[i] - tb[i];
  }
  return 0;
}
function inheritRicherMetadata(survivor, loser) {
  if (!survivor.subjectKey && loser.subjectKey) survivor.subjectKey = loser.subjectKey;
  if ((SEGMENT_SPECIFICITY[loser.segment] ?? 0) > (SEGMENT_SPECIFICITY[survivor.segment] ?? 0)) {
    survivor.segment = loser.segment;
    const d = SEGMENT_DEFAULTS[survivor.segment] ?? SEGMENT_DEFAULTS.context;
    survivor.tier = d.tier;
    survivor.decayRate = d.decayRate;
  }
  survivor.importance = Math.max(survivor.importance, loser.importance);
  if (typeof loser.confidence === "number") {
    survivor.confidence = Math.max(survivor.confidence ?? 0, loser.confidence);
  }
  survivor.accessCount = Math.max(survivor.accessCount, loser.accessCount);
  if (!survivor.sourceTurn && loser.sourceTurn) survivor.sourceTurn = loser.sourceTurn;
  if (survivor.validFrom === void 0 && loser.validFrom !== void 0) survivor.validFrom = loser.validFrom;
  if (loser.links && loser.links.length > 0) {
    const seen = new Set((survivor.links ?? []).map((l) => `${l.kind}|${l.target}`));
    const merged = [...survivor.links ?? []];
    for (const l of loser.links) {
      const key = `${l.kind}|${l.target}`;
      if (l.target === survivor.memoryId || seen.has(key)) continue;
      seen.add(key);
      merged.push(l);
    }
    if (merged.length > 0) survivor.links = merged;
  }
  return survivor;
}
function makeMemoryId() {
  return `mem_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
function resolveRecordOrigin(origin) {
  return origin ?? { kind: "owner" };
}
function originBucketKey(r) {
  const o = resolveRecordOrigin(r.createdBy);
  if (o.kind !== "channel") return "owner";
  return `channel:${JSON.stringify([o.channelId ?? "", o.accountId ?? "", o.conversationId ?? "", o.sessionKey ?? ""])}`;
}
function sameOrigin(a, b) {
  const resolvedA = resolveRecordOrigin(a);
  const resolvedB = resolveRecordOrigin(b);
  if (resolvedA.kind !== resolvedB.kind) return false;
  if (resolvedA.kind === "owner") return true;
  const channelA = resolvedA;
  const channelB = resolvedB;
  return channelA.channelId === channelB.channelId && (channelA.accountId ?? "") === (channelB.accountId ?? "") && channelA.conversationId === channelB.conversationId && channelA.sessionKey === channelB.sessionKey;
}
function recordMatchesOriginFilter(record, filter) {
  if (filter === void 0) return true;
  return sameOrigin(record.createdBy, filter);
}
function clampImportance(value, fallback) {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.max(0, Math.min(1, value));
}
var FactStore = class {
  file;
  workspaceDir;
  hostPorts;
  /** Injectable wall-clock. Defaults to `Date.now`; the eval pins it (e.g. `() => 0`)
   *  so write-time `createdAt` AND score-time `now` share ONE deterministic clock —
   *  otherwise decay over the (load-dependent) gap between seeding and recall makes
   *  the hybrid/decay lanes non-reproducible. Production passes nothing → `Date.now`. */
  clock;
  eventLogCache;
  /** Did the most recent readAll SKIP any non-empty line (unparseable JSON or an
   *  invalid record shape)? Such content — a hand-edit, a torn/concurrent write, a
   *  partial sync — would be silently DROPPED by the next writeAll (which rewrites
   *  only the parsed records). When set, writeAll snapshots the file to a `.bak`
   *  first so the skipped content stays recoverable. */
  lastReadHadUnparseable = false;
  constructor(workspaceDir, opts = {}) {
    this.file = path2.join(workspaceDir, FACTS_RELATIVE_PATH);
    this.workspaceDir = path2.dirname(path2.dirname(this.file));
    this.hostPorts = opts.hostPorts ?? {};
    this.clock = opts.now ?? (() => Date.now());
  }
  /** Absolute path to the JSONL file (for diagnostics). */
  get filePath() {
    return this.file;
  }
  /** Whether this instance currently uses its built-in filesystem persistence. */
  get isFilesystemBacked() {
    return this.backend() === void 0;
  }
  /** Hosts with asynchronous hydration must become ready before synchronous reads. */
  async ready() {
    await this.backend()?.ready?.();
  }
  /** Await fact persistence when the host writes behind; filesystem writes are synchronous. */
  async flush() {
    await this.backend()?.flush?.();
  }
  backend() {
    return this.hostPorts.getBackend?.(this.workspaceDir);
  }
  /** The append-only event log (sibling `events.jsonl` of the facts file). */
  eventLog() {
    if (!this.eventLogCache) {
      this.eventLogCache = new MemoryEventLog(path2.join(path2.dirname(this.file), "events.jsonl"));
    }
    return this.eventLogCache;
  }
  /** Emit additive provenance through this instance's backend or local event log. */
  emit(event) {
    const backend = this.backend();
    if (backend) {
      backend.appendEvent(event);
      return;
    }
    this.eventLog().append(event);
  }
  /** Synchronous history is filesystem-only; use readEventsAsync for other backends. */
  readEvents() {
    if (this.backend()) return [];
    return this.eventLog().readAll();
  }
  /** The append-only provenance history for either realization, ordered oldest-first. */
  async readEventsAsync() {
    const backend = this.backend();
    if (backend) return backend.readEventsAsync();
    return this.eventLog().readAll();
  }
  /** Read every record. Malformed lines are skipped (never throws on a bad line). */
  readAll() {
    const backend = this.backend();
    if (backend) return backend.readAll();
    let raw;
    try {
      raw = fs2.readFileSync(this.file, "utf8");
    } catch {
      return [];
    }
    const out = [];
    let nonEmpty = 0;
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      nonEmpty++;
      try {
        const rec = JSON.parse(trimmed);
        if (rec && typeof rec.memoryId === "string" && typeof rec.content === "string") {
          out.push(rec);
        }
      } catch {
      }
    }
    this.lastReadHadUnparseable = nonEmpty > out.length;
    return out;
  }
  /** Active records, optionally filtered, most-recent-first, capped by `limit`. */
  list(filter = {}) {
    const lifecycle = filter.lifecycle ?? "active";
    let recs = this.readAll().filter((r) => r.lifecycle === lifecycle);
    if (filter.segment) recs = recs.filter((r) => r.segment === filter.segment);
    if (filter.origin !== void 0) {
      recs = recs.filter((r) => recordMatchesOriginFilter(r, filter.origin));
    }
    recs.sort((a, b) => b.createdAt - a.createdAt);
    return filter.limit && filter.limit > 0 ? recs.slice(0, filter.limit) : recs;
  }
  /**
   * Persist a new fact. Derives tier/importance/decay from the segment
   * defaults (writer may override tier/importance). Archives any `supersedes`
   * targets. Returns the stored record.
   */
  write(fact) {
    const defaults = SEGMENT_DEFAULTS[fact.segment] ?? SEGMENT_DEFAULTS.context;
    const now = this.clock();
    const record = {
      memoryId: makeMemoryId(),
      content: fact.content.trim().slice(0, MAX_FACT_CONTENT_CHARS),
      segment: fact.segment,
      tier: fact.tier ?? defaults.tier,
      importance: clampImportance(fact.importance, defaults.importance),
      decayRate: defaults.decayRate,
      accessCount: 0,
      lastAccessedAt: now,
      createdAt: now,
      sourceTurn: fact.sourceTurn,
      supersedes: fact.supersedes && fact.supersedes.length > 0 ? fact.supersedes : void 0,
      lifecycle: "active",
      ...fact.createdBy !== void 0 ? { createdBy: fact.createdBy } : {},
      ...fact.sourceType !== void 0 ? { sourceType: fact.sourceType } : {},
      ...fact.links !== void 0 && fact.links.length > 0 ? { links: fact.links } : {},
      ...fact.validFrom !== void 0 ? { validFrom: fact.validFrom } : {},
      ...fact.validTo !== void 0 ? { validTo: fact.validTo } : {},
      ...fact.confidence !== void 0 ? { confidence: fact.confidence } : {},
      ...fact.status !== void 0 ? { status: fact.status } : {},
      ...fact.sourcePointers !== void 0 && fact.sourcePointers.length > 0 ? { sourcePointers: fact.sourcePointers } : {},
      ...fact.modality !== void 0 ? { modality: fact.modality } : {},
      ...fact.mediaPointer !== void 0 ? { mediaPointer: fact.mediaPointer } : {},
      ...fact.subjectKey && fact.subjectKey.trim() ? { subjectKey: normalizeSubjectKey(fact.subjectKey) } : {},
      metadata: fact.metadata
    };
    const all = this.readAll();
    if (isUntrustedSource(record.sourceType)) {
      const supersedeIds = new Set(record.supersedes ?? []);
      const verdict = evaluateWriteGate({
        sourceType: record.sourceType,
        segment: record.segment,
        supersedeTargets: all.filter((r) => supersedeIds.has(r.memoryId) && sameOrigin(r.createdBy, record.createdBy)).map((r) => ({ memoryId: r.memoryId, sourceType: r.sourceType }))
      });
      if (!verdict.allow) {
        this.emit({
          at: now,
          kind: "blocked",
          memoryId: record.memoryId,
          segment: record.segment,
          ...record.sourceType !== void 0 ? { sourceType: record.sourceType } : {},
          reason: verdict.reason
        });
        throw new WriteGateError(verdict.reason);
      }
      const threats = scanForThreats(record.content, "strict");
      if (threats.length > 0) {
        this.emit({
          at: now,
          kind: "blocked",
          memoryId: record.memoryId,
          segment: record.segment,
          ...record.sourceType !== void 0 ? { sourceType: record.sourceType } : {},
          reason: `content matched threat pattern(s): ${threats.join(", ")}`
        });
        throw new MemoryThreatError(threats);
      }
    }
    const slotSuperseded = [];
    if (record.subjectKey && !record.supersedes) {
      const incoming = tokenSet(record.content);
      const priors = all.filter(
        (r) => r.lifecycle === "active" && r.memoryId !== record.memoryId && sameOrigin(r.createdBy, record.createdBy) && r.subjectKey === record.subjectKey
      );
      const restated = priors.find(
        (r) => jaccard(incoming, tokenSet(r.content)) >= DEDUP_SIMILARITY && !(isUntrustedSource(record.sourceType) && isTrustedTarget(r.sourceType))
      );
      if (restated) {
        inheritRicherMetadata(restated, record);
        restated.lastAccessedAt = now;
        restated.accessCount += 1;
        if (!restated.sourceTurn && record.sourceTurn) restated.sourceTurn = record.sourceTurn;
        this.writeAll(all);
        this.emit({ at: now, kind: "reinforced", memoryId: restated.memoryId, segment: restated.segment });
        return restated;
      }
      for (const r of priors) {
        if (isUntrustedSource(record.sourceType) && isTrustedTarget(r.sourceType)) continue;
        r.lifecycle = "archived";
        r.validTo = now;
        slotSuperseded.push(r.memoryId);
      }
      if (slotSuperseded.length > 0) {
        record.links = [
          ...record.links ?? [],
          ...slotSuperseded.flatMap((target) => [
            { kind: "contradicts", target },
            { kind: "transition", target }
          ])
        ];
      }
    }
    if (!record.supersedes && !record.subjectKey) {
      const incoming = tokenSet(record.content);
      const dup = all.find(
        (r) => r.lifecycle === "active" && sameOrigin(r.createdBy, record.createdBy) && jaccard(incoming, tokenSet(r.content)) >= DEDUP_SIMILARITY && // Write-gate blind-spot guard: dedup-merge reinforces the matched
        // fact (bumps importance + refreshes access). An UNTRUSTED source
        // (tool_output / retrieved_document / compaction) must not be able to
        // reinforce a TRUSTED, owner-authored fact through this back door —
        // that is an unsuperseded mutation the write-gate never sees. When the
        // incoming write is untrusted and the match is owner-authored/trusted,
        // skip the merge: the untrusted write falls through to a separate
        // record (subject to the gate's segment rule), leaving the owner fact
        // exactly as the operator left it.
        !(isUntrustedSource(record.sourceType) && isTrustedTarget(r.sourceType))
      );
      if (dup) {
        inheritRicherMetadata(dup, record);
        dup.lastAccessedAt = now;
        dup.accessCount += 1;
        if (!dup.sourceTurn && record.sourceTurn) dup.sourceTurn = record.sourceTurn;
        this.writeAll(all);
        this.emit({ at: now, kind: "reinforced", memoryId: dup.memoryId, segment: dup.segment });
        return dup;
      }
    }
    try {
      const emb = getDefaultEmbedder();
      const v = emb.embed([record.content]);
      if (!(v instanceof Promise) && Array.isArray(v[0]) && v[0].length === emb.dims) {
        record.embedding = v[0];
      }
    } catch {
    }
    if (record.supersedes) {
      const dead = new Set(record.supersedes);
      for (const r of all) {
        if (dead.has(r.memoryId) && r.lifecycle === "active" && sameOrigin(r.createdBy, record.createdBy)) {
          r.lifecycle = "archived";
          r.validTo = now;
        }
      }
    }
    all.push(record);
    this.writeAll(all);
    this.emit({
      at: now,
      kind: "created",
      memoryId: record.memoryId,
      segment: record.segment,
      ...record.sourceType !== void 0 ? { sourceType: record.sourceType } : {},
      ...(record.supersedes?.length ?? 0) + slotSuperseded.length > 0 ? { targets: [...record.supersedes ?? [], ...slotSuperseded] } : {}
    });
    return record;
  }
  /**
   * Extraction-idempotency probe (Fix 1). Given a candidate fact's content +
   * origin, return an ALREADY-STORED active same-origin record that the
   * candidate is merely a RESTATEMENT of — or `undefined` if it's genuinely new.
   * The post-turn distiller calls this BEFORE writing so it never re-creates a
   * fact the operator already taught (which would pile a subject-less `knowledge`
   * churn copy beside a rich `identity`/`preference` original and then let
   * consolidation archive the wrong one).
   *
   * Two match lanes (a candidate that hits EITHER is "already known"):
   *   1. SUBJECT-ANCHORED restatement — the existing record is SUBJECT-BEARING
   *      (the single-valued kind extraction must not churn a twin beside) and the
   *      candidate is a paraphrase of it: embedding cosine ≥ {@link IDEMPOTENT_COSINE_BAR}
   *      OR content Jaccard ≥ {@link IDEMPOTENT_JACCARD_BAR}. The loose bar is safe
   *      here BECAUSE it's gated on an existing subjectKey — an ADDITIVE fact (no
   *      subjectKey: pets, skills) can't trip it.
   *   2. NEAR-EXACT restatement of ANY existing fact — content Jaccard ≥
   *      {@link DEDUP_SIMILARITY} (the write-time dedup bar), so even an additive
   *      fact's verbatim re-extraction is recognised.
   *
   * Origin-isolated (only same-origin candidates) and embedder-guarded (a thrown/
   * async embedder degrades to the Jaccard lanes). The richest of several matches
   * is returned so a reinforcement lands on the best record.
   */
  findEquivalentActive(content, origin) {
    const text2 = content.trim();
    if (!text2) return void 0;
    const candidates = this.readAll().filter(
      (r) => r.lifecycle === "active" && sameOrigin(r.createdBy, origin)
    );
    if (candidates.length === 0) return void 0;
    const incomingTokens = tokenSet(text2);
    let incomingVec;
    try {
      const emb = getDefaultEmbedder();
      const v = emb.embed([text2]);
      if (!(v instanceof Promise) && Array.isArray(v[0]) && v[0].length === emb.dims) incomingVec = v[0];
    } catch {
    }
    const matches = [];
    for (const r of candidates) {
      const jac = jaccard(incomingTokens, tokenSet(r.content));
      if (jac >= DEDUP_SIMILARITY) {
        matches.push(r);
        continue;
      }
      if (r.subjectKey) {
        const cos = incomingVec && r.embedding && r.embedding.length === incomingVec.length ? cosine(incomingVec, r.embedding) : 0;
        if (cos >= IDEMPOTENT_COSINE_BAR || jac >= IDEMPOTENT_JACCARD_BAR) matches.push(r);
      }
    }
    if (matches.length === 0) return void 0;
    return matches.reduce((best, r) => compareRichness(r, best) > 0 ? r : best);
  }
  /**
   * Reinforce an existing record by id WITHOUT writing a new one (the
   * idempotency no-op's "optionally reinforce" path). Bumps access (recall-
   * reinforcement) and lifts confidence toward `minConfidence` if given — so a
   * re-seen fact gets MORE durable rather than spawning a churn duplicate. No-op
   * (undefined) if the id isn't an active record. Emits a `reinforced` event.
   */
  reinforce(memoryId, opts = {}) {
    const all = this.readAll();
    const rec = all.find((r) => r.memoryId === memoryId);
    if (!rec || rec.lifecycle !== "active") return void 0;
    const now = this.clock();
    rec.accessCount += 1;
    rec.lastAccessedAt = now;
    if (typeof opts.minConfidence === "number") {
      rec.confidence = Math.max(rec.confidence ?? 0, Math.min(1, Math.max(0, opts.minConfidence)));
    }
    this.writeAll(all);
    this.emit({ at: now, kind: "reinforced", memoryId, segment: rec.segment });
    return rec;
  }
  /**
   * Lexical recall over active facts — Okapi BM25 × `effectiveScore`
   * (decay + importance), origin-filtered (the shared scorer, scoring.ts).
   * The SAME scorer runs in fs (these `readAll` records) and convex mode
   * (the hydrated cache) ⇒ cross-mode parity by construction. Marks every
   * returned record accessed (recall reinforcement) unless `markAccessed:
   * false`. Returns at most `limit` hits (default 8), each with its score.
   */
  search(query, opts = {}) {
    const limit = opts.limit && opts.limit > 0 ? opts.limit : 8;
    const now = this.clock();
    const candidates = this.readAll().filter(
      (r) => r.lifecycle === "active" && (r.validTo === void 0 || r.validTo > now) && (opts.origin === void 0 || recordMatchesOriginFilter(r, opts.origin))
    );
    const top = bm25Score(candidates, query, now).slice(0, limit).map((s) => ({ ...s.record, score: s.score }));
    if (opts.markAccessed !== false && top.length > 0) {
      this.markAccessed(top.map((r) => r.memoryId));
    }
    return top;
  }
  /**
   * Hybrid recall (Tideline v2) — BM25 ⊕ vector (cosine over each record's
   * `embedding`), fused via `recallHybrid`. Embeddings are populated on write in
   * BOTH modes (see embed-on-write in `write`), so the vector lane contributes
   * IDENTICALLY in fs and convex mode — that's the cross-mode-parity guarantee.
   * Convex additionally ANN-serves the SAME vectors via the built-in
   * `by_embedding` vectorIndex at scale; this in-app cosine is the identical
   * ranking over the hydrated cache. A record misses the vector lane only if its
   * embedder threw on write (graceful BM25-only for that fact) or it predates
   * embed-on-write (legacy). Same active+origin candidate filter + reinforcement
   * semantics as `search`.
   */
  searchHybrid(query, opts = {}) {
    const limit = opts.limit && opts.limit > 0 ? opts.limit : 8;
    const now = this.clock();
    const candidates = this.readAll().filter(
      (r) => r.lifecycle === "active" && (r.validTo === void 0 || r.validTo > now) && // bi-temporal valid-time gate (see search)
      (opts.origin === void 0 || recordMatchesOriginFilter(r, opts.origin))
    );
    const top = recallHybrid(candidates, query, getDefaultEmbedder(), now, { limit }).map((f) => ({
      ...f.record,
      score: f.score
    }));
    if (opts.markAccessed !== false && top.length > 0) {
      this.markAccessed(top.map((r) => r.memoryId));
    }
    return top;
  }
  /**
   * The recall entry point live callers (auto-recall, recall_memory) use →
   * the HYBRID lane (BM25 ⊕ vector, {@link searchHybrid}) in BOTH modes, so
   * recall is identical fs ↔ convex (parity by construction, same as v1). The
   * lower-level `search` stays a pure-lexical primitive for callers that want
   * just BM25 (the eval floor, transparency).
   */
  recall(query, opts = {}) {
    return this.searchHybrid(query, opts);
  }
  /**
   * ASYNC hybrid recall — identical to {@link searchHybrid} but pre-embeds the
   * query via {@link recallHybridAsync}, so it works with a LEARNED (async)
   * embedder (OpenAI / local node-llama-cpp) as well as the sync HRR default
   * (awaiting a sync embed is a no-op). This is the path that delivers true-
   * synonymy recall when a learned embedder is selected; the sync `searchHybrid`/
   * `recall` stay for callers that aren't async (and degrade to BM25-primary
   * under a learned embedder — never crash). Same candidate filter + reinforcement.
   */
  async searchHybridAsync(query, opts = {}) {
    const limit = opts.limit && opts.limit > 0 ? opts.limit : 8;
    const now = this.clock();
    const candidates = this.readAll().filter(
      (r) => r.lifecycle === "active" && (r.validTo === void 0 || r.validTo > now) && (opts.origin === void 0 || recordMatchesOriginFilter(r, opts.origin))
    );
    const top = (await recallHybridAsync(candidates, query, getDefaultEmbedder(), now, { limit })).map((f) => ({
      ...f.record,
      score: f.score
    }));
    if (opts.markAccessed !== false && top.length > 0) {
      this.markAccessed(top.map((r) => r.memoryId));
    }
    return top;
  }
  /** Async recall entry point (the learned-embedder-aware {@link searchHybridAsync}). */
  async recallAsync(query, opts = {}) {
    return this.searchHybridAsync(query, opts);
  }
  /**
   * Recall transparency (Tideline Step 11) — like `search` but returns each
   * hit's {@link ScoreBreakdown} and does NOT reinforce decay (diagnostic +
   * passive). Same candidate filtering (active + origin) and the same scorer,
   * so the ranking matches `search` exactly — this just exposes the arithmetic
   * (bm25 × modulator) behind each rank, for "why did this surface?" tooling.
   */
  explainRecall(query, opts = {}) {
    const limit = opts.limit && opts.limit > 0 ? opts.limit : 8;
    const now = this.clock();
    const candidates = this.readAll().filter(
      (r) => r.lifecycle === "active" && (r.validTo === void 0 || r.validTo > now) && // bi-temporal valid-time gate (see search)
      (opts.origin === void 0 || recordMatchesOriginFilter(r, opts.origin))
    );
    return bm25Score(candidates, query, now, { breakdown: true }).slice(0, limit).map((s) => ({ ...s.record, score: s.score, breakdown: s.breakdown }));
  }
  /** Bump accessCount + lastAccessedAt for the given ids (recall reinforcement). */
  markAccessed(ids) {
    if (ids.length === 0) return;
    const set = new Set(ids);
    const all = this.readAll();
    let changed = false;
    const now = this.clock();
    for (const r of all) {
      if (set.has(r.memoryId)) {
        r.accessCount += 1;
        r.lastAccessedAt = now;
        changed = true;
      }
    }
    if (changed) this.writeAll(all);
  }
  /**
   * Write embeddings onto existing records by id (the re-embed pass's apply-step).
   * Used to fill vectors that embed-on-write SKIPPED because the selected embedder
   * is async (a learned model) — see {@link reembedPending}. Read-mutate-write,
   * so it flows through the convex write-through cache like any other mutation.
   */
  applyEmbeddings(updates) {
    if (updates.length === 0) return;
    const byId = new Map(updates.map((u) => [u.memoryId, u.embedding]));
    const all = this.readAll();
    const expectedDims = getDefaultEmbedder().dims;
    let changed = false;
    for (const r of all) {
      const e = byId.get(r.memoryId);
      if (e && e.length === expectedDims) {
        r.embedding = e;
        changed = true;
      }
    }
    if (changed) this.writeAll(all);
  }
  /**
   * Feedback-driven self-learning (the continual-learning loop's signal). `up`
   * nudges importance (+ confidence if set) UP and reinforces decay; `down`
   * nudges them DOWN — ASYMMETRIC (+0.05 / −0.10), so a
   * few bad recalls outweigh many lukewarm ones. Persisted + logged to the event
   * track (telemetry). Recall's trust/importance modulation then adapts, closing
   * the loop: recall → feedback → better recall. Returns the updated record.
   */
  applyFeedback(memoryId, signal) {
    const all = this.readAll();
    const rec = all.find((r) => r.memoryId === memoryId);
    if (!rec || rec.lifecycle !== "active") return void 0;
    const delta = signal === "up" ? 0.05 : -0.1;
    const clamp = (x) => Math.max(0, Math.min(1, x));
    rec.importance = clamp(rec.importance + delta);
    if (typeof rec.confidence === "number") rec.confidence = clamp(rec.confidence + delta);
    const now = this.clock();
    if (signal === "up") {
      rec.lastAccessedAt = now;
      rec.accessCount += 1;
    }
    this.writeAll(all);
    this.emit({ at: now, kind: "feedback", memoryId, segment: rec.segment, signal });
    return rec;
  }
  /**
   * Metadata-preservation on reconcile (Fix 2). Fold the RICHER metadata of the
   * `loserId` record into the `survivorId` record, in place — so a supersede /
   * consolidation merge that ARCHIVES the loser doesn't DROP its hard-won metadata
   * (a `subjectKey`, a more-specific segment, a higher importance/confidence). The
   * caller invokes this on the KEEPER right before archiving the duplicate, so the
   * survivor inherits from BOTH. No-op (false) if either id is missing or the
   * survivor isn't active. Persists + returns whether anything changed.
   *
   * This is the store-level counterpart to {@link inheritRicherMetadata} (which
   * the in-`write` reinforce paths call on their in-memory `all` array); the
   * consolidation passes (dream / LLM consolidation) call THIS because their
   * survivor lives in the store, not in a write-local array.
   */
  mergeMetadataInto(survivorId, loserId) {
    if (survivorId === loserId) return false;
    const all = this.readAll();
    const survivor = all.find((r) => r.memoryId === survivorId);
    const loser = all.find((r) => r.memoryId === loserId);
    if (!survivor || survivor.lifecycle !== "active" || !loser) return false;
    const before = JSON.stringify([
      survivor.subjectKey,
      survivor.segment,
      survivor.importance,
      survivor.confidence,
      survivor.accessCount,
      survivor.sourceTurn,
      survivor.validFrom,
      survivor.tier,
      survivor.decayRate,
      (survivor.links ?? []).map((l) => `${l.kind}|${l.target}`).sort()
    ]);
    inheritRicherMetadata(survivor, loser);
    const after = JSON.stringify([
      survivor.subjectKey,
      survivor.segment,
      survivor.importance,
      survivor.confidence,
      survivor.accessCount,
      survivor.sourceTurn,
      survivor.validFrom,
      survivor.tier,
      survivor.decayRate,
      (survivor.links ?? []).map((l) => `${l.kind}|${l.target}`).sort()
    ]);
    if (before === after) return false;
    this.writeAll(all);
    return true;
  }
  /**
   * Bi-temporally INVALIDATE a fact (Tideline v2, step 15) — close its valid
   * interval (`validTo = now`) + archive it, so recall drops it while HISTORY
   * keeps it (transaction time `createdAt` untouched). If `supersededBy` is
   * given, records a `contradicts` link on the superseder → the stale fact.
   * Persisted + logged. Returns the invalidated record, or `undefined` if it's
   * missing / already inactive.
   */
  invalidate(staleId, opts = {}) {
    const all = this.readAll();
    const stale = all.find((r) => r.memoryId === staleId);
    if (!stale || stale.lifecycle !== "active") return void 0;
    const now = opts.now ?? this.clock();
    stale.validTo = now;
    stale.lifecycle = "archived";
    if (opts.supersededBy) {
      const by = all.find((r) => r.memoryId === opts.supersededBy);
      if (by) {
        const kept = (by.links ?? []).filter(
          (l) => !((l.kind === "contradicts" || l.kind === "transition") && l.target === staleId)
        );
        const links = [
          ...kept,
          { kind: "contradicts", target: staleId },
          { kind: "transition", target: staleId }
        ];
        by.links = links;
      }
    }
    this.writeAll(all);
    this.emit({
      at: now,
      kind: "invalidated",
      memoryId: staleId,
      segment: stale.segment,
      ...opts.supersededBy ? { targets: [opts.supersededBy] } : {}
    });
    return stale;
  }
  /**
   * Step 19 — persist TYPED association edges between fact pairs (where the
   * relationship extractor's typed taxonomy AND the dream's synonymy/relatedness
   * edges land). Bidirectional, deduped per (kind,target), and capped per record per
   * kind (a hub-fact fan-out guard); only ACTIVE facts are linked. Each edge carries
   * the edge `kind` (default `relates` for legacy synonymy callers), an optional
   * `reason` (the model's justification, for explainable rendering) and `strength`.
   * Idempotent — re-running adds nothing already present (a later write may BACKFILL a
   * reason onto a prior reason-less edge of the same kind, which is not counted as a
   * new edge). Goes through readAll/writeAll like every mutation, so it is fs↔convex
   * parity by construction. Returns the number of NEW link entries written.
   *
   * Callers MUST pass only SAME-ORIGIN pairs (the dream computes synonymy per origin
   * bucket; the extractor pre-filters to one origin) — a cross-principal edge would
   * leak one peer's facts into another principal's graph-recall walk.
   *
   * The edge is written DIRECTED on the kind the caller supplies, and the REVERSE
   * endpoint records the INVERSE kind (causes↔caused_by, precedes↔follows,
   * enables/blocks→caused_by/blocks, part_of→part_of, …) so the graph reads
   * correctly from either note; symmetric kinds (co_constrains/contrasts_with/
   * same_topic/relates/relates_to/uses/works_on/located_at) mirror unchanged.
   */
  linkRelated(pairs, opts = {}) {
    if (pairs.length === 0) return 0;
    const maxPerRecord = opts.maxPerRecord && opts.maxPerRecord > 0 ? opts.maxPerRecord : 12;
    const all = this.readAll();
    const byId = new Map(all.map((r) => [r.memoryId, r]));
    let added = 0;
    const addOne = (fromId, toId, kind, reason, strength) => {
      if (fromId === toId) return;
      const rec = byId.get(fromId);
      if (!rec || rec.lifecycle !== "active") return;
      const links = rec.links ?? [];
      const existing = links.find((l) => l.kind === kind && l.target === toId);
      if (existing) {
        if (reason && !existing.reason) existing.reason = reason;
        if (strength !== void 0 && existing.strength === void 0) existing.strength = strength;
        return;
      }
      if (links.filter((l) => l.kind === kind).length >= maxPerRecord) return;
      rec.links = [
        ...links,
        { kind, target: toId, ...reason ? { reason } : {}, ...strength !== void 0 ? { strength } : {} }
      ];
      added++;
    };
    for (const { a, b, kind, reason, strength } of pairs) {
      if (byId.get(a)?.lifecycle !== "active" || byId.get(b)?.lifecycle !== "active") continue;
      const fwd = kind ?? "relates";
      addOne(a, b, fwd, reason, strength);
      addOne(b, a, inverseLinkKind(fwd), reason, strength);
    }
    if (added > 0) this.writeAll(all);
    return added;
  }
  /**
   * Lane B (Step 25) — REVERSE a retraction: re-activate an `archived` fact and
   * clear its valid-time bound so it surfaces again. The reversible counterpart
   * to {@link invalidate} — the operator's "restore" after an over-eager
   * retraction. Persisted + logged (a `reinforced` event: the fact is reasserted
   * as valid). Returns the record, or `undefined` if it's missing / not archived.
   */
  reactivate(id, opts = {}) {
    const all = this.readAll();
    const rec = all.find((r) => r.memoryId === id);
    if (!rec || rec.lifecycle !== "archived") return void 0;
    const supersededByActive = all.some(
      (r) => r.lifecycle === "active" && (r.links ?? []).some((l) => (l.kind === "contradicts" || l.kind === "transition") && l.target === id)
    );
    if (supersededByActive) return void 0;
    if (rec.subjectKey && all.some((r) => r.lifecycle === "active" && r.subjectKey === rec.subjectKey && sameOrigin(r.createdBy, rec.createdBy)))
      return void 0;
    rec.lifecycle = "active";
    rec.validTo = void 0;
    this.writeAll(all);
    this.emit({ at: opts.now ?? this.clock(), kind: "reinforced", memoryId: id, segment: rec.segment });
    return rec;
  }
  /**
   * Records whose VAULT note must be preserved: every ACTIVE fact PLUS any ARCHIVED
   * fact that is still RESTORABLE — i.e. retracted/decayed, NOT superseded/consolidated
   * by an active successor (same edge test as {@link reactivate}). The vault prune
   * deletes notes outside this set, so a reversibly-retracted fact — and the operator's
   * hand-pinned edits on it — survives a re-render; only a hard-purged fact's note
   * (gone from the store entirely) is removed.
   */
  listForVault(origin) {
    const all = this.readAll().filter((r) => origin === void 0 || recordMatchesOriginFilter(r, origin));
    const supersededByActive = new Set(
      all.filter((r) => r.lifecycle === "active").flatMap((r) => (r.links ?? []).filter((l) => l.kind === "contradicts" || l.kind === "transition").map((l) => l.target))
    );
    return all.filter((r) => r.lifecycle === "active" || r.lifecycle === "archived" && !supersededByActive.has(r.memoryId));
  }
  /**
   * Dream/curator lane (Step 22) — REVERSIBLE: patch cognition fields on an
   * ACTIVE record, used to PROMOTE a repeatedly-corrected belief to a confirmed
   * preference. Returns the PRIOR {confidence,status,importance} (also recorded
   * in the "confirmed" event) so a dream pass can be undone — Lane A is
   * reversible by design. No-op (undefined) if `memoryId` isn't an active record.
   */
  promote(memoryId, patch, opts = {}) {
    const clamp01 = (x) => Math.max(0, Math.min(1, x));
    const all = this.readAll();
    const rec = all.find((r) => r.memoryId === memoryId);
    if (!rec || rec.lifecycle !== "active") return void 0;
    const prior = {
      ...rec.confidence !== void 0 ? { confidence: rec.confidence } : {},
      ...rec.status !== void 0 ? { status: rec.status } : {},
      importance: rec.importance
    };
    if (patch.status !== void 0) rec.status = patch.status;
    if (patch.confidence !== void 0) rec.confidence = clamp01(patch.confidence);
    if (patch.importance !== void 0) rec.importance = clamp01(patch.importance);
    this.writeAll(all);
    this.emit({ at: opts.now ?? this.clock(), kind: "confirmed", memoryId, segment: rec.segment, prior });
    return prior;
  }
  /**
   * Dream/curator lane (Step 22): archive low-value decayed facts, emitting an
   * "evicted" event per fact. Returns the ids actually archived (skips already
   * non-active ones). Distinct from decay GC's `setLifecycle` in that it logs.
   */
  evict(ids, opts = {}) {
    if (ids.length === 0) return [];
    const now = opts.now ?? this.clock();
    const set = new Set(ids);
    const all = this.readAll();
    const evicted = [];
    for (const r of all) {
      if (set.has(r.memoryId) && r.lifecycle === "active") {
        r.lifecycle = "archived";
        r.validTo = r.validTo ?? now;
        evicted.push(r.memoryId);
      }
    }
    if (evicted.length === 0) return [];
    this.writeAll(all);
    for (const id of evicted) {
      const seg = all.find((r) => r.memoryId === id)?.segment;
      this.emit({ at: now, kind: "evicted", memoryId: id, ...seg ? { segment: seg } : {} });
    }
    return evicted;
  }
  /**
   * Governance (Step 24) — HARD-delete records (crypto-shred: the sealed
   * content is REMOVED, not archived, so it's unrecoverable even with the key).
   * Returns the ids actually removed. Filesystem rewrites the JSONL without
   * them; convex mode realises the deletion through the write-through diff.
   * Distinct from evict/setLifecycle, which only flip lifecycle.
   */
  purge(ids) {
    if (ids.length === 0) return [];
    const set = new Set(ids);
    const all = this.readAll();
    const removed = all.filter((r) => set.has(r.memoryId)).map((r) => r.memoryId);
    if (removed.length === 0) return [];
    this.writeAll(all.filter((r) => !set.has(r.memoryId)));
    return removed;
  }
  /**
   * The DISTINCT origins present in the active store (owner + each channel
   * peer). The per-origin fan-out seam: the curator/dream run one pass per
   * origin so a cross-fact operation never mixes principals. Deduped by
   * {@link originBucketKey}; owner first, then channels in stable key order.
   */
  distinctOrigins() {
    const byKey = /* @__PURE__ */ new Map();
    for (const r of this.readAll()) {
      if (r.lifecycle !== "active") continue;
      const key = originBucketKey(r);
      if (!byKey.has(key)) byKey.set(key, resolveRecordOrigin(r.createdBy));
    }
    return [...byKey.entries()].sort((a, b) => a[0] === "owner" ? -1 : b[0] === "owner" ? 1 : a[0].localeCompare(b[0])).map(([, o]) => o);
  }
  /** Set the lifecycle of specific records (used by decay GC). */
  setLifecycle(ids, lifecycle) {
    if (ids.length === 0) return;
    const set = new Set(ids);
    const all = this.readAll();
    let changed = false;
    for (const r of all) {
      if (set.has(r.memoryId) && r.lifecycle !== lifecycle) {
        r.lifecycle = lifecycle;
        changed = true;
      }
    }
    if (changed) this.writeAll(all);
  }
  /** Atomic whole-file rewrite (tmp + rename) so a crash can't corrupt the store. */
  writeAll(records) {
    const backend = this.backend();
    if (backend) {
      backend.writeAll(records);
      return;
    }
    fs2.mkdirSync(path2.dirname(this.file), { recursive: true });
    if (this.lastReadHadUnparseable) {
      try {
        const bak = `${this.file}.bak-${process.pid}-${Math.round(this.clock())}`;
        fs2.copyFileSync(this.file, bak);
        this.hostPorts.logger?.warn("facts.jsonl had unparseable line(s); snapshotted before overwrite so nothing is silently dropped", { bak });
      } catch {
      }
      this.lastReadHadUnparseable = false;
    }
    const body = records.map((r) => JSON.stringify(r)).join("\n") + (records.length > 0 ? "\n" : "");
    const tmp = `${this.file}.tmp-${process.pid}-${Date.now()}`;
    fs2.writeFileSync(tmp, body, "utf8");
    fs2.renameSync(tmp, this.file);
  }
};

// ../brigade/src/tideline/api/tideline.ts
var SYSTEM_CLOCK = { now: () => Date.now() };
var NO_THREAT_SCAN = { scan: () => [] };
var Tideline = class _Tideline {
  constructor(store, clock, threatScan, embedder, llm) {
    this.store = store;
    this.clock = clock;
    this.threatScan = threatScan;
    this.embedder = embedder;
    this.llm = llm;
  }
  /** Await an asynchronous host's initial snapshot (filesystem is immediately ready). */
  async ready() {
    await this.store.ready?.();
  }
  /** Await queued fact persistence; reject when a host cannot make writes durable. */
  async flush() {
    await this.store.flush?.();
  }
  /** Open Tideline for a workspace directory (the common case). The optional
   *  adapters default to: system clock, no recall-time threat scan (markup-escape
   *  only), no facade embedder override, no LLM, filesystem persistence. */
  static open(workspaceDir, adapters = {}) {
    const Factory = this === _Tideline || typeof this === "function" && this.prototype instanceof _Tideline ? this : _Tideline;
    return new Factory(
      new FactStore(workspaceDir, { hostPorts: adapters.hostPorts }),
      adapters.clock ?? SYSTEM_CLOCK,
      adapters.threatScan ?? NO_THREAT_SCAN,
      adapters.embedder,
      adapters.llm
    );
  }
  /** Wrap an existing {@link StorageAdapter} (DI / shared store / a swapped backend). */
  static over(store, adapters = {}) {
    const Factory = this === _Tideline || typeof this === "function" && this.prototype instanceof _Tideline ? this : _Tideline;
    return new Factory(
      store,
      adapters.clock ?? SYSTEM_CLOCK,
      adapters.threatScan ?? NO_THREAT_SCAN,
      adapters.embedder,
      adapters.llm
    );
  }
  /** Whether a learned embedder is WIRED into the facade — reflects wiring only,
   *  not recall behavior. In v1 recall is always served by the bundled HRR vector
   *  lane regardless of this flag; a wired embedder is recorded but unused. */
  get hasVectors() {
    return this.embedder !== void 0;
  }
  // ── add ──
  /** Persist a fact (write-gate + dedup applied). Throws `WriteGateError` on a
   *  blocked poisoning write. */
  add(fact) {
    return this.store.write(fact);
  }
  remember(fact) {
    return this.add(fact);
  }
  // ── search ──
  /** Ranked recall over active, origin-matching facts (reinforces decay unless
   *  `markAccessed: false`). */
  search(query, opts = {}) {
    return this.store.search(query, opts);
  }
  /** The recall entry point callers should prefer — HYBRID (BM25 ⊕ vector) when
   *  the backend offers it, else pure-lexical `search`. `search` stays a
   *  lexical-only primitive (the eval floor / transparency). */
  recall(query, opts = {}) {
    return this.store.searchHybrid ? this.store.searchHybrid(query, opts) : this.store.search(query, opts);
  }
  /** Passive recall transparency — same ranking as `search`, each hit with its
   *  score breakdown, and NO decay reinforcement. */
  explain(query, opts = {}) {
    return this.store.explainRecall(query, opts);
  }
  // ── context ──
  /** A budgeted, origin-scoped recall block ready to drop into a prompt — the
   *  facts joined into a capped string (relevance-ranked (decay-weighted),
   *  highest first, truncated to `maxChars`, default 1200). Passive (no decay
   *  reinforcement). Content-safety: when a {@link ThreatScanAdapter} is wired,
   *  any fact whose text matches an injection/exfil/C2 pattern is replaced by a
   *  non-actionable `[BLOCKED]` placeholder (the SAME recall-time net the
   *  in-process auto-recall loop applies); `<`/`>` in the surfaced fact text are
   *  ALSO defanged so a fact can't inject markup (defense-in-depth, always on).
   *  Returns `undefined` when nothing relevant is stored. */
  context(query, opts = {}) {
    const { maxChars = 1200, ...recallOpts } = opts;
    const recallOptsPassive = { ...recallOpts, markAccessed: false };
    const hits = this.store.searchHybrid ? this.store.searchHybrid(query, recallOptsPassive) : this.store.search(query, recallOptsPassive);
    if (hits.length === 0) return void 0;
    const lines = [];
    let used = 0;
    for (const h of hits) {
      const threats = this.threatScan.scan(h.content);
      const safe = threats.length > 0 ? `[BLOCKED] this ${h.segment} fact matched threat pattern(s): ${threats.join(", ")} \u2014 omitted from context` : h.content.replace(/</g, "&lt;").replace(/>/g, "&gt;");
      const line = `- [${h.segment}] ${safe}`;
      if (used + line.length + 1 > maxChars && lines.length > 0) break;
      lines.push(line);
      used += line.length + 1;
    }
    return lines.join("\n");
  }
  /** Apply the wired threat-scan to a piece of content (empty array = clean).
   *  Exposes the injected {@link ThreatScanAdapter} so recall surfaces built on
   *  this facade (e.g. the MCP `memory_search` tool, which returns per-hit results
   *  rather than a `context()` block) enforce the SAME recall-time content-safety
   *  net `context()` applies — without importing a concrete scanner here (the
   *  facade stays Brigade-import-free + OSS-extractable). */
  scanThreats(content) {
    return this.threatScan.scan(content);
  }
  // ── feedback ──
  /** Record relevance feedback on a recalled fact. Asymmetric importance/
   *  confidence update (`up` +0.05 / `down` −0.10), persisted + logged. Recall's
   *  trust/importance modulation then adapts, closing the loop: recall →
   *  feedback → better recall. */
  feedback(memoryId, signal) {
    this.store.applyFeedback(memoryId, signal);
  }
  // ── purge ──
  /** SOFT purge (reversible): lifecycle → `pruned` (excluded from recall, record
   *  retained). This is the facade's gentle retract. For the DESTRUCTIVE Step-24
   *  crypto-shred (hard-delete + cascade along `sourcePointers`), use
   *  `governance.purge` / `FactStore.purge` — a different, irreversible verb. */
  purge(memoryIds) {
    this.store.setLifecycle(memoryIds, "pruned");
  }
  // ── inspect ──
  /** Fact-level diagnostic: a single record with its outbound {@link MemoryLink}
   *  edges and inbound backlinks (the graph neighbourhood). `undefined` if the
   *  id isn't found. */
  inspect(memoryId) {
    const all = this.store.readAll();
    const record = all.find((r) => r.memoryId === memoryId);
    if (!record) return void 0;
    return { record, links: linksFrom(record), backlinks: backlinksTo(all, memoryId) };
  }
  // ── export ──
  /** Full store dump (all lifecycles) for backup/portability. */
  export() {
    return this.store.readAll();
  }
  /** List active (or `filter.lifecycle`) facts, most-recent-first. */
  list(filter = {}) {
    return this.store.list(filter);
  }
};

// ../brigade/src/tideline/transports/mcp/memory-mcp-server.ts
import * as readline from "node:readline";

// ../brigade/src/system-prompt/sanitize.ts
var INVISIBLE_PATTERN = new RegExp(
  "[\\p{Cc}\\p{Cf}\\u2028\\u2029]",
  "gu"
);
function sanitizeForPromptLiteral(value) {
  if (value === void 0 || value === null) return "";
  if (typeof value !== "string") return "";
  return value.replace(INVISIBLE_PATTERN, "");
}
function wrapUntrustedDataBlock(args) {
  const limit = args.maxChars ?? 1e4;
  const sanitised = sanitizeForPromptLiteral(args.text);
  const clipped = sanitised.length > limit ? sanitised.slice(0, limit) + `
...[truncated ${sanitised.length - limit} chars]` : sanitised;
  const escaped = clipped.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return `<untrusted-${args.label}>
${escaped}
</untrusted-${args.label}>`;
}

// ../brigade/src/tideline/transports/mcp/memory-mcp.ts
var text = (t, isError = false) => ({ content: [{ type: "text", text: t }], ...isError ? { isError } : {} });
var escapeMarkup = (s) => s.replace(/</g, "&lt;").replace(/>/g, "&gt;");
function memoryMcpTools(tide2, opts) {
  const origin = opts.origin;
  const writeSourceType = opts.sourceType ?? (origin.kind === "owner" ? void 0 : "retrieved_document");
  const renderHits = (hits) => wrapUntrustedDataBlock({
    label: "memory",
    text: hits.map((h) => {
      const threats = tide2.scanThreats(h.content);
      return threats.length > 0 ? `- [${h.segment}] [BLOCKED] this fact matched threat pattern(s): ${threats.join(", ")} \u2014 omitted` : `- [${h.segment}] ${escapeMarkup(sanitizeForPromptLiteral(h.content))}`;
    }).join("\n")
  });
  return [
    {
      name: "memory_add",
      description: "Store a fact in long-term memory (subject to the write-gate + your principal's trust).",
      inputSchema: {
        type: "object",
        properties: {
          content: { type: "string", description: "the fact to remember" },
          segment: { type: "string", enum: [...MEMORY_SEGMENTS], description: "kind of fact (default: knowledge)" }
        },
        required: ["content"]
      },
      handler: (args) => {
        const content = String(args.content ?? "").trim();
        if (!content) return text("content is required", true);
        const seg = typeof args.segment === "string" && MEMORY_SEGMENTS.includes(args.segment) ? args.segment : "knowledge";
        try {
          const rec = tide2.add({
            content,
            segment: seg,
            createdBy: origin,
            ...writeSourceType ? { sourceType: writeSourceType } : {}
          });
          return text(`stored ${rec.memoryId}`);
        } catch (e) {
          return text(`blocked: ${e.message}`, true);
        }
      }
    },
    {
      name: "memory_search",
      description: "Search YOUR long-term memory; returns ranked facts (scoped to your principal).",
      inputSchema: {
        type: "object",
        properties: { query: { type: "string" }, limit: { type: "number", description: "max results (default 8)" } },
        required: ["query"]
      },
      handler: (args) => {
        const query = String(args.query ?? "").trim();
        if (!query) return text("query is required", true);
        const limit = typeof args.limit === "number" && args.limit > 0 ? args.limit : 8;
        try {
          const hits = tide2.recall(query, { limit, markAccessed: false, origin });
          if (hits.length === 0) return text("(no matches)");
          return text(renderHits(hits));
        } catch (e) {
          return text(`error: ${e.message}`, true);
        }
      }
    },
    {
      name: "memory_context",
      description: "A budgeted memory block for a query, scoped to your principal, ready to drop into a prompt.",
      inputSchema: {
        type: "object",
        properties: { query: { type: "string" }, maxChars: { type: "number", description: "budget cap (default 1200)" } },
        required: ["query"]
      },
      handler: (args) => {
        const query = String(args.query ?? "").trim();
        if (!query) return text("query is required", true);
        const maxChars = typeof args.maxChars === "number" && args.maxChars > 0 ? args.maxChars : 1200;
        try {
          const block = tide2.context(query, { maxChars, origin });
          return text(block ? wrapUntrustedDataBlock({ label: "memory", text: block }) : "(nothing relevant)");
        } catch (e) {
          return text(`error: ${e.message}`, true);
        }
      }
    }
  ];
}

// ../brigade/src/tideline/transports/mcp/memory-mcp-server.ts
var MCP_PROTOCOL_VERSION = "2024-11-05";
function createMemoryMcpServer(tide2, opts) {
  const tools = memoryMcpTools(tide2, { origin: opts.origin });
  const byName = new Map(tools.map((t) => [t.name, t]));
  const handle = (req) => {
    const rawId = req?.id;
    const id = typeof rawId === "string" || typeof rawId === "number" ? rawId : null;
    const method = req?.method;
    if (typeof method !== "string") {
      return rawId !== void 0 ? { jsonrpc: "2.0", id, error: { code: -32600, message: "Invalid Request: missing or invalid 'method'" } } : null;
    }
    const isNotification = rawId === void 0 || method.startsWith("notifications/");
    const ok = (result) => isNotification ? null : { jsonrpc: "2.0", id, result };
    const fail = (code, message) => isNotification ? null : { jsonrpc: "2.0", id, error: { code, message } };
    switch (method) {
      case "initialize":
        return ok({
          protocolVersion: MCP_PROTOCOL_VERSION,
          capabilities: { tools: {} },
          serverInfo: { name: opts.serverName ?? "brigade-memory", version: opts.serverVersion ?? "1.0.0" }
        });
      case "notifications/initialized":
        return null;
      case "ping":
        return ok({});
      case "tools/list":
        return ok({ tools: tools.map((t) => ({ name: t.name, description: t.description, inputSchema: t.inputSchema })) });
      case "tools/call": {
        const p = req.params;
        const tool = p?.name ? byName.get(p.name) : void 0;
        if (!tool) return fail(-32602, `unknown tool: ${p?.name ?? "(none)"}`);
        try {
          return ok(tool.handler(p?.arguments ?? {}));
        } catch (e) {
          return fail(-32603, `tool error: ${e.message}`);
        }
      }
      default:
        return fail(-32601, `method not found: ${method}`);
    }
  };
  const handleAsync = async (req) => {
    if (req?.method !== "tools/call") return handle(req);
    try {
      await tide2.ready();
      const response = handle(req);
      await tide2.flush();
      return response;
    } catch (error) {
      if (req.id === void 0) return null;
      const id = typeof req.id === "string" || typeof req.id === "number" ? req.id : null;
      return {
        jsonrpc: "2.0",
        id,
        error: { code: -32603, message: `memory backend error: ${error instanceof Error ? error.message : String(error)}` }
      };
    }
  };
  return { handle, handleAsync, toolCount: tools.length };
}
function runMemoryMcpStdio(server2, io = {}) {
  const input = io.input ?? process.stdin;
  const output = io.output ?? process.stdout;
  return new Promise((resolve) => {
    let pending = Promise.resolve();
    const finish = () => {
      void pending.then(() => resolve());
    };
    const safeWrite = (res) => {
      try {
        output.write(`${JSON.stringify(res)}
`);
      } catch {
      }
    };
    input.on("error", finish);
    const rl = readline.createInterface({ input, crlfDelay: Number.POSITIVE_INFINITY });
    rl.on("error", finish);
    rl.on("line", (line) => {
      const trimmed = line.trim();
      if (!trimmed) return;
      let req;
      try {
        req = JSON.parse(trimmed);
      } catch {
        return;
      }
      pending = pending.then(async () => {
        try {
          const res = await (server2.handleAsync?.(req) ?? server2.handle(req));
          if (res) safeWrite(res);
        } catch {
        }
      });
    });
    output.on("error", () => {
    });
    rl.on("close", finish);
  });
}

// tools/brigade_mcp_server.ts
var memoryDir = process.env.BRIGADE_MEMORY_DIR || path3.join(os.homedir(), ".brigade", "memory");
if (!fs3.existsSync(memoryDir)) {
  fs3.mkdirSync(memoryDir, { recursive: true });
}
var tide = Tideline.open(memoryDir);
if (tide.ready) {
  await tide.ready();
}
var server = createMemoryMcpServer(tide, {
  origin: { kind: "owner" },
  serverName: "brigade-tideline",
  serverVersion: "1.39.0"
});
process.stderr.write(`[Brigade v1.39.0] Tideline memory server running over stdio at ${memoryDir}
`);
await runMemoryMcpStdio(server);
