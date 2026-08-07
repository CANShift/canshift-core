import { TrackTelemetrySchema, parseTrackTelemetry } from '../index.js'

describe('TrackTelemetrySchema', () => {
  it('accepts the minimal { trackMode } shape', () => {
    expect(TrackTelemetrySchema.safeParse({ trackMode: true }).success).toBe(true)
    expect(TrackTelemetrySchema.safeParse({ trackMode: false }).success).toBe(true)
  })

  it('accepts a fully-populated payload', () => {
    const full = {
      trackMode: true,
      currentLapMs: 84213,
      lastLapMs: 85990,
      bestLapMs: 83120,
      lapNumber: 7,
      deltaMs: -1770,
      isBestLap: false,
    }
    expect(TrackTelemetrySchema.safeParse(full).success).toBe(true)
  })

  it('requires trackMode', () => {
    expect(TrackTelemetrySchema.safeParse({ currentLapMs: 1000 }).success).toBe(false)
  })

  it('rejects a non-boolean trackMode', () => {
    expect(TrackTelemetrySchema.safeParse({ trackMode: 1 }).success).toBe(false)
  })

  it('bounds lap times to [0, 1h] and requires whole ms', () => {
    expect(TrackTelemetrySchema.safeParse({ trackMode: true, currentLapMs: -1 }).success).toBe(
      false
    )
    expect(
      TrackTelemetrySchema.safeParse({ trackMode: true, bestLapMs: 60 * 60 * 1000 + 1 }).success
    ).toBe(false)
    expect(TrackTelemetrySchema.safeParse({ trackMode: true, lastLapMs: 1.5 }).success).toBe(false)
  })

  it('bounds lapNumber and the signed delta', () => {
    expect(TrackTelemetrySchema.safeParse({ trackMode: true, lapNumber: 10000 }).success).toBe(
      false
    )
    expect(TrackTelemetrySchema.safeParse({ trackMode: true, lapNumber: -1 }).success).toBe(false)
    expect(
      TrackTelemetrySchema.safeParse({ trackMode: true, deltaMs: -(60 * 60 * 1000 + 1) }).success
    ).toBe(false)
  })

  it('rejects unknown keys (strict)', () => {
    expect(TrackTelemetrySchema.safeParse({ trackMode: true, foo: 1 }).success).toBe(false)
  })

  it('rejects non-finite numbers', () => {
    expect(TrackTelemetrySchema.safeParse({ trackMode: true, currentLapMs: NaN }).success).toBe(
      false
    )
  })
})

describe('parseTrackTelemetry', () => {
  it('returns kind="ok" with the parsed telemetry for a valid payload', () => {
    const result = parseTrackTelemetry('{"trackMode":true,"currentLapMs":84213,"lapNumber":7}')
    expect(result).toEqual({
      kind: 'ok',
      telemetry: { trackMode: true, currentLapMs: 84213, lapNumber: 7 },
    })
  })

  it('returns kind="invalid_json" on parse failure and preserves raw input', () => {
    const result = parseTrackTelemetry('{trackMode:true')
    expect(result.kind).toBe('invalid_json')
    if (result.kind === 'invalid_json') expect(result.raw).toBe('{trackMode:true')
  })

  it('returns kind="not_an_object" for primitives and arrays', () => {
    expect(parseTrackTelemetry('true').kind).toBe('not_an_object')
    expect(parseTrackTelemetry('42').kind).toBe('not_an_object')
    expect(parseTrackTelemetry('[]').kind).toBe('not_an_object')
    expect(parseTrackTelemetry('null').kind).toBe('not_an_object')
  })

  it('returns kind="wrong_shape" with Zod issues when a field is invalid', () => {
    const result = parseTrackTelemetry('{"trackMode":true,"lapNumber":99999}')
    expect(result.kind).toBe('wrong_shape')
    if (result.kind === 'wrong_shape') expect(result.issues.length).toBeGreaterThan(0)
  })
})
