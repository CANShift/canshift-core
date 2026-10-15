import {
  SENSOR_DANGER_COLOR,
  SENSOR_DEFAULT_RANGES,
  isOutsideDangerBand,
  sensorDefaultDangerBand,
} from '../widget-metrics/index.js'
import { SENSOR_DEFAULT_RAMPS, SENSOR_KINDS } from '../sensor-defaults.js'
import type { SensorKind } from '../sensor-defaults.js'
import type { SensorDangerBand } from '../widget-metrics/index.js'

const EXPECTED_BANDS: Record<SensorKind, SensorDangerBand> = {
  coolant_temp: { below: null, above: 110 },
  oil_temp: { below: null, above: 135 },
  oil_press: { below: 1.0, above: null },
  battery_volts: { below: 11.5, above: 15.5 },
  rpm: { below: null, above: 7000 },
  afr: { below: 10.5, above: null },
  boost: { below: null, above: 1.7 },
  intake_temp: { below: null, above: 65 },
  egt: { below: null, above: 950 },
}

const dangerValues = (kind: SensorKind): number[] =>
  SENSOR_DEFAULT_RAMPS[kind].stops
    .filter((stop) => stop.color === SENSOR_DANGER_COLOR)
    .map((stop) => stop.value)

describe('sensorDefaultDangerBand', () => {
  it.each(SENSOR_KINDS)('resolves the danger band of %s', (kind) => {
    expect(sensorDefaultDangerBand(kind)).toEqual(EXPECTED_BANDS[kind])
  })

  it('keeps both sides of the battery ramp', () => {
    expect(sensorDefaultDangerBand('battery_volts')).toEqual({ below: 11.5, above: 15.5 })
  })

  it('keeps the rich side of afr only, since its lean end is a warning', () => {
    expect(sensorDefaultDangerBand('afr')).toEqual({ below: 10.5, above: null })
  })

  it.each(SENSOR_KINDS)('reuses a ramp danger stop for every side of %s', (kind) => {
    const { below, above } = sensorDefaultDangerBand(kind)
    const stops = dangerValues(kind)
    if (stops.length === 0) {
      expect({ below, above }).toEqual({ below: null, above: SENSOR_DEFAULT_RANGES[kind].max })
      return
    }
    for (const side of [below, above]) {
      if (side !== null) expect(stops).toContain(side)
    }
  })
})

describe('isOutsideDangerBand', () => {
  const battery: SensorDangerBand = { below: 11.5, above: 15.5 }

  it('trips strictly below the low side', () => {
    expect(isOutsideDangerBand(11.4, battery)).toBe(true)
    expect(isOutsideDangerBand(11.5, battery)).toBe(false)
  })

  it('trips at and above the high side', () => {
    expect(isOutsideDangerBand(15.5, battery)).toBe(true)
    expect(isOutsideDangerBand(15.4, battery)).toBe(false)
  })

  it('stays clear inside the band', () => {
    expect(isOutsideDangerBand(13.8, battery)).toBe(false)
  })

  it('ignores a side the band does not have', () => {
    expect(isOutsideDangerBand(99, { below: 10.5, above: null })).toBe(false)
    expect(isOutsideDangerBand(-99, { below: null, above: 110 })).toBe(false)
  })
})
