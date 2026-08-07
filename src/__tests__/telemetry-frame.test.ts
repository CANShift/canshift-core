import {
  TELEMETRY_FIELDS,
  TELEMETRY_FRAME_VERSION,
  decodeTelemetryFrame,
  encodeTelemetryFrame,
  type TelemetryFrame,
} from '../wire/telemetry-frame.js'

describe('telemetry-frame', () => {
  it('round-trips a full frame with all fields', () => {
    const frame: TelemetryFrame = {
      r: 3500,
      tps: 45.5,
      map: 101,
      mi: 2,
      bst: 0.85,
      iat: 28,
      ct: 90,
      ot: 104,
      op: 3.2,
      fp: 3.5,
      lam: 0.98,
      s: 132,
      g: 4,
      bat: 13.8,
    }
    const decoded = decodeTelemetryFrame(encodeTelemetryFrame(frame))
    expect(decoded).toEqual(frame)
  })

  it('round-trips a sparse frame preserving field identity by index', () => {
    const frame: TelemetryFrame = { r: 6200, g: -1, bat: 12.4 }
    const decoded = decodeTelemetryFrame(encodeTelemetryFrame(frame))
    expect(decoded).toEqual(frame)
  })

  it('encodes an empty frame as header only', () => {
    const bytes = encodeTelemetryFrame({})
    expect(Array.from(bytes)).toEqual([TELEMETRY_FRAME_VERSION, 0x00, 0x00])
    expect(decodeTelemetryFrame(bytes)).toEqual({})
  })

  it('matches the canonical byte vector shared with the firmware encoder', () => {
    const frame: TelemetryFrame = { r: 3500, tps: 45.5, g: -1 }
    const expected = [
      0x01, 0x03, 0x10, 0xe0, 0x67, 0x35, 0x00, 0xbc, 0xb1, 0x00, 0x00, 0x18, 0xfc, 0xff, 0xff,
    ]
    expect(Array.from(encodeTelemetryFrame(frame))).toEqual(expected)
    expect(decodeTelemetryFrame(Uint8Array.from(expected))).toEqual(frame)
  })

  it('preserves three decimals of precision through the fixed scale', () => {
    const decoded = decodeTelemetryFrame(encodeTelemetryFrame({ lam: 0.987 }))
    expect(decoded?.lam).toBeCloseTo(0.987, 3)
  })

  it('skips non-finite values on encode', () => {
    const bytes = encodeTelemetryFrame({ r: Number.NaN, tps: 40 })
    expect(decodeTelemetryFrame(bytes)).toEqual({ tps: 40 })
  })

  it('rejects a frame shorter than the header', () => {
    expect(decodeTelemetryFrame(Uint8Array.from([0x01, 0x00]))).toBeNull()
  })

  it('rejects an unknown version byte', () => {
    expect(decodeTelemetryFrame(Uint8Array.from([0x02, 0x00, 0x00]))).toBeNull()
  })

  it('rejects reserved bits set above the field range', () => {
    expect(decodeTelemetryFrame(Uint8Array.from([0x01, 0x00, 0x80]))).toBeNull()
  })

  it('rejects a truncated value section', () => {
    expect(decodeTelemetryFrame(Uint8Array.from([0x01, 0x01, 0x00, 0xe0, 0x67]))).toBeNull()
  })

  it('keeps the field table in sync with the 16-bit mask budget', () => {
    expect(TELEMETRY_FIELDS.length).toBeLessThanOrEqual(16)
    expect(new Set(TELEMETRY_FIELDS).size).toBe(TELEMETRY_FIELDS.length)
  })
})
