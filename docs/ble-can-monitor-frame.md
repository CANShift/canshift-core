# BLE CAN monitor frame

The phone's console shows the raw CAN bus as a table: one row per ID with its
latest data and its rate. The dash does not stream every frame over BLE — a busy
bus carries thousands a second. It keeps the latest frame of each ID and counts
how many arrived, and reports the IDs that moved since their last report.

## Characteristic

| Property | Value                                                                                                                       |
| -------- | --------------------------------------------------------------------------------------------------------------------------- |
| UUID     | `4fa0b6a0-0000-0000-0000-00000000000b` (same service as TELE)                                                               |
| Access   | read + notify + write, encrypted and authenticated like every other char.                                                   |
| On       | only while subscribed; unsubscribing or disconnecting stops the monitor and clears the dash's ID table and filter           |
| Cadence  | checked every BLE tick (TELE's 100 ms); up to two notifies per tick, each carrying only the IDs that received a frame since |
| Payload  | at most 244 bytes, and never more than the negotiated MTU minus 3                                                           |

## Frame layout (version 1, little-endian)

```
[version u8 = 0x01][count u8][flags u8][reserved u8 = 0][device ms u32]
count × [id u32][dlc u8][count u16][age ms u16][data × dlc]
```

| Field       | Meaning                                                                                                |
| ----------- | ------------------------------------------------------------------------------------------------------ |
| `flags`     | bit 0 the dash's ID table is full and new IDs are ignored · bit 1 a filter is active · bits 2–7 zero   |
| `device ms` | the dash's uptime clock when the frame was built                                                       |
| `id`        | bits 0–28 the CAN id · bit 31 set for a 29-bit extended id · bits 29–30 zero; a standard id is ≤ 0x7FF |
| `dlc`       | data length, 0–8                                                                                       |
| `count`     | frames of this id since its previous report, saturating at 65535                                       |
| `age ms`    | time from the id's last frame to `device ms`, saturating at 65535                                      |

The rate of an id is its `count` over the `device ms` elapsed between two of its
reports; the bus rate is the sum. An id that received nothing is simply absent.
The dash holds 64 ids; an id that does not fit a notify waits for the next one,
so a crowded table still cycles through every id.

`decodeCanMonitorFrame` returns `null` for anything it cannot fully trust:
unknown version, an empty frame, reserved flag or header bits, a reserved id bit,
a standard id past 11 bits, a dlc past 8, truncated or trailing bytes.

## Filter write (version 1)

```
[version u8 = 0x01][n u8, 0–8]
n × [id u32][mask u32]
```

A frame is kept when `frame id & mask == id & mask` for any pair; `n = 0` keeps
every id. Ids use the same bit-31 extended tag, and `encodeCanMonitorFilter`
always sets bit 31 in the mask, so a standard filter never matches an extended
id. A write that does not decode is refused and the current filter stays. A new
filter clears the dash's table.

## Pinned vectors

`src/__tests__/__fixtures__/can-monitor-vectors.ts` holds two frames and two
filters; the firmware pins the same bytes in `rust/can-monitor/src/vectors.rs`,
and `can-monitor-parity.test.ts` fails when either side drifts.
