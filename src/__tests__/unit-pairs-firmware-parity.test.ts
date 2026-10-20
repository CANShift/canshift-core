import { existsSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { UNIT_PAIRS } from '../units/convert.js'
import { firmwarePath, readFirmwareSource } from './firmware-source.js'

const UNIT_CONVERT = firmwarePath('rust/unit-convert/src/lib.rs')

const describeIfFirmware = existsSync(UNIT_CONVERT) ? describe : describe.skip

const symbolOf = (field: string, entry: string): string =>
  new RegExp(`${field}: (?:b)?"([^"\\\\]*)\\\\0"`).exec(entry)?.[1] ?? ''

const dropOf = (field: string, entry: string): number =>
  Number(new RegExp(`${field}: (\\d+)`).exec(entry)?.[1])

const firmwarePairs = (source: string) => {
  const table = /static UNIT_PAIRS[^=]*=\s*\[([\s\S]*?)\n\];/.exec(source)?.[1] ?? ''
  return [...table.matchAll(/UnitPair \{([\s\S]*?)\}/g)].map((m) => {
    const entry = m[1] ?? ''
    return {
      metric: symbolOf('metric', entry),
      imperial: symbolOf('imperial', entry),
      toImperialDrop: dropOf('to_imperial_drop', entry),
      toMetricDrop: dropOf('to_metric_drop', entry),
    }
  })
}

describeIfFirmware('unit pairs firmware parity', () => {
  it('pairs the same units and drops the same decimals as unit-convert', () => {
    const ours = UNIT_PAIRS.map(({ metric, imperial, toImperialDrop, toMetricDrop }) => ({
      metric,
      imperial,
      toImperialDrop,
      toMetricDrop,
    }))
    expect(firmwarePairs(readFirmwareSource(UNIT_CONVERT))).toEqual(ours)
  })
})
