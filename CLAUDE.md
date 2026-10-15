# canshift-core — Project Rules

Shared TypeScript contracts for the CANShift ecosystem (org: github.com/CANShift). Published to npm as `@canshift/core`.

## Commands

- `npm run build` — tsc → dist/ (consumers resolve dist only)
- `npm test` — Vitest; `npm run typecheck` (src **and** `__tests__`); `npm run lint`; `npm run format:check`

## Rules

- Pure TypeScript, Zod is the only runtime dependency. No Node/browser/RN APIs.
- Every `DashboardConfig` shape change bumps `CURRENT_SCHEMA_VERSION`. A removal, rename or rewrite also gets a step in `src/migrations/registry.ts` + test, same PR; an additive optional field needs no step. Configs older than `MIGRATION_FLOOR_VERSION` (1.24.0) are refused, not migrated.
- Publishing: tag `vX.Y.Z` → the publish workflow ships to npm with provenance. npm version is independent from `CURRENT_SCHEMA_VERSION`.
- Before claiming a `CURRENT_SCHEMA_VERSION`, check that no closed or abandoned PR already reserved it. Versions have been claimed twice by work that never landed.

## A core change is never done in core

This package is a contract, not a library. Every change has consumers that go stale the moment it lands, so **a core PR ships with its firmware and tuner PRs open beside it** — not with a follow-up issue. A PR that changes core alone is half a change.

| What changed here                  | canshift-firmware owes                                                 | canshift-tuner owes                       |
| ---------------------------------- | ---------------------------------------------------------------------- | ----------------------------------------- |
| Any `DashboardConfig` shape change | `core-schema-version.txt` and the bundled `data/config/dashboard.json` | —                                         |
| A field the firmware reads         | the mirror in `src/config/config_types.h`                              | —                                         |
| A field the dash renders           | the render path, or it is a control that lies                          | the editor surface and the canvas preview |
| A field removed                    | the pin; the mirror too if it was ever there                           | delete the control in the same breath     |
| A published npm version            | —                                                                      | bump the `@canshift/core` dependency      |

canshift-mobile follows the same rule when it consumes the field. It is deferred, so say so explicitly rather than leaving the gap unstated.

**The merge order is forced by CI, not by preference.** The `firmware-parity` job checks out canshift-firmware's _default branch_ and asserts its bundled config is pinned at `CURRENT_SCHEMA_VERSION`. A core PR that bumps the version therefore **cannot go green until the firmware pin is already on firmware `main`**. The order is: firmware pin → this PR → tag `vX.Y.Z` → tuner bumps its dependency. Writing it the other way round deadlocks, and `firmware-parity` failing on a version bump is that mistake, not a broken job.

State the consumer PRs and their order in the description of every core PR. If a consumer is genuinely out of scope, name it and say why — an unstated gap reads as an oversight.

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
- PR via `gh pr create`; main is protected: required checks `lint`, `test`, `build`, `firmware-parity`, all in `ci.yml` behind the `ci-success` gate; **rebase and merge only** (`gh pr merge --rebase`).
- Firmware parity/fixture test suites skip when no sibling firmware checkout exists.
