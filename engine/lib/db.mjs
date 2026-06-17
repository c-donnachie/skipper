// SQLite access via Node's built-in node:sqlite (zero npm/native deps; no DB server).
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));

// Bump when schema.sql changes. Stored in meta; the seam a later vector phase migrates against.
export const SCHEMA_VERSION = 1;

export function openDb(path) {
  return new DatabaseSync(path);
}

export function applySchema(db) {
  db.exec(readFileSync(join(HERE, 'schema.sql'), 'utf8'));
}
