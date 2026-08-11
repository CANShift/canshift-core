import { hex } from '../colors/hex.js'
import type { HexColor } from '../schemas/common.js'

import { WIDGET_ZONE_COLORS } from './colors.js'
import { clamp01, sizeForHeight } from './scale.js'
import { deviceValueFontPx } from './value-font.js'

export const GAUGE_ARC = {
  sweepDeg: 270,
  rotationDeg: 135,
  strokeRatio: 0.3,
  strokeWidthFloor: 5,
  strokeWidthRatioW: 0.48,
  strokeWidthRatioH: 0.49,
  minDiameter: 40,
  containerPadding: 4,
  yShift: 2,
} as const

export const GAUGE_TRACK_COLORS = {
  plain: hex('#222222'),
} as const satisfies Record<'plain', HexColor>

export const WIDGET_TOP_RULE = {
  primaryPx: 2,
  secondaryPx: 1,
  primaryFontMin: 32,
  trackColor: GAUGE_TRACK_COLORS.plain,
  dangerColor: WIDGET_ZONE_COLORS.danger,
} as const

export const widgetTopRulePx = (valueFontSize: number): number =>
  valueFontSize >= WIDGET_TOP_RULE.primaryFontMin
    ? WIDGET_TOP_RULE.primaryPx
    : WIDGET_TOP_RULE.secondaryPx

export const GAUGE_VALUE_FONT_BREAKPOINTS = [
  { minHeight: 90, size: 48 },
  { minHeight: 40, size: 17 },
  { minHeight: 0, size: 10 },
] as const

export const gaugeValueFontSize = (height: number, big?: number): number =>
  big !== undefined ? deviceValueFontPx(big) : sizeForHeight(GAUGE_VALUE_FONT_BREAKPOINTS, height)

export const gaugeArcStrokeWidth = (width: number, height: number): number => {
  const radius = Math.min(width * GAUGE_ARC.strokeWidthRatioW, height * GAUGE_ARC.strokeWidthRatioH)
  const stroke = radius * GAUGE_ARC.strokeRatio
  return stroke < GAUGE_ARC.strokeWidthFloor ? GAUGE_ARC.strokeWidthFloor : stroke
}

export const gaugeValueAngle = (value: number, min: number, max: number): number => {
  const span = max - min
  const pct = span > 0 ? clamp01((value - min) / span) : 0
  return pct * GAUGE_ARC.sweepDeg
}

const gaugeArcPoint = (cx: number, cy: number, r: number, angleDeg: number): [number, number] => {
  const rad = (angleDeg * Math.PI) / 180
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)]
}

export const gaugeArcPath = (
  cx: number,
  cy: number,
  r: number,
  startDeg: number,
  endDeg: number
): string => {
  const [x0, y0] = gaugeArcPoint(cx, cy, r, startDeg)
  const [x1, y1] = gaugeArcPoint(cx, cy, r, endDeg)
  const largeArc = endDeg - startDeg > 180 ? 1 : 0
  return `M ${x0.toFixed(2)} ${y0.toFixed(2)} A ${String(r)} ${String(r)} 0 ${String(largeArc)} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`
}
