import { fontSizeFromRatios } from './scale.js'

export const LABEL_FONT_RATIO = {
  height: { numerator: 65, denominator: 100 },
  width: { numerator: 52, denominator: 100 },
} as const

export const labelFontSize = (width: number, height: number): number =>
  fontSizeFromRatios(width, height, LABEL_FONT_RATIO)

export const GEAR_FONT_RATIO = {
  height: { numerator: 85, denominator: 100 },
  width: { numerator: 72, denominator: 100 },
} as const

export const gearFontSize = (width: number, height: number): number =>
  fontSizeFromRatios(width, height, GEAR_FONT_RATIO)

export const GEAR_NEUTRAL_GLYPH = 'N'
export const GEAR_REVERSE_GLYPH = 'R'

export const gearGlyph = (gear: number): string => {
  const rounded = Math.trunc(gear)
  if (rounded === 0) return GEAR_NEUTRAL_GLYPH
  if (rounded < 0) return GEAR_REVERSE_GLYPH
  return String(rounded)
}
