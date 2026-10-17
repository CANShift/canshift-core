import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { SENSOR_DEFAULT_RAMPS } from '../sensor-defaults.js'
import type { SensorKind } from '../sensor-defaults.js'
import type { SignalLimits } from '../widget-metrics/index.js'

const here = dirname(fileURLToPath(import.meta.url))
const FIRMWARE_CONFIG = resolve(here, '../../../canshift-firmware/data/config')
const SIGNALS_JSON = resolve(FIRMWARE_CONFIG, 'signals.json')
const DASHBOARD_JSON = resolve(FIRMWARE_CONFIG, 'dashboard.json')

const AMBER = '#CC8800'
const RED = '#CC3333'

const KIND_SIGNALS: Partial<Record<SensorKind, string>> = {
  coolant_temp: 'coolant_temp_c',
  oil_temp: 'oil_temp_c',
  oil_press: 'oil_press_bar',
  battery_volts: 'battery_volts',
  rpm: 'rpm',
  boost: 'boost_bar',
  intake_temp: 'iat_c',
  egt: 'egt_c',
}

interface CatalogueSignal extends SignalLimits {
  name: string
}

const catalogue = (): Map<string, CatalogueSignal> => {
  const parsed = JSON.parse(readFileSync(SIGNALS_JSON, 'utf8')) as { signals: CatalogueSignal[] }
  return new Map(parsed.signals.map((signal) => [signal.name, signal]))
}

interface BundledGauge {
  id: string
  signal: string
  config: { type: string; dangerLevel?: number; dangerBelow?: boolean }
}

const bundledGauges = (): BundledGauge[] => {
  const parsed = JSON.parse(readFileSync(DASHBOARD_JSON, 'utf8')) as {
    pages: { widgets: BundledGauge[] }[]
  }
  return parsed.pages.flatMap((page) => page.widgets).filter((w) => w.config.type === 'gauge')
}

const catalogueDanger = (signal: CatalogueSignal): { level: number; below: boolean } | null => {
  if (signal.highDangerLevel !== undefined) return { level: signal.highDangerLevel, below: false }
  if (signal.dangerLevel === undefined) return null
  const below = signal.warningLevel !== undefined && signal.warningLevel > signal.dangerLevel
  return { level: signal.dangerLevel, below }
}

const stopsOf = (kind: SensorKind, color: string): number[] =>
  SENSOR_DEFAULT_RAMPS[kind].stops.filter((stop) => stop.color === color).map((stop) => stop.value)

const levelsOf = (signal: CatalogueSignal | undefined, keys: (keyof SignalLimits)[]): number[] =>
  keys
    .map((key) => signal?.[key])
    .filter((level): level is number => level !== undefined)
    .sort((a, b) => a - b)

const describeIfFirmware = existsSync(SIGNALS_JSON) ? describe : describe.skip

describeIfFirmware('sensor ramps follow the bundled catalogue', () => {
  const signals = existsSync(SIGNALS_JSON) ? catalogue() : new Map<string, CatalogueSignal>()
  const kinds = Object.entries(KIND_SIGNALS) as [SensorKind, string][]

  it.each(kinds)('%s turns amber at the catalogue warning levels', (kind, name) => {
    expect(stopsOf(kind, AMBER)).toEqual(
      levelsOf(signals.get(name), ['warningLevel', 'highWarningLevel'])
    )
  })

  it.each(kinds)('%s turns red at the catalogue danger levels', (kind, name) => {
    expect(stopsOf(kind, RED)).toEqual(
      levelsOf(signals.get(name), ['dangerLevel', 'highDangerLevel'])
    )
  })
})

describeIfFirmware('bundled gauges follow the bundled catalogue', () => {
  const signals = existsSync(SIGNALS_JSON) ? catalogue() : new Map<string, CatalogueSignal>()
  const armed = existsSync(DASHBOARD_JSON)
    ? bundledGauges().flatMap((gauge) => {
        const signal = signals.get(gauge.signal)
        const danger = signal === undefined ? null : catalogueDanger(signal)
        return danger === null ? [] : [{ gauge, danger }]
      })
    : []

  it('finds gauges on catalogue signals', () => {
    expect(armed.length).toBeGreaterThan(0)
  })

  it.each(armed.map(({ gauge, danger }) => [gauge.id, gauge, danger] as const))(
    '%s carries its signal danger level',
    (_id, gauge, danger) => {
      expect({
        level: gauge.config.dangerLevel,
        below: gauge.config.dangerBelow === true,
      }).toEqual(danger)
    }
  )
})
