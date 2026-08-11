import { hex } from '../colors/hex.js'

export const SECONDARY_BAR = {
  heightPx: 3,
  topGapPx: 7,
} as const

export const SHIFT_LIGHT = {
  segments: 12,
  gapPx: 3,
  defaultRedSegments: 5,
  defaultStartRpm: 3000,
  litColor: hex('#FFFFFF'),
  redColor: hex('#FF4444'),
  trackColor: hex('#222222'),
} as const

export const shiftLightLitSegments = (
  value: number,
  startValue: number,
  fullValue: number
): number => {
  if (!(fullValue > startValue)) return 0
  const pct = (value - startValue) / (fullValue - startValue)
  if (pct <= 0) return 0
  if (pct >= 1) return SHIFT_LIGHT.segments
  return Math.floor(pct * SHIFT_LIGHT.segments)
}
