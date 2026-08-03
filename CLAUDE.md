# canshift-core — Project Rules

Shared TypeScript contracts for the CANShift ecosystem (org: github.com/CANShift). Published to npm as `@canshift/core`.

## Commands

- `npm run build` — tsc → dist/ (consumers resolve dist only)
- `npm test` — Jest; `npm run lint`; `npm run format:check`

## Rules

- Pure TypeScript, Zod is the only runtime dependency. No Node/browser/RN APIs.
- Every `DashboardConfig` shape change: bump `CURRENT_SCHEMA_VERSION` + paired migration in `src/migrations/registry.ts` + test, same PR.
- Firmware mirror: `config_types.h` in CANShift/canshift-firmware must match; that repo pins the schema version in `core-schema-version.txt` — remind the PR author to update both.
- Publishing: tag `vX.Y.Z` → the publish workflow ships to npm with provenance. npm version is independent from `CURRENT_SCHEMA_VERSION`.
- Consumers (tuner, mobile) install from npm — after a publish they bump their dependency.

## Workflow

- Branch `type/short-description`; Conventional Commits, subject only.
- PR via `gh pr create`; main is protected: required checks `lint`, `test`, `build`; **rebase and merge only** (`gh pr merge --rebase`).
- Firmware parity/fixture test suites skip when no sibling firmware checkout exists.
