import { clamp } from '../math/clamp.js'

export interface Ratio {
  numerator: number
  denominator: number
}

export const truncDiv = (value: number, numerator: number, denominator: number): number =>
  Math.trunc((value * numerator) / denominator)

const applyRatio = (value: number, ratio: Ratio): number =>
  truncDiv(value, ratio.numerator, ratio.denominator)

export const clamp01 = (value: number): number => clamp(value, 0, 1)

export const WIDGET_FONT_CLAMP = { min: 10, max: 48 } as const

const clampFont = (size: number): number =>
  clamp(size, WIDGET_FONT_CLAMP.min, WIDGET_FONT_CLAMP.max)

export interface FontBreakpoint {
  minHeight: number
  size: number
}

export const sizeForHeight = (breakpoints: readonly FontBreakpoint[], height: number): number => {
  for (const bp of breakpoints) {
    if (height >= bp.minHeight) return bp.size
  }
  return breakpoints[breakpoints.length - 1]?.size ?? WIDGET_FONT_CLAMP.min
}

export const fontSizeFromRatios = (
  width: number,
  height: number,
  ratios: { height: Ratio; width: Ratio }
): number => clampFont(Math.min(applyRatio(height, ratios.height), applyRatio(width, ratios.width)))
