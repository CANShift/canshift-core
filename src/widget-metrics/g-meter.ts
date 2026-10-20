export const G_METER_RANGE_G = {
  min: 0.5,
  max: 3,
  default: 1.5,
} as const

export const G_METER = {
  plotTopInsetPx: 4,
  plotBottomInsetPx: 3,
  plotRightInsetPx: 8,
  readoutColumnPx: 52,
  readoutTopPx: 16,
  dotSidePx: 6,
  strokePx: 1,
  valueFontPx: 17,
  valueDecimals: 2,
  innerRingDivisor: 2,
  unit: 'g',
  defaultKicker: 'G',
  noImuReason: 'NO IMU',
} as const

const DIAGONAL = Math.SQRT1_2

const toPixel = (value: number): number => Math.trunc(value) || 0

export const G_METER_SECTOR_DIRECTIONS: readonly (readonly [number, number])[] = [
  [0, 1],
  [DIAGONAL, DIAGONAL],
  [1, 0],
  [DIAGONAL, -DIAGONAL],
  [0, -1],
  [-DIAGONAL, -DIAGONAL],
  [-1, 0],
  [-DIAGONAL, DIAGONAL],
]

export interface GMeterPlotBox {
  x: number
  y: number
  side: number
}

export interface GMeterOffset {
  dx: number
  dy: number
}

export const gMeterPlotBox = (boxW: number, boxH: number): GMeterPlotBox => {
  const byHeight = boxH - G_METER.plotTopInsetPx - G_METER.plotBottomInsetPx
  const byWidth = boxW - G_METER.plotRightInsetPx - G_METER.readoutColumnPx
  const side = Math.max(0, Math.min(byHeight, byWidth))
  return { x: boxW - G_METER.plotRightInsetPx - side, y: G_METER.plotTopInsetPx, side }
}

export const gMeterFeltForce = (lateralG: number, longitudinalG: number): [number, number] => [
  -lateralG,
  -longitudinalG,
]

export const gMeterPlotOffset = (
  x: number,
  y: number,
  rangeG: number,
  radiusPx: number
): GMeterOffset => {
  if (rangeG <= 0 || radiusPx <= 0) return { dx: 0, dy: 0 }
  const magnitude = Math.hypot(x, y)
  const clamp = magnitude > rangeG ? rangeG / magnitude : 1
  const k = (clamp * radiusPx) / rangeG
  return { dx: toPixel(x * k), dy: toPixel(-y * k) }
}

export const gMeterEnvelopeVertex = (
  peakG: number,
  sector: number,
  rangeG: number,
  radiusPx: number
): GMeterOffset => {
  const [ux, uy] = G_METER_SECTOR_DIRECTIONS[sector % G_METER_SECTOR_DIRECTIONS.length] ?? [0, 0]
  return gMeterPlotOffset(ux * peakG, uy * peakG, rangeG, radiusPx)
}
