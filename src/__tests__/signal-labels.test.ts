import { existsSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { NO_SIGNAL_LABEL, SIGNAL_LABELS, signalDisplayLabel } from '../constants/signal-labels.js'
import { firmwarePath, readFirmwareSource } from './firmware-source.js'

const PRESENTATION = firmwarePath('src/ui/signal_presentation.cpp')

const firmwareLabels = (source: string): [string, string][] => {
  const table = /constexpr Entry kEntries\[\] = \{([\s\S]*?)\n\};/.exec(source)?.[1] ?? ''
  return [...table.matchAll(/\{"([^"]*)",\s*"([^"]*)",/g)].map((match) => [
    match[1] ?? '',
    match[2] ?? '',
  ])
}

const describeIfFirmware = existsSync(PRESENTATION) ? describe : describe.skip

describeIfFirmware('signal label firmware parity', () => {
  const labels = firmwareLabels(readFirmwareSource(PRESENTATION))

  it('reads a non-empty table from the firmware', () => {
    expect(labels.length).toBeGreaterThan(0)
  })

  it('labels the same signals the same way, in the same order', () => {
    expect([...SIGNAL_LABELS]).toEqual(labels)
  })
})

describe('signalDisplayLabel', () => {
  it('names the six default pages the way the design comp does', () => {
    expect(signalDisplayLabel('coolant_temp_c')).toBe('WATER')
    expect(signalDisplayLabel('oil_temp_c')).toBe('OIL T')
    expect(signalDisplayLabel('oil_press_bar')).toBe('OIL PRESS')
    expect(signalDisplayLabel('fuel_level_pct')).toBe('FUEL')
    expect(signalDisplayLabel('odo_km')).toBe('ODO')
  })

  it('never gives two signals the same label, or a page reads OIL twice', () => {
    const labels = [...SIGNAL_LABELS.values()]
    expect(new Set(labels).size).toBe(labels.length)
  })

  it('falls back to the signal name for anything it does not curate', () => {
    expect(signalDisplayLabel('brake_temp_fl')).toBe('BRAKE TEMP FL')
    expect(signalDisplayLabel('__lap__time_')).toBe('LAP TIME')
    expect(signalDisplayLabel('constructor')).toBe('CONSTRUCTOR')
  })

  it('shows a dash when no signal is bound', () => {
    expect(signalDisplayLabel('')).toBe(NO_SIGNAL_LABEL)
  })
})
