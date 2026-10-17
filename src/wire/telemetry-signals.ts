import type { TelemetryFieldKey } from './telemetry-frame.js'

export const TELEMETRY_FIELD_SIGNALS: Readonly<Record<TelemetryFieldKey, string>> = {
  r: 'rpm',
  tps: 'throttle_pos',
  map: 'map_kpa',
  mi: 'map_number',
  bst: 'boost_bar',
  iat: 'iat_c',
  ct: 'coolant_temp_c',
  ot: 'oil_temp_c',
  op: 'oil_press_bar',
  fp: 'fuel_press_bar',
  lam: 'lambda_1',
  s: 'speed_kph',
  g: 'gear',
  bat: 'battery_volts',
}

export const TELEMETRY_KEEPALIVE_MS = 1000

const STALE_AFTER_KEEPALIVES = 2.5

export const TELEMETRY_STALE_MS = TELEMETRY_KEEPALIVE_MS * STALE_AFTER_KEEPALIVES
