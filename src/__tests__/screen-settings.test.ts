import { ScreenSettingsSchema, SCREEN_SETTINGS_BOUNDS, parseSettings } from '../index.js'

describe('ScreenSettingsSchema', () => {
  describe('valid payloads', () => {
    it('accepts the minimal { brightness } shape', () => {
      const result = ScreenSettingsSchema.safeParse({ brightness: 80 })
      expect(result.success).toBe(true)
    })

    it('accepts an optional rotation of 0', () => {
      const result = ScreenSettingsSchema.safeParse({ brightness: 50, rotation: 0 })
      expect(result.success).toBe(true)
    })

    it('accepts an optional rotation of 180', () => {
      const result = ScreenSettingsSchema.safeParse({ brightness: 50, rotation: 180 })
      expect(result.success).toBe(true)
    })

    it('accepts brightness at the lower bound (10)', () => {
      const result = ScreenSettingsSchema.safeParse({ brightness: 10 })
      expect(result.success).toBe(true)
    })

    it('accepts brightness at the upper bound (100)', () => {
      const result = ScreenSettingsSchema.safeParse({ brightness: 100 })
      expect(result.success).toBe(true)
    })
  })

  describe('brightness bounds', () => {
    it('rejects brightness below 10 (firmware floors anything <10 to default)', () => {
      const result = ScreenSettingsSchema.safeParse({ brightness: 9 })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some((i) => i.path.includes('brightness'))).toBe(true)
      }
    })

    it('rejects the audit repro case brightness=-9999', () => {
      const result = ScreenSettingsSchema.safeParse({ brightness: -9999 })
      expect(result.success).toBe(false)
    })

    it('rejects brightness above 100', () => {
      const result = ScreenSettingsSchema.safeParse({ brightness: 101 })
      expect(result.success).toBe(false)
    })

    it('rejects non-integer brightness', () => {
      const result = ScreenSettingsSchema.safeParse({ brightness: 50.5 })
      expect(result.success).toBe(false)
    })

    it('rejects non-finite brightness (NaN)', () => {
      const result = ScreenSettingsSchema.safeParse({ brightness: Number.NaN })
      expect(result.success).toBe(false)
    })

    it('rejects non-finite brightness (+Infinity)', () => {
      const result = ScreenSettingsSchema.safeParse({
        brightness: Number.POSITIVE_INFINITY,
      })
      expect(result.success).toBe(false)
    })
  })

  describe('rotation', () => {
    it('rejects rotation = 90', () => {
      const result = ScreenSettingsSchema.safeParse({ brightness: 80, rotation: 90 })
      expect(result.success).toBe(false)
    })

    it('rejects rotation = 360', () => {
      const result = ScreenSettingsSchema.safeParse({ brightness: 80, rotation: 360 })
      expect(result.success).toBe(false)
    })
  })

  describe('strict object', () => {
    it('rejects unknown top-level keys', () => {
      const result = ScreenSettingsSchema.safeParse({
        brightness: 80,
        mystery: 'nope',
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some((i) => i.code === 'unrecognized_keys')).toBe(true)
      }
    })

    it('rejects missing brightness', () => {
      const result = ScreenSettingsSchema.safeParse({})
      expect(result.success).toBe(false)
    })
  })

  describe('SCREEN_SETTINGS_BOUNDS', () => {
    it('matches the schema bounds the studio UI consumes', () => {
      expect(SCREEN_SETTINGS_BOUNDS.brightnessMinPct).toBe(10)
      expect(SCREEN_SETTINGS_BOUNDS.brightnessMaxPct).toBe(100)
      expect(SCREEN_SETTINGS_BOUNDS.allowedRotations).toEqual([0, 180])
    })
  })
})

describe('parseSettings', () => {
  it('returns ok for valid JSON within bounds', () => {
    const result = parseSettings(JSON.stringify({ brightness: 50 }))
    expect(result).toEqual({ kind: 'ok', settings: { brightness: 50 } })
  })

  it('accepts an optional rotation', () => {
    const result = parseSettings(JSON.stringify({ brightness: 50, rotation: 180 }))
    expect(result).toEqual({ kind: 'ok', settings: { brightness: 50, rotation: 180 } })
  })

  it('flags invalid JSON', () => {
    expect(parseSettings('{not json').kind).toBe('invalid_json')
  })

  it('flags non-object payloads', () => {
    expect(parseSettings('42').kind).toBe('not_an_object')
    expect(parseSettings('[1,2]').kind).toBe('not_an_object')
  })

  it('flags wrong shapes', () => {
    expect(parseSettings(JSON.stringify({ brightness: 'x' })).kind).toBe('wrong_shape')
    expect(parseSettings(JSON.stringify({})).kind).toBe('wrong_shape')
  })

  it('enforces bounds on the wire', () => {
    expect(parseSettings(JSON.stringify({ brightness: 5 })).kind).toBe('wrong_shape')
    expect(parseSettings(JSON.stringify({ brightness: 200 })).kind).toBe('wrong_shape')
  })
})
