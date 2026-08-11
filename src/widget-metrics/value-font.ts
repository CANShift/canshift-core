import { truncDiv } from './scale.js'

export const VALUE_UNIT_FONT_SIZE = 10
export const VALUE_UNIT_RATIO = { numerator: 1, denominator: 4 } as const
export const VALUE_UNIT_FONT_MIN = 10
export const STALE_PLACEHOLDER = '- -'

export const valueUnitFontSize = (valueFontSize: number): number => {
  const size = truncDiv(valueFontSize, VALUE_UNIT_RATIO.numerator, VALUE_UNIT_RATIO.denominator)
  return size < VALUE_UNIT_FONT_MIN ? VALUE_UNIT_FONT_MIN : size
}

export const BIG_TO_DEVICE_FONT = [
  { minBig: 96, px: 48 },
  { minBig: 88, px: 44 },
  { minBig: 80, px: 40 },
  { minBig: 64, px: 32 },
  { minBig: 48, px: 24 },
  { minBig: 44, px: 22 },
  { minBig: 0, px: 17 },
] as const

export const deviceValueFontPx = (big: number): number =>
  BIG_TO_DEVICE_FONT.find((step) => big >= step.minBig)?.px ?? 17
