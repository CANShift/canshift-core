import { BASE_DISPLAY_TIER } from '../display-tiers.js'

import { gaugeValueFontSize } from './gauge.js'
import { labelFontSize } from './label-gear.js'
import { deviceValueFontPx } from './value-font.js'

export const VALUE_FACE_ADVANCE_PX: Readonly<Record<number, number>> = {
  13: 8,
  15: 9,
  17: 10,
  22: 13,
  32: 19,
  44: 26,
  48: 29,
  64: 38,
  84: 50,
}

export const UNIT_FACE = { px: 10, advancePx: 6 } as const

export const VALUE_RIGHT_INSET_PX = 8

export const VALUE_TRACKING_STEPS = [
  { minPx: 40, trackingPx: -2 },
  { minPx: 14, trackingPx: -1 },
  { minPx: 0, trackingPx: 0 },
] as const

export const FORMAT_MAX_DECIMALS = 9

export const valueTrackingPx = (devicePx: number): number =>
  VALUE_TRACKING_STEPS.find((step) => devicePx >= step.minPx)?.trackingPx ?? 0

const snappedFace = (devicePx: number): number => {
  const faces = BASE_DISPLAY_TIER.valueFaces
  return faces.filter((face) => face <= devicePx).at(-1) ?? faces[0] ?? UNIT_FACE.px
}

export const valueFaceAdvancePx = (devicePx: number): number => {
  const smallest = BASE_DISPLAY_TIER.valueFaces[0] ?? UNIT_FACE.px
  if (devicePx < smallest) return UNIT_FACE.advancePx
  return VALUE_FACE_ADVANCE_PX[snappedFace(devicePx)] ?? UNIT_FACE.advancePx
}

export const textWidthPx = (text: string, advancePx: number, trackingPx: number): number => {
  const glyphs = Array.from(text).length
  if (glyphs === 0) return 0
  return glyphs * (advancePx + trackingPx) - trackingPx
}

export const formatFixedReading = (value: number, decimals: number): string => {
  const places = Math.min(Math.max(Math.trunc(decimals), 0), FORMAT_MAX_DECIMALS)
  const f32 = Math.fround(value)
  const scale = 10 ** places
  const scaled = Math.trunc(Math.fround(Math.fround(Math.abs(f32) * scale) + 0.5))
  const whole = String(Math.trunc(scaled / scale))
  const frac = places === 0 ? '' : `.${String(scaled % scale).padStart(places, '0')}`
  return `${f32 < 0 ? '-' : ''}${whole}${frac}`
}

export const widestConfiguredValue = (minValue: number, maxValue: number): number =>
  -minValue > maxValue ? minValue : maxValue

export interface GaugeFontInputs {
  displayStyle: 'numeric' | 'arc'
  big?: number | undefined
}

export const gaugeDeviceValuePx = (cfg: GaugeFontInputs, width: number, height: number): number => {
  if (cfg.displayStyle === 'arc') return gaugeValueFontSize(height, cfg.big)
  return cfg.big !== undefined && cfg.big > 0
    ? deviceValueFontPx(cfg.big)
    : labelFontSize(width, height)
}

export interface ValueFitSpec {
  widestValue: number
  decimalPlaces: number
  prefix: string
  unit: string
  valueFontPx: number
  columnWidth: number
}

export interface ValueFit {
  reading: string
  unit: string
  neededPx: number
  availablePx: number
  fits: boolean
}

export const measureValueFit = (spec: ValueFitSpec): ValueFit => {
  const reading = `${spec.prefix}${formatFixedReading(spec.widestValue, spec.decimalPlaces)}`
  const valuePx = textWidthPx(
    reading,
    valueFaceAdvancePx(spec.valueFontPx),
    valueTrackingPx(spec.valueFontPx)
  )
  const neededPx = valuePx + textWidthPx(spec.unit, UNIT_FACE.advancePx, 0)
  const availablePx = spec.columnWidth - VALUE_RIGHT_INSET_PX
  return { reading, unit: spec.unit, neededPx, availablePx, fits: neededPx <= availablePx }
}
