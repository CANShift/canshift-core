# BLE alert frame

The dash decides when a critical alert takes the screen: configured thresholds,
hysteresis, minimum hold, sensor-lost suppression, acknowledgement. The phone
does not re-decide any of it. It reads the ALERT frame and shows what the dash
shows.

## Characteristic

| Property | Value                                                                                                              |
| -------- | ------------------------------------------------------------------------------------------------------------------ |
| UUID     | `4fa0b6a0-0000-0000-0000-000000000009` (same service as TELE)                                                      |
| Access   | read + notify, encrypted and authenticated like every other char.                                                  |
| Cadence  | checked every BLE tick (TELE's 100 ms); notified on change, and as a keepalive every 10 ticks when nothing changed |
| Empty    | `02 00`: no source is critical                                                                                     |

A fresh subscription gets the current frame on the next tick. While an alert is
active its reading moves, so the frame usually goes out every tick; with no
alert the phone sees `02 00` once a second.

## Layout (version 2, little-endian)

```
[version u8 = 0x02][count u8]
count × [source u8][flags u8][value i32][limit i32][active s u16][key length u8][key ASCII]
```

| Field      | Meaning                                                                                                                     |
| ---------- | --------------------------------------------------------------------------------------------------------------------------- |
| `source`   | source id (table below); the firmware's takeover source index is the same number                                            |
| `flags`    | bit 0 limit known · bit 1 limit is a floor (`below`) · bit 2 acknowledged on the dash · bit 3 on screen now · bits 4–7 zero |
| `value`    | the reading the dash judged, in the signal's stored unit, `round(value × 1000)` like TELE                                   |
| `limit`    | the threshold that was crossed, same scale; zero when bit 0 is clear                                                        |
| `active s` | whole seconds since the source turned critical, saturating at 65535                                                         |
| `key`      | the signal key (`oil_press_bar`, or the one the configured entry names), 1–63 printable ASCII                               |

Only sources that are critical right now are listed, each at most once. An
acknowledged source stays in the list, flagged, until it clears. At most one entry
carries bit 3, and it is listed first. The firmware writes whole entries until the
notify payload is full (MTU 247 → 244 bytes), so the on-screen alert is never the
one dropped; with all eleven sources critical at once the tail is cut.

`decodeAlertFrame` returns `null` for anything it cannot fully trust: unknown
version, unknown source id, reserved flag bits, a duplicate source, two entries on
screen, truncated or trailing bytes.

## Sources

| id  | `ALERT_SOURCES`   | Signal key          |
| --- | ----------------- | ------------------- |
| 0   | `oil_pressure`    | `oil_press_bar`     |
| 1   | `coolant_temp`    | `coolant_temp_c`    |
| 2   | `oil_temp`        | `oil_temp_c`        |
| 3   | `battery_voltage` | `battery_volts`     |
| 4   | `exhaust_temp`    | `egt_c`             |
| 5   | `gearbox_temp`    | `gearbox_temp_c`    |
| 6   | `diff_temp`       | `diff_temp_c`       |
| 7   | `configured`      | `criticalAlerts[0]` |
| 8   | `configured`      | `criticalAlerts[1]` |
| 9   | `configured`      | `criticalAlerts[2]` |
| 10  | `configured`      | `criticalAlerts[3]` |

The order is the firmware's `AlertSources::kSources` order, then one id per
`criticalAlerts` entry: id `FIRST_CONFIGURED_ALERT_ID + i` is entry `i`, which
`decodeAlertFrame` returns as `source: 'configured'` with `configuredIndex: i`
(`null` for a built-in source). An entry the dash could not arm keeps its id and
never fires, so the index always points at the same entry in the config. Adding a
source appends to both and bumps the frame version; version 2 is the one that
turned the single configured alert into a list.

## Acknowledging from the phone

Write `alertAckCommand(alert)` to the CMD characteristic, with the decoded alert
or any `{ source, configuredIndex }`: `{"cmd":"ack_alert","source":1}`. The dash acknowledges that source, and the next
frame shows it with bit 2 set. `alertAckCommand()` without a source sends
`{"cmd":"ack_alert"}`, which acknowledges whatever the dash has on screen; that is
the form older firmware understands. Acknowledging a source that is no longer
critical does nothing.

## Drift guard

The two byte vectors in `src/__tests__/__fixtures__/alert-frame-vectors.ts` are
pinned in the firmware encoder test too. With a firmware sibling checkout,
`alert-frame-parity.test.ts` also checks the frame version, the source id count
(`ALERT_SOURCE_ID_COUNT`) and the built-in source order against the firmware
headers.
