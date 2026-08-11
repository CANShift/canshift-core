import { hex } from '../colors/hex.js'
import type { ColorRampStop } from '../schemas/signal.js'
import { SENSOR_DEFAULT_RAMPS } from '../sensor-defaults.js'
import type { SensorKind } from '../sensor-defaults.js'

export const SENSOR_DEFAULT_RANGES = {
  coolant_temp: { min: 0, max: 120 },
  oil_temp: { min: 0, max: 150 },
  oil_press: { min: 0, max: 8 },
  battery_volts: { min: 8, max: 16 },
  rpm: { min: 0, max: 8000 },
  afr: { min: 10, max: 18 },
  boost: { min: -1, max: 2 },
  intake_temp: { min: 0, max: 80 },
  egt: { min: 0, max: 1000 },
} as const satisfies Record<SensorKind, { min: number; max: number }>

export const sensorDefaultRange = (kind: SensorKind): { min: number; max: number } =>
  SENSOR_DEFAULT_RANGES[kind]

export const SENSOR_DANGER_COLOR = hex('#CC3333')

export interface SensorDangerThreshold {
  threshold: number
  invertLogic: boolean
}

const isDanger = (stop: ColorRampStop): boolean => stop.color === SENSOR_DANGER_COLOR

const leadingDangerStops = (stops: readonly ColorRampStop[]): ColorRampStop[] => {
  const run: ColorRampStop[] = []
  for (const stop of stops) {
    if (!isDanger(stop)) break
    run.push(stop)
  }
  return run
}

const trailingDangerStops = (stops: readonly ColorRampStop[]): ColorRampStop[] => {
  const run: ColorRampStop[] = []
  for (let i = stops.length - 1; i >= 0; i--) {
    const stop = stops[i]
    if (!stop || !isDanger(stop)) break
    run.unshift(stop)
  }
  return run
}

export const sensorDefaultDangerThreshold = (kind: SensorKind): SensorDangerThreshold => {
  const stops = SENSOR_DEFAULT_RAMPS[kind].stops
  const trailing = trailingDangerStops(stops)
  if (trailing.length > 0) {
    const entry = trailing[0]
    if (entry) return { threshold: entry.value, invertLogic: false }
  }
  const leading = leadingDangerStops(stops)
  const boundary = leading[leading.length - 1]
  if (boundary) return { threshold: boundary.value, invertLogic: true }
  return { threshold: SENSOR_DEFAULT_RANGES[kind].max, invertLogic: false }
}
