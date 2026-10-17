import {
  ALERT_ACK_COMMAND,
  ALERT_SOURCES,
  ALERT_SOURCE_ID_COUNT,
  BUILT_IN_ALERT_SIGNALS,
  FIRST_CONFIGURED_ALERT_ID,
  alertAckCommand,
  alertOriginFromId,
} from '../wire/alert-sources.js'
import { FIRMWARE_CAPS } from '../constants/firmware-caps.js'
import {
  ALERT_FRAME_VERSION,
  MAX_ALERT_ACTIVE_SECONDS,
  decodeAlertFrame,
  encodeAlertFrame,
  type ActiveAlert,
} from '../wire/alert-frame.js'
import { STRING_CAPS } from '../constants/firmware-caps.js'
import {
  CONFIGURED_AND_COOLANT_ALERTS,
  CONFIGURED_AND_COOLANT_VECTOR,
  OIL_PRESSURE_ALERT,
  OIL_PRESSURE_VECTOR,
} from './__fixtures__/alert-frame-vectors.js'

const bytesOf = (alerts: readonly ActiveAlert[]): number[] =>
  Array.from(encodeAlertFrame(alerts) ?? [])

describe('alert-frame canonical vectors shared with the firmware encoder', () => {
  it('encodes no alert as the version and a zero count', () => {
    expect(bytesOf([])).toEqual([ALERT_FRAME_VERSION, 0x00])
    expect(decodeAlertFrame(Uint8Array.from([ALERT_FRAME_VERSION, 0x00]))).toEqual([])
  })

  it('encodes the displayed oil pressure alert byte for byte', () => {
    expect(bytesOf([OIL_PRESSURE_ALERT])).toEqual(OIL_PRESSURE_VECTOR)
    expect(decodeAlertFrame(Uint8Array.from(OIL_PRESSURE_VECTOR))).toEqual([OIL_PRESSURE_ALERT])
  })

  it('encodes the second configured entry next to an acknowledged built-in one', () => {
    expect(bytesOf(CONFIGURED_AND_COOLANT_ALERTS)).toEqual(CONFIGURED_AND_COOLANT_VECTOR)
    expect(decodeAlertFrame(Uint8Array.from(CONFIGURED_AND_COOLANT_VECTOR))).toEqual(
      CONFIGURED_AND_COOLANT_ALERTS
    )
  })
})

describe('alert-frame round trip', () => {
  it('keeps an alert whose limit the dash could not resolve', () => {
    const alert: ActiveAlert = { ...OIL_PRESSURE_ALERT, limit: null }
    expect(decodeAlertFrame(encodeAlertFrame([alert]) ?? new Uint8Array())).toEqual([alert])
  })

  it('carries a negative reading', () => {
    const alert: ActiveAlert = { ...OIL_PRESSURE_ALERT, value: -0.25 }
    expect(decodeAlertFrame(encodeAlertFrame([alert]) ?? new Uint8Array())).toEqual([alert])
  })

  it('saturates the active time instead of wrapping', () => {
    const decoded = decodeAlertFrame(
      encodeAlertFrame([{ ...OIL_PRESSURE_ALERT, activeSeconds: 100_000 }]) ?? new Uint8Array()
    )
    expect(decoded?.[0]?.activeSeconds).toBe(MAX_ALERT_ACTIVE_SECONDS)
  })
})

describe('alert-frame encode refusals', () => {
  it('refuses a non-finite reading', () => {
    expect(encodeAlertFrame([{ ...OIL_PRESSURE_ALERT, value: Number.NaN }])).toBeNull()
  })

  it('refuses a signal key the firmware could not hold', () => {
    const tooLong = 'x'.repeat(STRING_CAPS.SIGNAL_NAME + 1)
    expect(encodeAlertFrame([{ ...OIL_PRESSURE_ALERT, signal: tooLong }])).toBeNull()
    expect(encodeAlertFrame([{ ...OIL_PRESSURE_ALERT, signal: '' }])).toBeNull()
    expect(encodeAlertFrame([{ ...OIL_PRESSURE_ALERT, signal: 'öl_druck' }])).toBeNull()
  })

  it('refuses the same source twice', () => {
    expect(encodeAlertFrame([OIL_PRESSURE_ALERT, OIL_PRESSURE_ALERT])).toBeNull()
  })

  it('refuses two alerts both on screen', () => {
    const coolant: ActiveAlert = {
      ...OIL_PRESSURE_ALERT,
      source: 'coolant_temp',
      configuredIndex: null,
    }
    expect(encodeAlertFrame([OIL_PRESSURE_ALERT, coolant])).toBeNull()
  })

  it('refuses the same configured entry twice but keeps two different ones', () => {
    const entry = (configuredIndex: number): ActiveAlert => ({
      ...OIL_PRESSURE_ALERT,
      source: 'configured',
      configuredIndex,
      displayed: false,
    })
    expect(encodeAlertFrame([entry(0), entry(0)])).toBeNull()
    expect(decodeAlertFrame(encodeAlertFrame([entry(0), entry(3)]) ?? new Uint8Array())).toEqual([
      entry(0),
      entry(3),
    ])
  })

  it('refuses a configured index the dash cannot hold', () => {
    const past: ActiveAlert = {
      ...OIL_PRESSURE_ALERT,
      source: 'configured',
      configuredIndex: FIRMWARE_CAPS.MAX_CRITICAL_ALERTS,
    }
    expect(encodeAlertFrame([past])).toBeNull()
    expect(encodeAlertFrame([{ ...past, configuredIndex: 0.5 }])).toBeNull()
  })
})

describe('alert-frame decode refusals', () => {
  it('rejects an unknown version byte, the single-alert version 1 included', () => {
    expect(decodeAlertFrame(Uint8Array.from([0x01, 0x00]))).toBeNull()
    expect(decodeAlertFrame(Uint8Array.from([0x03, 0x00]))).toBeNull()
  })

  it('rejects a frame shorter than the header', () => {
    expect(decodeAlertFrame(Uint8Array.from([ALERT_FRAME_VERSION]))).toBeNull()
  })

  it('rejects a truncated entry', () => {
    expect(decodeAlertFrame(Uint8Array.from(OIL_PRESSURE_VECTOR.slice(0, -1)))).toBeNull()
  })

  it('rejects trailing bytes after the last entry', () => {
    expect(decodeAlertFrame(Uint8Array.from([...OIL_PRESSURE_VECTOR, 0x00]))).toBeNull()
  })

  it('rejects a source id past the shared table', () => {
    const bytes = [...OIL_PRESSURE_VECTOR]
    bytes[2] = ALERT_SOURCE_ID_COUNT
    expect(decodeAlertFrame(Uint8Array.from(bytes))).toBeNull()
  })

  it('rejects reserved flag bits', () => {
    const bytes = [...OIL_PRESSURE_VECTOR]
    bytes[3] = 0x1b
    expect(decodeAlertFrame(Uint8Array.from(bytes))).toBeNull()
  })

  it('rejects the same source twice', () => {
    const entry = OIL_PRESSURE_VECTOR.slice(2).map((byte, index) => (index === 1 ? 0x03 : byte))
    expect(
      decodeAlertFrame(Uint8Array.from([ALERT_FRAME_VERSION, 0x02, ...entry, ...entry]))
    ).toBeNull()
  })

  it('rejects a count larger than the source table', () => {
    expect(
      decodeAlertFrame(Uint8Array.from([ALERT_FRAME_VERSION, ALERT_SOURCE_ID_COUNT + 1]))
    ).toBeNull()
  })
})

describe('alert sources', () => {
  it('fits the dash acknowledge bitmask and ends with the configured alerts', () => {
    expect(ALERT_SOURCE_ID_COUNT).toBeLessThanOrEqual(32)
    expect(ALERT_SOURCES.at(-1)).toBe('configured')
  })

  it('gives every configured entry its own id after the built-in ones', () => {
    expect(alertOriginFromId(FIRST_CONFIGURED_ALERT_ID - 1)).toEqual({
      source: 'diff_temp',
      configuredIndex: null,
    })
    expect(alertOriginFromId(FIRST_CONFIGURED_ALERT_ID + 2)).toEqual({
      source: 'configured',
      configuredIndex: 2,
    })
    expect(alertOriginFromId(ALERT_SOURCE_ID_COUNT)).toBeUndefined()
    expect(alertOriginFromId(-1)).toBeUndefined()
  })

  it('names the signal every built-in source watches', () => {
    expect(Object.keys(BUILT_IN_ALERT_SIGNALS)).toEqual(ALERT_SOURCES.slice(0, -1))
  })
})

describe('alert acknowledge command', () => {
  it('acknowledges whatever the dash shows when no source is named', () => {
    expect(JSON.parse(alertAckCommand())).toEqual({ cmd: ALERT_ACK_COMMAND })
  })

  it('names the source by its wire id', () => {
    expect(JSON.parse(alertAckCommand({ source: 'coolant_temp', configuredIndex: null }))).toEqual({
      cmd: 'ack_alert',
      source: 1,
    })
  })

  it('names a configured entry by its own wire id', () => {
    expect(JSON.parse(alertAckCommand({ source: 'configured', configuredIndex: 1 }))).toEqual({
      cmd: 'ack_alert',
      source: FIRST_CONFIGURED_ALERT_ID + 1,
    })
  })
})
