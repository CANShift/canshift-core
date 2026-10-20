# canshift-core

`canshift-core` — pure TypeScript contract layer for the CANShift ecosystem.

📖 **[Documentation](docs/README.md)** — the config contract and the wire
protocol versioning rule.

---

## Purpose

`canshift-core` is the single source of truth for:

- **Configuration types** — `DashboardConfig`, `Widget` discriminated union, `PageConfig`, `TopBarConfig`, `ButtonAction`, `DeviceConfig`, `SignalConfig`, `InputBindingsConfig`
- **Validation** — runtime checks on dashboard, signal, and device configs
- **Schema migrations** — versioned chain that brings older configs forward to `CURRENT_SCHEMA_VERSION`
- **Design tokens & widget metrics** — `DARK_TOKENS` palette + `tokensToCssVars` consumed by the Tuner (`canshift-tuner/`, generated `src/styles/tokens.generated.css`), plus `widget-metrics.ts` (shared gauge/label/shift-light geometry mirrored by the firmware renderer) and `theme-presets.ts` (the 8 built-in dash themes)
- **Wire-format schemas** — `DeviceConfigWireSchema`, `InputBindingsConfigWireSchema`, `TrackTelemetrySchema`, `ScreenSettingsSchema`, ECU profiles, hardware profiles

It is pure TypeScript with no Node.js, browser, or React Native APIs. Today
it is consumed by `canshift-tuner` and `canshift-mobile`. Transport-shape
types live in `canshift-tuner/src/transport/` so core can stay
browser/Node-neutral.

It does **not** contain:

- Firmware C++ code (lives in `canshift-firmware/`)
- UI components (live in `canshift-tuner/src/`)
- Node or React Native specific APIs

---

## Folder Structure

```
canshift-core/
└── src/
    ├── index.ts              # Package root — re-exports every entry plus the config contract
    ├── entries/              # One file per subpath export, re-exports only
    ├── schemas/              # Zod schemas — dashboard, widgets, signals, device, wire payloads
    ├── migrations/           # Shape-change steps from MIGRATION_FLOOR_VERSION to CURRENT_SCHEMA_VERSION
    ├── validation/           # validateDashboard
    ├── wire/                 # TELE, ALERT and CAN monitor binary frames, device commands, JSON envelope parsing
    ├── track/                # Lap crossing detection, start/finish line
    ├── widget-metrics/       # Dash geometry and colours the firmware renderer mirrors
    ├── design-tokens/        # Tuner CSS tokens
    ├── controls/             # Button control vocabulary
    ├── ecu-profiles/         # Built-in ECU signal catalogues, OBD-II PIDs and DTCs
    ├── can-xml/              # CAN XML import
    ├── board-profile/        # Board profile blob format
    ├── constants/            # FIRMWARE_CAPS, STRING_CAPS, dash signals
    ├── display-tiers.ts      # Read by the firmware parity script — do not move
    ├── layout-grid.ts        # Read by the firmware parity script — do not move
    ├── schema-version.ts     # Read by the firmware build — do not move
    └── __tests__/
```

`constants/firmware-caps.ts`, `display-tiers.ts`, `layout-grid.ts` and
`schema-version.ts` are parsed by canshift-firmware's scripts from a sibling
checkout, so those paths and their literal layout are part of the contract.

---

## Public API

The root export carries everything a consumer imports. Subpaths carry a slice
of it, so a bundler that does not tree-shake (Metro) loads only the modules
behind the slice:

| Import                          | What it holds                                                                             |
| ------------------------------- | ----------------------------------------------------------------------------------------- |
| `@canshift/core`                | Everything below, plus the dashboard config contract, validation, migrations              |
| `@canshift/core/wire`           | TELE, ALERT and CAN monitor frames, device commands, STATUS / USB / timer payload parsers |
| `@canshift/core/track`          | Lap crossing detector, start/finish line, track telemetry schema                          |
| `@canshift/core/widget-metrics` | Dash geometry, severity, sensor ranges and danger bands, shift-light segments             |
| `@canshift/core/tokens`         | Tuner design tokens and their CSS variables                                               |
| `@canshift/core/ecu-profiles`   | ECU catalogues, MaxxECU units, OBD-II mode 01 PIDs and DTC decoding                       |
| `@canshift/core/schema-version` | `CURRENT_SCHEMA_VERSION`                                                                  |

An export no consumer imports is removed, not kept for later. `Widget` is a
union discriminated on `type`: narrowing `widget.type` narrows `widget.config`,
and `WidgetOfType<'gauge'>` names one member.

---

## Schema Versioning & Migrations

Every config file carries a `"version"` field at the root:

```json
{ "version": "1.41.0", ... }
```

`CURRENT_SCHEMA_VERSION` (`src/schema-version.ts`) is the version this code reads and writes. It follows semver:

- **MAJOR** — breaking schema change, migration required
- **MINOR** — additive change, backwards compatible
- **PATCH** — documentation or comment change only

When loading a config, consumers must:

1. Read `version`
2. If `version === CURRENT_SCHEMA_VERSION` → load normally
3. If `version < CURRENT_SCHEMA_VERSION` → run `migrateConfig(config, CURRENT_SCHEMA_VERSION)`; a version older than `MIGRATION_FLOOR_VERSION` (1.24.0) throws a `below_floor` `MigrationError`
4. If `version > CURRENT_SCHEMA_VERSION` → ask the user to update the app

The registry holds **shape changes only**. A release that only adds optional fields bumps `CURRENT_SCHEMA_VERSION` and needs no entry: `migrateConfig` runs every step between the file's version and the target in order, then sets the target version. Configs older than 1.24.0 no longer load (#151).

### Shape changes (from the 1.24.0 floor)

| Step            | Change                                                                                  |
| --------------- | --------------------------------------------------------------------------------------- |
| 1.24.0 → 1.25.0 | Pixel layouts converted to 12-column grid spans, derived from the target screen profile |
| 1.26.0 → 1.27.0 | Top-level widget `type` realigned with `config.type`                                    |
| 1.28.0 → 1.29.0 | Legacy flag top bar migrated to the track bar                                           |
| 1.29.0 → 1.30.0 | Gauge `arcFillStyle` dropped — spec-strict fills                                        |
| 1.30.0 → 1.31.0 | Button icon fields stripped — no icons on the dash                                      |
| 1.36.0 → 1.37.0 | Theme faces paired into `theme.day` / `theme.night`                                     |
| 1.39.0 → 1.40.0 | Gauge `alertThreshold` dropped — it armed nothing                                       |
| 1.42.0 → 1.43.0 | `criticalAlert` becomes the one-entry list `criticalAlerts`                             |
| 1.43.0 → 1.44.0 | Strings cut to the firmware buffers (top bar text/format 15, ids 31), `zOrder` clamped  |

`migrateConfig` deep-clones the input before any migration runs (#282) so individual migrations can mutate freely without aliasing the caller's object.

---

## Validation

Validation is **Zod-backed** (Zod is `canshift-core`'s only runtime
dependency). Each validator returns:

```ts
{ valid: boolean; errors: string[]; warnings: string[]; config?: T }
```

`config` is only present on the success branch and is the validated
`DashboardConfig` (or equivalent) ready to consume.

`validateDashboard` covers:

- Layout bounds against `CANVAS` and `TOPBAR_HEIGHT`
- Hex colours against `HexColorSchema`
- Signal-catalog references (every bound signal exists)
- Duplicate widget IDs
- Firmware caps from `FIRMWARE_CAPS` (max widgets per page, max pages, etc.)
- Discriminated `WidgetConfig.type` exhaustiveness

The Vitest suite pins behaviour against the bundled `dashboard.json` fixture (#287) so regressions surface immediately when shape changes are introduced without a paired migration.

---

## Firmware Sync Requirement

`config_types.h` in `canshift-firmware/src/config/` mirrors these TypeScript types in C++. When changing `DashboardConfig`, `PageConfig`, `WidgetConfig`, or `SignalDef`:

1. Update the TypeScript type here
2. Bump `CURRENT_SCHEMA_VERSION` if the change is not purely additive
3. Add a migration in `migrations/migration-runner.ts` and a corresponding test
4. Update `config_types.h` in firmware to match
5. Update `config_loader.cpp` in firmware to read the new field

Schema mismatches between firmware and core are detected at runtime so a
stale firmware paired with a newer config logs a clear error rather than
silently misreading bytes (#259). The firmware **does not run the migration
chain** — only the Tuner migrates configs forward. Issue #1019 (A-COMPAT-1)
tracks the firmware-side preflight that will reject mismatched pushes
instead of degrading silently.

---

## Installation In Consuming Projects

Install from npm:

```bash
npm install @canshift/core
```

Local development against an unpublished change: `npm link` from this repo, or a temporary `file:` override — never committed.

---

## Build & Test

```bash
npm run build         # tsc → dist/
npm run lint          # eslint src
npm run format:check  # prettier --check src/**/*.ts
npm test              # Vitest
```

The Vitest suite under `src/__tests__/` covers migrations, dashboard validation (full and end-to-end), signal validation, device validation, and the bundled fixture.

---

## Conventions & Rules

- **Pure TypeScript** — no Node, browser, or React Native APIs
- **Strict typing** — no `any`; narrow `unknown` with type guards before use
- **Published entries only** — consumers import from `@canshift/core` or one of its subpath exports; `dist/` paths are not exported
- **Bump `CURRENT_SCHEMA_VERSION`** whenever the `DashboardConfig` shape changes, and ship a paired migration in the same PR
- **Discriminated unions** — `WidgetConfig` uses `type` as the discriminant; new widget kinds extend the union and the validator's exhaustive switch
- **Mirror C++** — every change here must be reflected in firmware `config_types.h`

---

## Connections To Other Projects

- **canshift-tuner** — the configurator; imports types, validators, migrations, widget metrics, theme presets, design tokens
- **canshift-firmware** — `config_types.h` mirrors these types in C++; loaders read the same JSON shapes, and the renderer mirrors `widget-metrics.ts` / `theme-presets.ts` constants
- **canshift-mobile** — consumes the same package directly when it needs config or telemetry types (BLE STATUS schema, screen-settings bounds, design tokens)
