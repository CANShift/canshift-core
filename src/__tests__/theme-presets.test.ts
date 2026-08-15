import { DEFAULT_PAGE_PALETTE, ThemePresetSchema } from '../schemas/dashboard.js'
import type { ThemeFace } from '../schemas/dashboard.js'
import { DAY_BG_DEFAULT, DAY_PALETTE_DEFAULT } from '../day-theme-defaults.js'
import {
  DEFAULT_THEME_ID,
  THEME_PRESETS,
  defaultThemePreset,
  themePresetById,
} from '../theme-presets.js'

const channel = (hex: string, offset: number): number => {
  const value = parseInt(hex.slice(offset, offset + 2), 16) / 255
  return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
}

const luminance = (hex: string): number =>
  0.2126 * channel(hex, 1) + 0.7152 * channel(hex, 3) + 0.0722 * channel(hex, 5)

const contrast = (a: string, b: string): number => {
  const [lighter, darker] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return ((lighter ?? 0) + 0.05) / ((darker ?? 0) + 0.05)
}

const faces = (): [string, ThemeFace][] =>
  THEME_PRESETS.flatMap((entry) => [
    [`${entry.id}/night`, entry.preset.night] as [string, ThemeFace],
    [`${entry.id}/day`, entry.preset.day] as [string, ThemeFace],
  ])

const DELIBERATELY_DIM = new Set(['endurance/night'])

describe('THEME_PRESETS', () => {
  it('ships one entry per identity, in order', () => {
    expect(THEME_PRESETS.map((t) => t.id)).toEqual([
      'default',
      'endurance',
      'rally',
      'drag',
      'circuit',
      'ice',
      'paper',
    ])
  })

  it.each(THEME_PRESETS.map((t) => [t.id, t] as const))(
    '%s validates against ThemePresetSchema',
    (_id, entry) => {
      expect(() => ThemePresetSchema.parse(entry.preset)).not.toThrow()
    }
  )

  it('every identity owns both faces, each with a full palette', () => {
    for (const [label, themeFace] of faces()) {
      expect(themeFace.palette, label).toBeDefined()
    }
  })

  it('the default identity keeps the device palette as its night face', () => {
    const preset = defaultThemePreset()
    expect(preset.night.palette).toEqual(DEFAULT_PAGE_PALETTE)
    expect(preset.night.bgColor).toBe('#121212')
  })

  it('the default identity keeps the day defaults as its day face', () => {
    const preset = defaultThemePreset()
    expect(preset.day.palette).toEqual(DAY_PALETTE_DEFAULT)
    expect(preset.day.bgColor).toBe(DAY_BG_DEFAULT)
  })

  it('ids are unique and kebab-case', () => {
    const ids = THEME_PRESETS.map((t) => t.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const id of ids) {
      expect(id).toMatch(/^[a-z][a-z0-9-]*$/)
    }
  })

  it('every night face is darker than its own day face', () => {
    for (const entry of THEME_PRESETS) {
      expect(luminance(entry.preset.night.bgColor), entry.id).toBeLessThan(
        luminance(entry.preset.day.bgColor)
      )
    }
  })

  it('text clears 4.5:1 against its own ground and surface', () => {
    for (const [label, themeFace] of faces()) {
      if (DELIBERATELY_DIM.has(label)) continue
      const palette = themeFace.palette
      if (!palette) continue
      expect(contrast(palette.text, themeFace.bgColor), `${label} text/bg`).toBeGreaterThanOrEqual(
        4.5
      )
      expect(
        contrast(palette.text, palette.surface),
        `${label} text/surface`
      ).toBeGreaterThanOrEqual(4.5)
    }
  })

  it('every alert colour clears 3:1 against its own ground', () => {
    for (const [label, themeFace] of faces()) {
      if (DELIBERATELY_DIM.has(label)) continue
      const palette = themeFace.palette
      if (!palette) continue
      for (const key of ['primary', 'accent', 'warning', 'danger', 'success'] as const) {
        expect(contrast(palette[key], themeFace.bgColor), `${label} ${key}/bg`).toBeGreaterThan(3)
      }
    }
  })

  it('endurance stays deliberately dim, and is the only face exempt', () => {
    const endurance = themePresetById('endurance')?.preset.night
    const palette = endurance?.palette
    if (!endurance || !palette) throw new Error('endurance night face is missing')
    expect(contrast(palette.text, endurance.bgColor)).toBeLessThan(8)
    expect([...DELIBERATELY_DIM]).toEqual(['endurance/night'])
  })

  it('themePresetById returns undefined for unknown ids', () => {
    expect(themePresetById('nope')).toBeUndefined()
  })

  it('defaultThemePreset resolves the default id', () => {
    expect(defaultThemePreset()).toBe(themePresetById(DEFAULT_THEME_ID)?.preset)
  })
})
