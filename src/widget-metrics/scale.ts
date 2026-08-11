export interface Ratio {
  numerator: number
  denominator: number
}

export const truncDiv = (value: number, numerator: number, denominator: number): number =>
  Math.trunc((value * numerator) / denominator)

const applyRatio = (value: number, ratio: Ratio): number =>
  truncDiv(value, ratio.numerator, ratio.denominator)

export const ratioScale = (ratio: Ratio): number => ratio.numerator / ratio.denominator

export const clamp01 = (value: number): number => (value < 0 ? 0 : value > 1 ? 1 : value)

export const WIDGET_FONT_CLAMP = { min: 10, max: 48 } as const

const clampFont = (size: number): number => {
  if (size < WIDGET_FONT_CLAMP.min) return WIDGET_FONT_CLAMP.min
  if (size > WIDGET_FONT_CLAMP.max) return WIDGET_FONT_CLAMP.max
  return size
}

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
