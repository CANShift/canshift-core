export const UNIT_SYSTEMS = ['metric', 'imperial'] as const

export type UnitSystem = (typeof UNIT_SYSTEMS)[number]

export const DEFAULT_UNIT_SYSTEM: UnitSystem = 'metric'

export interface UnitPair {
  metric: string
  imperial: string
  toImperial: (value: number) => number
  toMetric: (value: number) => number
}

const KMH_PER_MPH = 1.609344
const KM_PER_MI = 1.609344
const KPA_PER_PSI = 6.894757293168361
const BAR_PER_PSI = KPA_PER_PSI / 100
const FAHRENHEIT_PER_CELSIUS = 9 / 5
const FAHRENHEIT_OFFSET = 32

const linear =
  (factor: number) =>
  (value: number): number =>
    value / factor

const inverse =
  (factor: number) =>
  (value: number): number =>
    value * factor

export const UNIT_PAIRS: readonly UnitPair[] = [
  {
    metric: 'km/h',
    imperial: 'mph',
    toImperial: linear(KMH_PER_MPH),
    toMetric: inverse(KMH_PER_MPH),
  },
  { metric: 'km', imperial: 'mi', toImperial: linear(KM_PER_MI), toMetric: inverse(KM_PER_MI) },
  {
    metric: 'kPa',
    imperial: 'psi',
    toImperial: linear(KPA_PER_PSI),
    toMetric: inverse(KPA_PER_PSI),
  },
  {
    metric: 'bar',
    imperial: 'psi',
    toImperial: linear(BAR_PER_PSI),
    toMetric: inverse(BAR_PER_PSI),
  },
  {
    metric: '°C',
    imperial: '°F',
    toImperial: (value) => value * FAHRENHEIT_PER_CELSIUS + FAHRENHEIT_OFFSET,
    toMetric: (value) => (value - FAHRENHEIT_OFFSET) / FAHRENHEIT_PER_CELSIUS,
  },
]

const ALIASES: Record<string, string> = {
  c: '°C',
  degc: '°C',
  f: '°F',
  degf: '°F',
  kph: 'km/h',
  'km/hr': 'km/h',
  mi: 'mi',
  miles: 'mi',
}

const normalise = (unit: string): string => {
  const trimmed = unit.trim()
  const key = trimmed.toLowerCase().replace(/[°\s]/g, '')
  return ALIASES[key] ?? trimmed
}

const matches = (candidate: string, unit: string): boolean =>
  candidate.toLowerCase() === unit.toLowerCase()

export const unitPairFor = (unit: string): UnitPair | null => {
  const normalised = normalise(unit)
  return (
    UNIT_PAIRS.find(
      (pair) => matches(pair.metric, normalised) || matches(pair.imperial, normalised)
    ) ?? null
  )
}

export const hasUnitPair = (unit: string): boolean => unitPairFor(unit) !== null

const systemOf = (pair: UnitPair, unit: string): UnitSystem =>
  matches(pair.imperial, normalise(unit)) ? 'imperial' : 'metric'

export const displayUnit = (unit: string, system: UnitSystem): string => {
  const pair = unitPairFor(unit)
  if (!pair) return unit
  return system === 'imperial' ? pair.imperial : pair.metric
}

export const displayValue = (value: number, unit: string, system: UnitSystem): number => {
  const pair = unitPairFor(unit)
  if (!pair) return value
  const from = systemOf(pair, unit)
  if (from === system) return value
  return system === 'imperial' ? pair.toImperial(value) : pair.toMetric(value)
}

export const canonicalValue = (value: number, unit: string, system: UnitSystem): number => {
  const pair = unitPairFor(unit)
  if (!pair) return value
  const to = systemOf(pair, unit)
  if (to === system) return value
  return to === 'imperial' ? pair.toImperial(value) : pair.toMetric(value)
}
