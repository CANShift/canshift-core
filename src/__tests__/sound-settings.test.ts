import {
  ScreenSettingsSchema,
  SCREEN_SETTINGS_BOUNDS,
  parseSettings,
  screenSettingsToWire,
} from '../schemas/screen-settings.js'
import { UsbStatusWireSchema, parseUsbStatus } from '../schemas/usb-status.js'

const statusWire = { status: 'ok', version: '0.22.0', protocol: 3, is_day: 1 } as const

describe('sound fields in ScreenSettings', () => {
  it('accepts volume and both sound flags', () => {
    const settings = { brightness: 80, volume: 70, sounds: { boot: true, shiftTone: false } }
    expect(ScreenSettingsSchema.parse(settings)).toEqual(settings)
  })

  it('accepts a partial sounds object and volume 0', () => {
    expect(ScreenSettingsSchema.safeParse({ brightness: 80, volume: 0 }).success).toBe(true)
    expect(
      ScreenSettingsSchema.safeParse({ brightness: 80, sounds: { shiftTone: true } }).success
    ).toBe(true)
  })

  it('rejects a volume outside 0-100 or fractional', () => {
    for (const volume of [-1, 101, 50.5]) {
      expect(ScreenSettingsSchema.safeParse({ brightness: 80, volume }).success).toBe(false)
    }
  })

  it('rejects unknown sound keys, including a critical mute', () => {
    const result = ScreenSettingsSchema.safeParse({ brightness: 80, sounds: { critical: false } })
    expect(result.success).toBe(false)
  })

  it('exposes the volume bounds the tuner slider reads', () => {
    expect(SCREEN_SETTINGS_BOUNDS.volumeMinPct).toBe(0)
    expect(SCREEN_SETTINGS_BOUNDS.volumeMaxPct).toBe(100)
  })
})

describe('ScreenSettings wire mapping', () => {
  it('writes shiftTone as shift_tone', () => {
    const wire = screenSettingsToWire({ brightness: 60, volume: 40, sounds: { shiftTone: true } })
    expect(wire).toEqual({ brightness: 60, volume: 40, sounds: { shift_tone: true } })
  })

  it('reads the snake_case payload back into camelCase', () => {
    const raw = JSON.stringify({ brightness: 60, sounds: { boot: false, shift_tone: true } })
    expect(parseSettings(raw)).toEqual({
      kind: 'ok',
      settings: { brightness: 60, sounds: { boot: false, shiftTone: true } },
    })
  })
})

describe('sound in USB status', () => {
  it('maps volume and sounds on a board with audio', () => {
    const raw = JSON.stringify({
      ...statusWire,
      volume: 70,
      sounds: { boot: true, shift_tone: false },
    })
    const result = parseUsbStatus(raw)
    expect(result.kind).toBe('ok')
    if (result.kind !== 'ok') return
    expect(result.status.sound).toEqual({ volume: 70, boot: true, shiftTone: false })
  })

  it('leaves sound absent on a board without audio', () => {
    const result = parseUsbStatus(JSON.stringify(statusWire))
    expect(result.kind === 'ok' && result.status.sound === undefined).toBe(true)
  })

  it('rejects an out-of-range volume or an incomplete sounds object', () => {
    expect(UsbStatusWireSchema.safeParse({ ...statusWire, volume: 120 }).success).toBe(false)
    const partial = { ...statusWire, sounds: { boot: true } }
    expect(UsbStatusWireSchema.safeParse(partial).success).toBe(false)
  })
})
