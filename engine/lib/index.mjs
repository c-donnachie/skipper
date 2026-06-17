// Library entrypoint (ADR-0017/0023): lets external consumers `import { … } from 'skipper-memory'`.
// Pure re-export barrel, no side effects. Deliberately omits mcp/build/openDb/applySchema/synthesize
// (process/CLI/replaced surfaces) — those are reached via subpaths or are internal.
export { parseRepo, personId } from './parse.mjs';
export { ingestGit } from './gitingest.mjs';
export { detectMismatches } from './mismatch.mjs';
export { ask, contextFor, relate, guard, readSection } from './retrieve.mjs';
export { render, renderBrief } from './render.mjs';
export { verifyCitations } from './verify.mjs';
export { runGold } from './eval.mjs';
export { resolveSubsystem, governingAdrs, freshnessFor, docGitStats, pluginVersion, STALE_CODE_COMMITS } from './subsystem.mjs';
export { SCHEMA_VERSION } from './db.mjs';
