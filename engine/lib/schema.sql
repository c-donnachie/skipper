-- Skipper Memory graph schema — Phase B / plan-0004 M0.
-- Two-table typed DIRECTED graph (nodes + edges) + advisory mismatches + meta.
-- NO vector table (deferred; meta.schema_version is the non-destructive seam for it later).

PRAGMA user_version = 1;

-- One row per thing in the project's memory.
CREATE TABLE IF NOT EXISTS nodes (
  id                 TEXT PRIMARY KEY,   -- type-prefixed: ADR:0009, PRD:0004, MODULE:hooks/suggest.sh, PERSON:cristian-donnachie
  type               TEXT NOT NULL,      -- adr|prd|plan|arch|commit|module|person
  title              TEXT,
  path               TEXT,
  number             INTEGER,            -- 4-digit doc number where applicable
  status             TEXT,               -- e.g. Accepted, Proposed
  version_tag        TEXT,               -- split from "Accepted (v0.4.0)" -> v0.4.0
  date               TEXT,
  self_freshness     TEXT,               -- doc-declared "Last updated: ..." (NULL if absent)
  reflects_version   TEXT,               -- doc-declared "Reflects vX" (NULL if absent)
  git_last_sha       TEXT,
  git_last_ts        TEXT,
  code_commits_since INTEGER,
  h1_line            INTEGER
);

-- One row per TYPED, DIRECTED edge, with provenance (refinement #1).
CREATE TABLE IF NOT EXISTS edges (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  from_id    TEXT NOT NULL,
  to_id      TEXT NOT NULL,
  type       TEXT NOT NULL,                       -- references|implements|originated-from|supersedes|superseded-by|touches|authored-by|decided-by|doc-mediated-via
  edge_class TEXT NOT NULL DEFAULT 'declared',    -- declared|prose|derived|synthetic
  src_file   TEXT,                                -- WHERE the edge is declared (provenance)
  src_line   INTEGER,
  raw_text   TEXT,
  resolved   INTEGER NOT NULL DEFAULT 1           -- 0 if to_id target is missing
);
CREATE INDEX IF NOT EXISTS idx_edges_from ON edges(from_id, type);
CREATE INDEX IF NOT EXISTS idx_edges_to   ON edges(to_id, type);

-- Count/scope conflicts between an ADR and its mapped arch doc (refinement #7).
CREATE TABLE IF NOT EXISTS mismatches (
  id     INTEGER PRIMARY KEY AUTOINCREMENT,
  node_a TEXT, src_a TEXT, line_a INTEGER, claim_a TEXT,
  node_b TEXT, src_b TEXT, line_b INTEGER, claim_b TEXT,
  kind   TEXT,                                    -- count|scope
  note   TEXT
);

-- Bookkeeping: schema_version (vector-migration seam), head_sha (build provenance).
CREATE TABLE IF NOT EXISTS meta (
  key   TEXT PRIMARY KEY,
  value TEXT
);
