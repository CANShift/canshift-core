import { describe, expect, it } from 'vitest'
import { resolveGridRect } from '../layout-grid.js'
import type { GaugeWidgetConfig } from '../schemas/widgets/widget.js'
import type { UnitSystem } from '../units/convert.js'
import { measureGaugeFit } from '../widget-metrics/gauge-fit.js'

const BOTTOM_ROW = resolveGridRect(
  { col: 6, colSpan: 3, row: 9, rowSpan: 3 },
  { width: 320, height: 224 }
)

const trackBoost = (decimalPlaces: number): GaugeWidgetConfig => ({
  type: 'gauge',
  displayStyle: 'numeric',
  minValue: -1,
  maxValue: 3,
  dangerLevel: 2.3,
  decimalPlaces,
})

const fitIn = (config: GaugeWidgetConfig, system: UnitSystem, symbol: string) =>
  measureGaugeFit({
    config,
    width: BOTTOM_ROW.w,
    height: BOTTOM_ROW.h,
    convertibleUnit: 'bar',
    unitSymbol: symbol,
    system,
  })

describe('measureGaugeFit', () => {
  it('fits the shipped Track BOOST in bar', () => {
    expect(fitIn(trackBoost(1), 'metric', 'bar')).toMatchObject({ reading: '3.0', fits: true })
  })

  it('drops the decimal psi gains and fits Track BOOST in psi', () => {
    expect(fitIn(trackBoost(1), 'imperial', 'psi')).toMatchObject({
      reading: '44',
      neededPx: 43,
      fits: true,
    })
  })

  it('still flags two decimals in bar, 67 px against 64', () => {
    expect(fitIn(trackBoost(2), 'metric', 'bar')).toMatchObject({
      reading: '3.00',
      neededPx: 67,
      availablePx: 64,
      fits: false,
    })
  })
})

describe('measureGaugeFit with a suffix', () => {
  it('reads a configured suffix verbatim and converts nothing', () => {
    const fit = measureGaugeFit({
      config: { ...trackBoost(1), suffix: 'b' },
      width: BOTTOM_ROW.w,
      height: BOTTOM_ROW.h,
      convertibleUnit: '',
      unitSymbol: 'b',
      system: 'imperial',
    })
    expect(fit).toMatchObject({ reading: '3.0', unit: 'b' })
  })
})
