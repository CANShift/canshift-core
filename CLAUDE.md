# canshift-core — Project Rules

Shared TypeScript contracts for the CANShift ecosystem (org: github.com/CANShift). Published to npm as `@canshift/core`.

## Commands

- `npm run build` — tsc → dist/ (consumers resolve dist only)
- `npm test` — Vitest; `npm run typecheck` (src **and** `__tests__`); `npm run lint`; `npm run format:check`

## Rules

- Pure TypeScript, Zod is the only runtime dependency. No Node/browser/RN APIs.
- Every `DashboardConfig` shape change: bump `CURRENT_SCHEMA_VERSION` + paired migration in `src/migrations/registry.ts` + test, same PR.
- Firmware mirror: `config_types.h` in CANShift/canshift-firmware must match; that repo pins the schema version in `core-schema-version.txt` — remind the PR author to update both.
- Publishing: tag `vX.Y.Z` → the publish workflow ships to npm with provenance. npm version is independent from `CURRENT_SCHEMA_VERSION`.
- Consumers (tuner, mobile) install from npm — after a publish they bump their dependency.

## Code shape

Non-negotiable. Reviewed on every PR, ahead of feature count.

- Guard clauses first. Nesting depth 2 max — a third level means extract a named function.
- One `try` per function. Never a `try` inside a `try`, a `catch` or a `finally`. No empty catch, no catch that only logs, no wrapper that rethrows unchanged.
- Errors are typed — an error class or a discriminated Result union. No stringly-typed catch funnel, no `err.message` sniffing, no raw internal message reaching a consumer.
- Chained `else if` and `kind === 'a' ? … : kind === 'b' ? …` are a union that lost its type. Use a `Record<Kind, …>` lookup table.
- ~30 lines per function, ~300 per file. Past that, split before adding.
- Third copy gets extracted. Cross-file boilerplate (JSON envelope parsing, key mapping, hex/colour conversion, error→string) lives in one shared helper under `src/wire/` or `src/colors/` and is imported, never re-typed.
- An `index.ts` may only re-export. An `index.ts` containing a declaration is a bug.
- A constant must be read by the code it names. An exported constant nothing reads — or that duplicates a number the function hardcodes — is a bug, not documentation.
- CI gates must cover every file extension in the repo. A green check that silently skipped files is a broken gate.

## Workflow

- Branch `type/short-description`; Conventional Commits, subject only.
- PR via `gh pr create`; main is protected: required checks `lint`, `test`, `build`; **rebase and merge only** (`gh pr merge --rebase`).
- Firmware parity/fixture test suites skip when no sibling firmware checkout exists.
