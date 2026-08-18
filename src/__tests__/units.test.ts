import { describe, expect, it } from 'vitest'
import {
  canonicalValue,
  displayUnit,
  displayValue,
  hasUnitPair,
  UNIT_PAIRS,
  unitPairFor,
} from '../units/convert.js'

const ROUND_TRIP_EPSILON = 1e-9

describe('unitPairFor', () => {
  it('matches either side of a pair, and the common spellings of temperature', () => {
    expect(unitPairFor('km/h')?.imperial).toBe('mph')
    expect(unitPairFor('mph')?.metric).toBe('km/h')
    expect(unitPairFor('°C')?.imperial).toBe('°F')
    expect(unitPairFor('C')?.imperial).toBe('°F')
    expect(unitPairFor('degF')?.metric).toBe('°C')
    expect(unitPairFor('kph')?.metric).toBe('km/h')
  })

  it('resolves psi to kPa, the unit an ECU actually broadcasts, not bar', () => {
    expect(unitPairFor('psi')?.metric).toBe('kPa')
    expect(displayValue(14.5038, 'psi', 'metric')).toBeCloseTo(100, 3)
  })

  it('has no pair for a unit with no imperial equivalent', () => {
    for (const unit of ['%', 'V', 'rpm', 'λ', '']) expect(hasUnitPair(unit)).toBe(false)
  })
})

describe('displayUnit', () => {
  it('renames a paired unit and leaves an unpaired one alone', () => {
    expect(displayUnit('km/h', 'imperial')).toBe('mph')
    expect(displayUnit('km/h', 'metric')).toBe('km/h')
    expect(displayUnit('mph', 'metric')).toBe('km/h')
    expect(displayUnit('rpm', 'imperial')).toBe('rpm')
  })
})

describe('displayValue', () => {
  it('converts the reference values of each pair', () => {
    expect(displayValue(100, 'km/h', 'imperial')).toBeCloseTo(62.1371, 4)
    expect(displayValue(100, '°C', 'imperial')).toBeCloseTo(212, 9)
    expect(displayValue(-40, '°C', 'imperial')).toBeCloseTo(-40, 9)
    expect(displayValue(1, 'bar', 'imperial')).toBeCloseTo(14.5038, 4)
    expect(displayValue(100, 'kPa', 'imperial')).toBeCloseTo(14.5038, 4)
    expect(displayValue(1, 'km', 'imperial')).toBeCloseTo(0.621371, 6)
  })

  it('leaves a value alone when it is already in the asked-for system', () => {
    expect(displayValue(100, 'km/h', 'metric')).toBe(100)
    expect(displayValue(60, 'mph', 'imperial')).toBe(60)
  })

  it('converts a signal already declared in imperial back to metric', () => {
    expect(displayValue(60, 'mph', 'metric')).toBeCloseTo(96.5606, 4)
    expect(displayValue(212, '°F', 'metric')).toBeCloseTo(100, 9)
  })

  it('leaves an unpaired unit untouched in either system', () => {
    expect(displayValue(7000, 'rpm', 'imperial')).toBe(7000)
    expect(displayValue(50, '%', 'imperial')).toBe(50)
  })
})

describe('round trip', () => {
  it('returns the original value for every pair, anchored on the declared unit', () => {
    const values = [-40, 0, 0.5, 1, 37.5, 100, 250.25]
    for (const pair of UNIT_PAIRS) {
      for (const unit of [pair.metric, pair.imperial]) {
        for (const value of values) {
          const shown = displayValue(value, unit, 'imperial')
          expect(canonicalValue(shown, unit, 'imperial')).toBeCloseTo(value, 9)
          const metric = displayValue(value, unit, 'metric')
          expect(canonicalValue(metric, unit, 'metric')).toBeCloseTo(value, 9)
        }
      }
    }
  })

  it('does not drift a threshold across ten switches', () => {
    let value = 92.5
    for (let i = 0; i < 10; i += 1) {
      const shown = displayValue(value, '°C', 'imperial')
      value = canonicalValue(shown, '°C', 'imperial')
    }
    expect(Math.abs(value - 92.5)).toBeLessThan(ROUND_TRIP_EPSILON)
  })
})

describe('canonicalValue', () => {
  it('is the inverse of displayValue for a signal stored in metric', () => {
    const shown = displayValue(90, '°C', 'imperial')
    expect(canonicalValue(shown, '°C', 'imperial')).toBeCloseTo(90, 9)
  })

  it('leaves an unpaired unit untouched', () => {
    expect(canonicalValue(7000, 'rpm', 'imperial')).toBe(7000)
  })
})
