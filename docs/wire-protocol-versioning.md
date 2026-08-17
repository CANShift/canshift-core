# Wire protocol versioning

Source: [`canshift-firmware/include/app_config.h`](https://github.com/CANShift/canshift-firmware/blob/main/include/app_config.h)

The compatibility contract between a tuner build and the firmware build it connects to over Web Serial. It codifies the rule the connect-time handshake enforces.

## Versions in play

| Where          | What                        | Source                                                                                                                                                                      |
| -------------- | --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tuner build    | Expected firmware **major** | Vite `define: __EXPECTED_FIRMWARE_MAJOR__` — read from a sibling `canshift-firmware/package.json` at build time, falling back to the tuner's committed `firmware-major.txt` |
| Firmware build | Reported `version`          | `APP_VERSION_STR` injected from `canshift-firmware/package.json`                                                                                                            |
| Firmware build | Reported `protocol`         | `USB_PROTOCOL_VERSION` constant in `canshift-firmware/include/app_config.h`                                                                                                 |

The firmware answers `CMD_GET_STATUS` (opcode `0x10`) with:

```json
{ "status": "ok", "version": "0.16.0", "protocol": 2, "is_day": 0, "board_id": "crowpanel_28" }
```

`board_id` names the board profile the running image was built for. The handshake reports it but does not gate on it.

## Rule

**Major must match.** Minor and patch may differ.

- `0.16.0` (firmware) vs tuner expecting `0.x` → compatible.
- `0.16.0` vs tuner expecting `1.x` → mismatch.
- `1.4.2` vs tuner expecting `1.x` → compatible.

The major version is the only field the handshake gates on. Bumping it is the explicit signal to firmware authors that the typed envelope (`CMD_PUT_CONFIG`, `CMD_PUT_DEVICE_CONFIG`, `CMD_PUT_INPUT_BINDINGS`) shape has changed in a way the old tuner cannot encode.

## What happens on mismatch

`useVersionHandshake` sets `useDeviceStore.firmwareCompat = { kind: 'mismatch', ... }`. Two things follow:

1. **Burn is disabled.** `useBurnDashboard` reads `firmwareCompat` and refuses to push a config — pushing against a wrong-major firmware can silently corrupt persistent state because the typed envelope drifts.
2. **A banner is rendered** by `DeviceAlertBar` explaining expected vs reported major. The Header's firmware slot also flips to a red `fw vX.Y.Z · mismatch` pill.

The user is expected to flash a matching build from the tuner's Firmware route before continuing.

## What happens on protocol drift without a major bump

If the tuner sends an opcode the firmware does not know — usually because the tuner is ahead of the firmware on a minor — the firmware responds with:

```json
{ "status": "error", "message": "unknown_command" }
```

This is a soft signal: the tuner surface that issued the unknown command sees an error result and can decide how to recover (e.g. degrade the feature instead of pretending it succeeded). No banner, no Burn block — only the originating call sees the error.

## When to bump what

| Change                                              | Bump major? | Bump protocol? |
| --------------------------------------------------- | ----------- | -------------- |
| Add a new opcode                                    | No          | Optional       |
| Add a new optional field to an existing payload     | No          | No             |
| Add a new **required** field to an existing payload | Yes         | Yes            |
| Change an existing field's type or semantics        | Yes         | Yes            |
| Rename an opcode without changing wire shape        | No          | No             |

The protocol number (`USB_PROTOCOL_VERSION`) is informational today — the handshake reports it but doesn't gate on it. It's there so a future tuner can refine the compatibility check (e.g. "major match AND protocol ≥ N").

## Related

- [USB transport](https://github.com/CANShift/canshift-firmware/blob/main/docs/architecture/usb-transport.md) — the full command table and wire format.
- [Config contract](config-contract.md) — the payload shapes the envelope carries.
