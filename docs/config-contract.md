# Config contract

Defined by [`src/schemas/`](../src/schemas/) · mirrored by [`canshift-firmware/src/config/config_types.h`](https://github.com/CANShift/canshift-firmware/blob/main/src/config/config_types.h)

The configuration contract defines what a valid config file looks like and how
it flows between the tuner and the dash. Core owns it: the Zod schemas here are
the source of truth, the firmware mirrors them in C++, and the tuner validates
against them before burning.

Every number quoted below comes from a constant in this package. When they
disagree, the code wins — start from [`src/constants/firmware-caps.ts`](../src/constants/firmware-caps.ts).

## Config files

Four JSON files live on the device, under `/config/` in SPIFFS:

| File                  | Purpose                                                                | Schema                                                          |
| --------------------- | ---------------------------------------------------------------------- | --------------------------------------------------------------- |
| `dashboard.json`      | Pages, widgets, layout, signal bindings, theme                         | [`schemas/dashboard.ts`](../src/schemas/dashboard.ts)           |
| `signals.json`        | CAN frame ids, byte positions, scaling, alert levels                   | [`schemas/signal.ts`](../src/schemas/signal.ts)                 |
| `device.json`         | CAN speed; TWAI pins only as an override (the board profile owns them) | [`schemas/device.ts`](../src/schemas/device.ts)                 |
| `input_bindings.json` | Physical GPIO button → action map                                      | [`schemas/input-bindings.ts`](../src/schemas/input-bindings.ts) |

All four are edited in the tuner and burned over Web Serial. `device.json` and
`input_bindings.json` travel in **snake_case** wire format — the mappers
(`deviceConfigToWire`, `inputBindingsToWire`) are the boundary, and no
snake_case key should ever reach application code.

`dashboard.json` and `signals.json` share a `version` field at the root.

## Schema version

`CURRENT_SCHEMA_VERSION` lives in [`src/schema-version.ts`](../src/schema-version.ts).
Read it there rather than trusting a number written into prose — this document
has been wrong about it before.

The firmware needs the same value at compile time and gets it in this order:

1. A sibling `../canshift-core` checkout, parsed out of `src/schema-version.ts`.
2. Otherwise the committed `core-schema-version.txt` pin in the firmware repo, with a warning.

The pin is kept honest by the cross-repo parity job, which fails a core PR when
the firmware's pin has drifted — so a schema bump and its firmware pin land
together.

## dashboard.json

```json
{
  "version": "1.37.0",
  "name": "string",
  "description": "string",
  "defaultPageId": "string",
  "revLimitRpm": 7000,
  "targetProfile": "crowpanel-28",
  "ecuProfileKey": "string",
  "dayNightSignal": "string",
  "topBar": {
    "height": 24,
    "bgColor": "#RRGGBB",
    "textColor": "#RRGGBB",
    "layout": [TopBarItem]
  },
  "theme": {
    "day": { "bgColor": "#RRGGBB", "palette": PagePalette },
    "night": { "bgColor": "#RRGGBB", "palette": PagePalette }
  },
  "pages": [PageConfig]
}
```

Optional: `description`, `targetProfile`, `ecuProfileKey`, `dayNightSignal`,
`theme`, `topBar.layout`. Everything else is required. The schema is `.strict()`
throughout — an unknown key is a validation error, not a silently ignored field.

### Caps

| Cap                   |   Value | Constant                             |
| --------------------- | ------: | ------------------------------------ |
| Pages per dashboard   |       8 | `FIRMWARE_CAPS.MAX_PAGES`            |
| Widgets per page      |      12 | `FIRMWARE_CAPS.MAX_WIDGETS_PER_PAGE` |
| Top bar items         |      16 | `FIRMWARE_CAPS.MAX_TOPBAR_ITEMS`     |
| Signals per catalogue |      48 | `FIRMWARE_CAPS.MAX_SIGNALS`          |
| Actions per button    |       4 | `FIRMWARE_CAPS.MAX_BUTTON_ACTIONS`   |
| Colour ramp stops     |       8 | `FIRMWARE_CAPS.MAX_RAMP_STOPS`       |
| Top bar height        |   16–60 | `TOPBAR_HEIGHT`                      |
| Rev limit             | 1–20000 | `REV_LIMIT_RPM`                      |
| Font size             |    8–48 | `FONT_SIZE_MIN` / `FONT_SIZE_MAX`    |

A dashboard that exceeds a cap fails validation in the tuner before it can be
burned — the firmware would not have the memory for it.

### Theme — day and night faces

A theme owns both faces. `theme.day` and `theme.night` each carry a `bgColor`
and an optional `palette`; the palette keys are `surface`, `primary`, `accent`,
`text`, `textDim`, `warning`, `danger`, `success`. A page may override the
dashboard palette with its own `palette`.

`dayNightSignal` names the signal that drives automatic day/night switching.
Without it the dash stays on whichever face was last selected, toggled from the
Settings drawer or by `CMD_TOGGLE_DAY_NIGHT` / `CMD_SET_DAY_NIGHT`.

### Top bar

`topBar.layout` is an array of discriminated-union items, each with a
`position` of `left`, `center` or `right`:

| Type          | Carries                             |
| ------------- | ----------------------------------- |
| `label`       | `text`                              |
| `signal`      | `signal`, optional `format`         |
| `signalMax`   | `signal`, `text`, optional `format` |
| `statusDot`   | `signal` — liveness of that signal  |
| `modeFlag`    | `signal`, `text`                    |
| `canRate`     | —                                   |
| `trackBadge`  | —                                   |
| `bleIcon`     | —                                   |
| `themeToggle` | —                                   |
| `separator`   | —                                   |

Omitting `layout` falls back to `DEFAULT_TOP_BAR_LAYOUT`. A page may also
declare a `statusRow` with its own `center` and `right` items, using the same
union.

### PageConfig

```json
{
  "id": "string",
  "backgroundImage": null,
  "backgroundColor": "#RRGGBB",
  "palette": PagePalette,
  "showTopBar": true,
  "visible": true,
  "template": "custom",
  "statusRow": { "center": TopBarItem, "right": TopBarItem },
  "widgets": [Widget]
}
```

Pages have no `name` — they are identified by `id`. `backgroundImage` is a path
in SPIFFS `assets/`, or `null`.

### Page templates

| Value               | Behaviour                                                                                                                              |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| absent / `"custom"` | The firmware renders `widgets[]` on the grid.                                                                                          |
| `"cruise_control"`  | The firmware draws a fixed 2×2 grid of touch targets (`+`, `SET`, `−`, `OFF`) and **ignores `widgets[]`**, dispatching cruise actions. |

The tuner keeps any authored `widgets[]` while a template is active, so
switching back to `custom` does not lose work. Pages predating the field parse
cleanly and default to `custom`.

Adding a template takes three coordinated edits: the literal in `PAGE_TEMPLATES`
here, a picker and canvas preview in the tuner, and a procedural builder in the
firmware's `page_manager.cpp` alongside `buildCruiseControlTemplate`.

### Widget

```json
{
  "id": "string",
  "type": "gauge",
  "signal": "rpm",
  "layout": { "col": 0, "colSpan": 6, "row": 0, "rowSpan": 6, "zOrder": 0 },
  "style": {
    "primaryColor": "#RRGGBB",
    "secondaryColor": "#RRGGBB",
    "warningColor": "#RRGGBB",
    "criticalColor": "#RRGGBB",
    "textColor": "#RRGGBB",
    "fontSize": 16,
    "borderColor": null,
    "respectDayMode": true
  },
  "config": { "type": "gauge", ... }
}
```

`type` is one of `gauge`, `warning`, `button`, `timer`, `gear`, `image`,
`shift_light` — see [`schemas/widgets/`](../src/schemas/widgets/) for each
config shape. Two rules are enforced beyond the shape: `widget.type` must equal
`widget.config.type`, and `gauge`, `warning`, `gear` and `shift_light` must
carry a non-empty `signal`.

**Layout is a grid, not pixels.** Widgets are placed on a 12×12 grid
([`layout-grid.ts`](../src/layout-grid.ts)) with `col`, `colSpan`, `row`,
`rowSpan`, and `col + colSpan` and `row + rowSpan` must stay within it. The
firmware resolves cells to pixels for the active panel, so one dashboard renders
on panels of different resolutions. Pixel-positioned dashboards from before
schema 1.25 are converted by the `pixelLayoutToGridSpans` migration.

## signals.json

```json
{
  "version": "1.37.0",
  "protocol": "custom_v1.0",
  "canSpeedKbps": 500,
  "out": { "cruiseSet": { "id": "0x600", "extended": false } },
  "signals": [SignalDef]
}
```

`canSpeedKbps` is one of 125, 250, 500, 1000. `out` is an optional map of
outbound frames a button can send. `signals` is capped at
`FIRMWARE_CAPS.MAX_SIGNALS`.

### SignalDef

| Field                                 | Notes                                                                        |
| ------------------------------------- | ---------------------------------------------------------------------------- |
| `name`                                | Key referenced by `Widget.signal`. Max 63 chars.                             |
| `canFrameId`                          | Hex string, `0x123` to `0x1E005000`. Must fit 29 bits.                       |
| `startByte`, `byteLength`             | `byteLength` is 1–4; `startByte + byteLength` must fit an 8-byte frame.      |
| `bigEndian`, `signed`                 | Byte order and sign of the raw field.                                        |
| `bitMask`                             | Optional hex, ≤ `0xFF` — the firmware stores it as `uint8_t`.                |
| `scale`, `offset`                     | `value = raw * scale + offset`.                                              |
| `expr`, `exprRefs`, `targetId`        | Optional derived signal — an expression over other signal ids.               |
| `unit`, `min`, `max`                  | `min` must be less than `max`.                                               |
| `warningLevel`, `dangerLevel`         | Low-side or high-side ramp. They must differ, which is what fixes direction. |
| `highWarningLevel`, `highDangerLevel` | High-side pair; `highWarningLevel` ≤ `highDangerLevel`.                      |
| `timeoutMs`                           | Staleness window before the widget shows the placeholder.                    |
| `type`                                | Optional semantic kind, used to pick a default colour ramp.                  |
| `polling`                             | Optional OBD-II block — see below.                                           |

All four level fields must sit inside `[min, max]`. A signal can carry a
low-side ramp (oil pressure falling), a high-side ramp (coolant rising), or
both; the validator rejects the combinations that would not be monotonic.

### OBD-II polling

Default behaviour is **passive broadcast**: the firmware listens to what the ECU
sends on its own. MaxxECU, Haltech, MegaSquirt and most race ECUs publish that
way — leave `polling` absent.

OBD-II ECUs speak request/response instead, so the dash must send a query frame
(`0x7DF`, mode `0x01`, PID byte) and decode the response (`0x7E8`). When a signal
carries a `polling` block, `Obd2Poller` schedules requests at `intervalMs` and
writes the matched response into the signal. Set `canFrameId` to the response id
so the byte-decode path is identical to the broadcast one.

| Field        | Range         | Notes                             |
| ------------ | ------------- | --------------------------------- |
| `mode`       | `0x01`        | Mode 01 only — current data PIDs. |
| `pid`        | `0x00`–`0xFF` | SAE J1979 PID byte.               |
| `intervalMs` | 100–60000     | ≥ 100 ms keeps the bus polite.    |

Out of scope: modes 02–09, multi-ECU responses at `0x7E9`–`0x7EF`, and ISO-TP
multi-frame responses longer than 7 bytes.

The default `signals.json` shipped with the firmware carries no polling blocks.
[`signals_obd2_mode01.json.example`](https://github.com/CANShift/canshift-firmware/blob/main/docs/examples/signals_obd2_mode01.json.example)
is a starter catalogue for the standard J1979 PIDs.

## What actually arms an alert

Three fields in two files look like the same knob. They are not, and only one of
them reaches the alert engine.

| Field                                                 | File                                     | Effect                                                                       |
| ----------------------------------------------------- | ---------------------------------------- | ---------------------------------------------------------------------------- |
| `warningLevel` / `dangerLevel` and their `high*` pair | `signals.json` → `SignalDef`             | **Arms the alert engine** — the warning band and the full-screen takeover.   |
| `dangerLevel` (+ `dangerBelow`)                       | `dashboard.json` → gauge or label config | **Paints one widget.** Never reaches the alert engine.                       |
| `alertThreshold`                                      | `dashboard.json` → gauge config          | **Nothing.** No firmware code reads it — see CANShift/canshift-firmware#266. |

The one that matters is the catalogue's, and it is the one no editor exposes today
(#121). The one the tuner surfaces is the widget's, which only chooses a colour.

### Which signals the firmware watches

Seven, and only seven. Everything else can colour a widget but cannot take the
screen:

| Signal           | Direction | Fallback when the catalogue is silent |
| ---------------- | --------- | ------------------------------------- |
| `coolant_temp_c` | high      | 100 / 110 °C                          |
| `oil_temp_c`     | high      | 120 / 135 °C                          |
| `oil_press_bar`  | **low**   | 1.5 / 1.0 bar                         |
| `battery_volts`  | both      | 12.0 / 11.5 V low, 15.0 / 16.0 V high |
| `egt_c`          | high      | 950 / 1000 °C                         |
| `gearbox_temp_c` | high      | 120 / 140 °C                          |
| `diff_temp_c`    | high      | 120 / 140 °C                          |

The last three arm **only if the catalogue declares them**. Undeclared means no
alert, no health tracking, no takeover. The first four always arm, because a car
without coolant or oil pressure monitoring is not a car we should let run silently.

Rev limit is separate again: it comes from `dashboard.json`'s `revLimitRpm`, not
from a signal.

### Direction is inferred, not declared

There is no direction field. A low-side alarm is expressed by putting
`warningLevel` **above** `dangerLevel` — oil pressure warns at 1.5 bar and alarms
at 1.0. A high-side alarm has them the other way round. The validator rejects the
non-monotonic combinations, which is what makes the inference safe.

`battery_volts` uses both pairs at once: the low pair for a failing alternator, the
`high*` pair for a failing regulator.

### A dash threshold is not the ECU's threshold

The ECU owns protection: it cuts, retards and limits, and publishes the `0x374`
flags the cut band reports. That is a statement of fact, after the fact.

A dash threshold exists to fire **before** the ECU acts. Its entire value is the
margin — water at 106 while the ECU pulls timing at 110 gives the driver time to
lift. Set them equal and the dash adds nothing but noise.

So these are **driver warnings sited below the ECU's action point**, not a second
copy of the ECU's configuration. An editor should say so, because the instinct is
to type the same number twice.

### What a missing sensor does

Two invariants worth relying on:

- A sensor that **was** present and drops out raises the level to WARNING, never
  CRITICAL. A dropout cannot take the screen.
- A signal that has **never** been valid is silent. The shipped catalogue can
  declare gearbox, diff and exhaust temperature while a car without those sensors
  sees nothing at all.

## device.json and input_bindings.json

`device.json` is small on purpose — `canSpeedKbps`, plus `twaiTxPin` and
`twaiRxPin` as overrides. Leave the pins out and the board profile supplies
them; that is the normal case. Pins are validated against the ESP32 safe-pin
sets, which exclude GPIO 6–11 (SPI flash — writing there bricks the device) and,
for outputs, the input-only pins 34–39.

`input_bindings.json` maps a physical GPIO button to a `ButtonAction` — the same
action union the on-screen buttons use. Up to `MAX_INPUT_BINDINGS` (16) entries,
each with a pin, an active level, a press kind (`short`, `long`, `double`) and a
debounce in 1–500 ms.

## How config flows

### Write path — tuner to device

```
Tuner edits the project in the browser
    │
    ▼
Validated against the core schemas (and migrated first if an older file was loaded)
    │
    ▼
Serialised; device.json / input_bindings.json mapped to snake_case wire format
    │
    ▼
Web Serial (USB CDC) — CMD_PUT_CONFIG (0x02), or CMD_PUT_CONFIG_CHUNK (0x0E)
for payloads too large for one line
    │
    ▼
Firmware dispatches from its command table and writes SPIFFS atomically,
keeping a .bak companion
    │
    ▼
ConfigLoader::reloadAll() → PageManager rebuilds the UI
```

USB is the only path that carries a full configuration. BLE is a secondary link
for telemetry and a small command set — the phone cannot burn a dashboard.

### Read path — device boot

```
ESP32 power on
    │
    ▼
BootSequence → StorageDriver::init()
    │
    ▼
ConfigLoader::loadAll() reads each file from /config/
    │
    ├── dashboard.json → CfgDashboard
    ├── signals.json   → CfgSignalConfig
    ├── device.json    → CfgDevice (pins left unset fall back to the board profile)
    └── input_bindings.json → bindings table
    │
    ▼
ThemeManager::apply() → styles LVGL from the active theme face
PageManager::init()   → creates the page screens
CanParser::loadSignalDefinitions() → configures the parser
```

## Migrations

A `DashboardConfig` shape change needs three things in the same PR: the bumped
`CURRENT_SCHEMA_VERSION`, a migration entry in
[`src/migrations/registry.ts`](../src/migrations/registry.ts), and a test. The
firmware's `config_types.h` follows to match the new fields.

`migrateConfig` walks the chain from whatever version a file declares up to
`CURRENT_SCHEMA_VERSION`; `validateMigrationChain` proves the chain has no gap.
Migrations that only bump the number use the `versionOnly` helper — the entry
still has to exist, so the chain never breaks.

**The firmware does not migrate.** It compares the file's **major** version
against its own compiled `CONFIG_SCHEMA_VERSION`. On a mismatch it logs and
pushes a `VER_MISMATCH` error to the `ErrorStore`, then continues with whatever
fields it can read — ArduinoJson ignores keys it does not know. A missing or
unparseable version yields `VER_MISSING` and the same best-effort read.

So the tuner is the migration boundary. Pushing a config from the future and
expecting the device to normalise it does not work; it will render whatever it
understood and flag the mismatch on the ErrorBar.

## Design space

Widgets are authored against a **320×240 design space** — `CANVAS` in
`firmware-caps.ts` — and the firmware's `LayoutScale` maps that to the physical
panel. On a panel that is already 320×240 the scale folds to identity at compile
time.

Within that space the top bar occupies `y = 0` to `topBar.height`, and the 12×12
widget grid fills the content area below it, with a 6 px gutter and 8 px frame
padding (`LAYOUT_GRID`). Because placement is in grid cells, a dashboard is not
tied to a resolution: the same file renders on a different panel by resolving
the same cells against different pixel dimensions.

`targetProfile` records which panel a dashboard was authored against.
`SCREEN_PROFILES` currently registers one — `crowpanel-28`, 320×240 — so the
field is omitted from most configs and `resolveScreenProfile` defaults to it.

## Display tiers

A **tier** is a design space: the canvas a page is authored against, the grid it is
placed on, how many widgets it may carry, and the font ladder it renders with.

| Tier     | Design space | Grid    | Widgets/page | Top value face |
| -------- | ------------ | ------- | ------------ | -------------- |
| `base`   | 320 x 240    | 12 x 12 | 12           | 84 px          |
| `medium` | 480 x 320    | 16 x 14 | 18           | 120 px         |
| `large`  | 800 x 480    | 24 x 20 | 28           | 168 px         |

`base` is the canvas everything is authored against today; its numbers are the
existing `CANVAS`, `LAYOUT_GRID` and `FIRMWARE_CAPS.MAX_WIDGETS_PER_PAGE`
constants rather than a second copy, so the tier table cannot drift from them.

The larger tiers grow **both** axes of the problem: more cells _and_ a taller font
ladder. A 7-inch panel showing the same seven widgets at 2.5x is a 2.8-inch dash
viewed from very close; a 7-inch panel showing 2.5x-smaller widgets is unreadable
at speed. So a tier gets a bigger grid and bigger type, and a page decides how much
of the extra room it spends on each.

### Resolving a panel to a tier

`tierForPanel(width, height)` returns the largest tier that **fits inside** the
panel, never one larger:

```ts
tierForPanel(320, 240) // base
tierForPanel(479, 319) // base   — a medium tier would not fit
tierForPanel(800, 480) // large
tierForPanel(128, 64) // base   — the floor, nothing smaller exists
```

A panel between two tiers gets the smaller one and scales up, which is today's
behaviour on every board.

### What this does not yet do

Nothing consumes the table. Per-tier **page variants** — a page carrying a richer
widget set for a larger tier — are the next slice, and they are a `DashboardConfig`
shape change with a migration. Until then a page is authored once, at `base`, and
scaled.

The firmware currently derives its font ladder from a hardcoded table in
`font_manager.cpp`, not from these tiers; wiring the two together is gated on
moving the large faces to SPIFFS (CANShift/canshift-firmware#215, #259).
