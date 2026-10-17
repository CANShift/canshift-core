import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { DASH_SIGNALS, WHEEL_BUTTON_SIGNALS, isDashSignal } from '../constants/dash-signals.js'

const here = dirname(fileURLToPath(import.meta.url))
const SIGNAL_MAP = resolve(here, '../../../canshift-firmware/rust/signal-map/src/lib.rs')

const firmwareNames = (source: string): string[] => {
  const table = /const NAME_TO_ID[^=]*=\s*&\[([\s\S]*?)\];/.exec(source)?.[1] ?? ''
  return [...table.matchAll(/\("([a-z0-9_]+)",/g)].map((match) => match[1] ?? '')
}

const describeIfFirmware = existsSync(SIGNAL_MAP) ? describe : describe.skip

describeIfFirmware('dash signal catalog parity', () => {
  const names = existsSync(SIGNAL_MAP) ? firmwareNames(readFileSync(SIGNAL_MAP, 'utf8')) : []

  it('reads a non-empty table from the firmware', () => {
    expect(names.length).toBeGreaterThan(0)
  })

  it('lists exactly the names the firmware stores', () => {
    expect([...DASH_SIGNALS].sort()).toEqual([...names].sort())
  })
})

describe('DASH_SIGNALS', () => {
  it('includes every wheel button slot once', () => {
    WHEEL_BUTTON_SIGNALS.forEach((slot) => {
      expect(DASH_SIGNALS.filter((name) => name === slot)).toHaveLength(1)
    })
  })

  it('has no duplicates', () => {
    expect(new Set(DASH_SIGNALS).size).toBe(DASH_SIGNALS.length)
  })

  it('tells a catalog name from anything else', () => {
    expect(isDashSignal('wheel_button_1')).toBe(true)
    expect(isDashSignal('rpm')).toBe(true)
    expect(isDashSignal('scan_signal_1')).toBe(false)
    expect(isDashSignal('')).toBe(false)
  })
})
