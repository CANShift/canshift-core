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
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── src/
    ├── index.ts                          # Public API barrel — only import from here
    ├── constants/
    │   └── firmware-caps.ts              # FIRMWARE_CAPS, CANVAS, REV_LIMIT_RPM, HEX_COLOR_REGEX
    ├── schemas/                          # Single home for every contract (#914)
    │   ├── common.ts                     # HexColor, WidgetLayout, WidgetStyle, SemVer
    │   ├── dashboard.ts                  # DashboardConfig, PageConfig, TopBar, ButtonAction
    │   ├── widgets/                      # Widget union — gauge, warning, button, timer, gear, image, shift_light
    │   ├── project.ts                    # ProjectSchema — pages + profile + signals as one unit (.canshift base)
    │   ├── device.ts                     # DeviceConfig + wire schema, Esp32{Input,Output}GpioSchema
    │   ├── signal.ts                     # SignalConfig, SignalDef, ColorRamp, CanSpeedKbps
    │   ├── screen-profile.ts             # SCREEN_PROFILES target panels
    │   ├── obd2.ts                       # OBD-II polling contract
    │   ├── ws-frames.ts / ble-timer.ts / ble-status.ts   # transport frames (tuner WS, mobile BLE)
    │   ├── input-bindings.ts             # Physical GPIO button bindings (#833)
    │   ├── screen-settings.ts            # CMD_SCREEN_SETTINGS / BLE SETTINGS payload
    │   └── track-telemetry.ts            # Track-mode BLE telemetry contract (#843)
    ├── migrations/
    │   ├── registry.ts                   # BUILTIN_MIGRATIONS — one entry per shape change, MIGRATION_FLOOR_VERSION
    │   └── runner.ts                     # migrateConfig
    ├── validation/
    │   ├── validate-dashboard.ts         # Bounds, hex colors, signal refs, duplicate IDs, firmware caps
    │   ├── validate-signal-config.ts     # SignalConfig structural sanity
    │   └── validate-signal.ts            # validateSignalCatalog (color-ramp anchored)
    ├── ecu-profiles/                     # Built-in ECU presets (MaxxECU, …) — #570
    ├── can-xml/                          # CAN XML import (parseCanXml, #609)
    ├── types/
    │   └── releases.ts                   # GitHub ReleaseInfo / LatestReleaseResult (#571)
    ├── design-tokens.ts                  # DARK_TOKENS, tokensToCssVars (#526)
    ├── theme-presets.ts                  # THEME_PRESETS — 8 built-in dash themes
    ├── widget-metrics.ts                 # Shared widget geometry — gauge arcs, top rules, STALE_PLACEHOLDER
    ├── layout-grid.ts                    # 12-column span grid — placements, overlap, clamping
    ├── day-theme-defaults.ts             # DAY_PALETTE_DEFAULT / DAY_BG_DEFAULT (#901)
    ├── sensor-defaults.ts                # SENSOR_DEFAULT_RAMPS + resolveDefaultRamp (#430)
    ├── sensor-palette.ts                 # Two-zone semantic palette (#954)
    ├── topbar-metrics.ts                 # TopBar proportion table (mirrored in firmware)
    ├── topbar-colors.ts                  # TopBar status palette (mirrored in firmware)
    └── __tests__/                        # Jest specs pinning behaviour
```

The previously-published `types/{common,dashboard,device,ipc,signal}.ts`
barrels were collapsed into the corresponding `schemas/*.ts` files in #914 —
every contract now has exactly one home.

---

## Public API

All exports live behind the `src/index.ts` barrel — consumers must not reach into sub-paths.

**Types**

- Dashboard: `DashboardConfig`, `PageConfig`, `PagePalette`, `Widget`, `WidgetConfig` (discriminated union on `type`), `GaugeWidgetConfig`, `GaugeDisplayStyle`, `GaugeArcFillStyle`, `WarningWidgetConfig`, `ButtonWidgetConfig`, `TimerWidgetConfig`, `BarWidgetConfig`, `GearWidgetConfig`, `ImageWidgetConfig`, `SensorIconName`, `WidgetLabelPosition`, `ThemePreset`, `TopBarConfig`, `TopBarItem`, `TopBarItemPosition`
- Button actions: `ButtonAction`, `DashboardButtonAction`, `EcuButtonAction`, `NavigateAction`, `MapSwitchAction`, `CanRawAction`, `CruiseControlAction`, `CruiseControlOp`
- Common primitives: `HexColor`, `WidgetType`, `WidgetLayout`, `WidgetStyle`, `SemVer`
- Signals: `SignalConfig`, `SignalDef`, `ColorRamp`, `ColorRampStop`, `RampInterpolation`
- Device: `DeviceConfig`, `DeviceConfigWire`, `CanSpeedKbps`
- Input bindings (#833): `InputBinding`, `InputBindingWire`, `InputBindingsConfig`, `InputBindingsConfigWire`, `InputActiveLevel`, `InputPressKind`
- Track telemetry (#843): `TrackTelemetry`
- Screen settings (S-H-1): `ScreenSettings`
- BLE STATUS (#887): `BleStatusWire`, `BleStatus`, `BleStatusResult`
- BLE ALERT: `ActiveAlert`, `AlertLimit`, `AlertOrigin`, `AlertSource`, `BuiltInAlertSource`
- Releases (#571): `ReleaseAsset`, `ReleaseInfo`, `LatestReleaseResult`
- Design tokens (#526): `DesignTokens`
- Hardware profiles (#831): `HardwareProfileId`, `HardwareProfile`
- ECU profiles (#570): `EcuProfile`
- CAN XML import (#609): `ParseCanXmlResult`
- TopBar mirror types: `TopBarMetricsRatios`, `TopBarColorPalette`
- Sensors: `SensorKind`, `SensorPaletteEntry`

**Runtime values**

- Dashboard: `DEFAULT_PAGE_PALETTE`, `DEFAULT_TOP_BAR_LAYOUT`, `CRUISE_CONTROL_OPS`
- Device: `DEFAULT_DEVICE_CONFIG`, `CAN_SPEED_OPTIONS`, `deviceConfigFromWire`, `deviceConfigToWire`
- Input bindings: `InputBindingsConfigSchema`, `InputBindingsConfigWireSchema`, `inputBindingsFromWire`, `inputBindingsToWire`, `MAX_INPUT_BINDINGS`, `INPUT_BINDING_ID_MAX_LEN`
- Schemas (boundary parsing): `DashboardConfigSchema`, `SignalConfigSchema`, `DeviceConfigSchema`, `DeviceConfigWireSchema`, `Esp32OutputGpioSchema`, `Esp32InputGpioSchema`, `TrackTelemetrySchema`, `ScreenSettingsSchema`
- BLE STATUS helpers: `BLE_STATUS_MAX_STRING_LEN`, `SCREEN_SETTINGS_BOUNDS`, `parseBleStatus`
- BLE ALERT frame ([spec](docs/ble-alert-frame.md)): `encodeAlertFrame`, `decodeAlertFrame`, `ALERT_FRAME_VERSION`, `MAX_ALERT_ACTIVE_SECONDS`, `ALERT_SOURCES`, `BUILT_IN_ALERT_SIGNALS`, `alertSourceId`, `alertOriginFromId`, `ALERT_ACK_COMMAND`, `alertAckCommand`
- Sensors: `SENSOR_DEFAULT_RAMPS`, `SENSOR_PALETTE`, `resolveDefaultRamp`, `resolveSensorKind`, `colorAtValue`, `sensorOkColor`, `sensorWarningColor`
- Design tokens: `COLOR_KEY_TO_CSS_VAR`, `DARK_TOKENS`, `tokensToCssVars`, `DAY_PALETTE_DEFAULT`, `DAY_BG_DEFAULT`, `DAY_THEME_PRESET`
- Hardware / ECU: `HARDWARE_PROFILES`, `isPinAvailableForBoard`, `ECU_PROFILES`, `DEFAULT_PROFILE_ID`, `MAXXECU_SIGNAL_UNITS`
- CAN XML: `parseCanXml`
- TopBar mirrors: `TopBarMetrics`, `TopBarColors`
- Firmware caps: `FIRMWARE_CAPS`, `CANVAS`, `TOPBAR_HEIGHT`, `REV_LIMIT_RPM`, `DECIMAL_PLACES`, `HEX_COLOR_REGEX`, `MAX_RAMP_STOPS`

**Validators** — all return `{ valid: boolean, errors: string[], warnings: string[], config?: T }`

- `validateDashboard(config, options?)` plus types `ValidationResult`, `ValidateDashboardOptions`
- `validateSignalConfig(config)`
- `validateSignalCatalog(signals)`

**Migrations**

- `BUILTIN_MIGRATIONS` (read-only registry), `MIGRATION_FLOOR_VERSION`, `migrateConfig`, `MigrationError`
- Types: `Migration`, `MigrationFn`, `MigrationResult`, `MigrationErrorCode`

**Version**

- `CURRENT_SCHEMA_VERSION` — read it in `src/schema-version.ts`
- `PRODUCT_NAME` — `'CANShift'`

---

## Schema Versioning & Migrations

Every config file carries a `"version"` field at the root:

```json
{ "version": "1.41.0", ... }
```

`CURRENT_SCHEMA_VERSION` (`src/index.ts`) is the version this code reads and writes. It follows semver:

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
- Hex colors against `HEX_COLOR_REGEX`
- Signal-catalog references (every bound signal exists)
- Duplicate widget IDs
- Firmware caps from `FIRMWARE_CAPS` (max widgets per page, max pages, etc.)
- Discriminated `WidgetConfig.type` exhaustiveness

`validateSignals` and `validateDevice` enforce structural sanity on their respective domains. The Jest suite pins behaviour against the bundled `dashboard.json` fixture (#287) so regressions surface immediately when shape changes are introduced without a paired migration.

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
- **Barrel-only imports** — consumers must import from `@tmbk/canshift-core` (which resolves to `src/index.ts`); never reach into sub-paths
- **Bump `CURRENT_SCHEMA_VERSION`** whenever the `DashboardConfig` shape changes, and ship a paired migration in the same PR
- **Discriminated unions** — `WidgetConfig` uses `type` as the discriminant; new widget kinds extend the union and the validator's exhaustive switch
- **Mirror C++** — every change here must be reflected in firmware `config_types.h`

---

## Connections To Other Projects

- **canshift-tuner** — the configurator; imports types, validators, migrations, widget metrics, theme presets, design tokens
- **canshift-firmware** — `config_types.h` mirrors these types in C++; loaders read the same JSON shapes, and the renderer mirrors `widget-metrics.ts` / `theme-presets.ts` constants
- **canshift-mobile** — consumes the same package directly when it needs config or telemetry types (BLE STATUS schema, screen-settings bounds, design tokens)
