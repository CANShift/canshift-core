import { existsSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { SIGNAL_LABELS } from '../constants/signal-labels.js'
import { SIGNAL_FALLBACK_UNITS, signalUnitOnDash } from '../constants/signal-units.js'
import { firmwarePath, readFirmwareSource } from './firmware-source.js'

const PRESENTATION = firmwarePath('src/ui/signal_presentation.cpp')

const unescape = (text: string): string =>
  text.replace(/\\u([0-9a-fA-F]{4})/g, (_, hex: string) => String.fromCodePoint(parseInt(hex, 16)))

const firmwareUnits = (source: string): [string, string][] => {
  const table = /constexpr Entry kEntries\[\] = \{([\s\S]*?)\n\};/.exec(source)?.[1] ?? ''
  return [...table.matchAll(/\{"([^"]*)",\s*"[^"]*",\s*"([^"]*)"\}/g)].map((match) => [
    match[1] ?? '',
    unescape(match[2] ?? ''),
  ])
}

const describeIfFirmware = existsSync(PRESENTATION) ? describe : describe.skip

describeIfFirmware('signal fallback unit firmware parity', () => {
  it('falls back to the unit the dash draws, signal by signal, in order', () => {
    const units = firmwareUnits(readFirmwareSource(PRESENTATION))
    expect(units.length).toBeGreaterThan(0)
    expect([...SIGNAL_FALLBACK_UNITS]).toEqual(units)
  })
})

describe('signalUnitOnDash', () => {
  it('keeps the unit the signal declares', () => {
    expect(signalUnitOnDash('boost_bar', 'psi')).toBe('psi')
  })

  it('falls back when the car does not declare one, like the dash', () => {
    expect(signalUnitOnDash('boost_bar', undefined)).toBe('bar')
    expect(signalUnitOnDash('boost_bar', '')).toBe('bar')
  })

  it('is empty for a signal the dash does not know', () => {
    expect(signalUnitOnDash('not_a_signal', undefined)).toBe('')
  })

  it('covers the same signals as the label table', () => {
    expect([...SIGNAL_FALLBACK_UNITS.keys()]).toEqual([...SIGNAL_LABELS.keys()])
  })
})
