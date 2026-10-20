import { describe, expect, it } from 'vitest'
import { BASE_DISPLAY_TIER } from '../display-tiers.js'
import { resolveGridRect } from '../layout-grid.js'
import {
  VALUE_FACE_ADVANCE_PX,
  formatFixedReading,
  gaugeDeviceValuePx,
  measureValueFit,
  textWidthPx,
  valueFaceAdvancePx,
  valueTrackingPx,
  widestConfiguredValue,
} from '../widget-metrics/value-fit.js'

const BOTTOM_ROW_AREA = { width: 320, height: 224 }
const bottomRowRect = resolveGridRect({ col: 6, colSpan: 3, row: 9, rowSpan: 3 }, BOTTOM_ROW_AREA)

const trackBoost = (decimalPlaces: number) =>
  measureValueFit({
    widestValue: widestConfiguredValue(-1, 3),
    decimalPlaces,
    prefix: '',
    unit: 'bar',
    valueFontPx: gaugeDeviceValuePx({ displayStyle: 'numeric' }, bottomRowRect.w, bottomRowRect.h),
    columnWidth: bottomRowRect.w,
  })

describe('value faces', () => {
  it('carries an advance for every face of the base ladder', () => {
    expect(Object.keys(VALUE_FACE_ADVANCE_PX).map(Number)).toEqual(BASE_DISPLAY_TIER.valueFaces)
  })

  it('snaps a requested size down to the nearest face', () => {
    expect(valueFaceAdvancePx(22)).toBe(13)
    expect(valueFaceAdvancePx(30)).toBe(13)
    expect(valueFaceAdvancePx(40)).toBe(19)
  })

  it('falls back to the unit face below the smallest value face', () => {
    expect(valueFaceAdvancePx(12)).toBe(6)
    expect(valueFaceAdvancePx(10)).toBe(6)
  })

  it('tightens tracking on the larger faces', () => {
    expect(valueTrackingPx(48)).toBe(-2)
    expect(valueTrackingPx(40)).toBe(-2)
    expect(valueTrackingPx(22)).toBe(-1)
    expect(valueTrackingPx(14)).toBe(-1)
    expect(valueTrackingPx(13)).toBe(0)
  })
})

describe('textWidthPx', () => {
  it('drops the tracking after the last glyph', () => {
    expect(textWidthPx('3.00', 13, -1)).toBe(49)
  })

  it('is zero for an empty string', () => {
    expect(textWidthPx('', 13, -1)).toBe(0)
  })

  it('counts a non-ASCII unit glyph once', () => {
    expect(textWidthPx('°C', 6, 0)).toBe(12)
  })
})

describe('formatFixedReading', () => {
  it('rounds half up at the configured decimals', () => {
    expect(formatFixedReading(3, 2)).toBe('3.00')
    expect(formatFixedReading(1.25, 1)).toBe('1.3')
    expect(formatFixedReading(99.96, 1)).toBe('100.0')
  })

  it('keeps the sign of a negative reading', () => {
    expect(formatFixedReading(-40, 0)).toBe('-40')
    expect(formatFixedReading(-0.5, 2)).toBe('-0.50')
  })

  it('formats at single precision like the dash', () => {
    expect(formatFixedReading(123456789, 2)).toBe('123456788.48')
  })
})

describe('widestConfiguredValue', () => {
  it('picks the bound with the larger magnitude', () => {
    expect(widestConfiguredValue(-1, 3)).toBe(3)
    expect(widestConfiguredValue(-40, 30)).toBe(-40)
  })
})

describe('gaugeDeviceValuePx', () => {
  it('sizes a numeric gauge from its box when big is unset', () => {
    expect(gaugeDeviceValuePx({ displayStyle: 'numeric' }, 72, 48)).toBe(31)
  })

  it('lets big win on both display styles', () => {
    expect(gaugeDeviceValuePx({ displayStyle: 'numeric', big: 44 }, 72, 48)).toBe(22)
    expect(gaugeDeviceValuePx({ displayStyle: 'arc', big: 96 }, 72, 48)).toBe(48)
  })

  it('steps an arc gauge on height alone', () => {
    expect(gaugeDeviceValuePx({ displayStyle: 'arc' }, 300, 48)).toBe(17)
  })
})

describe('measureValueFit', () => {
  it('reports Track BOOST at two decimals as the dash does: 67 px against 64', () => {
    expect(trackBoost(2)).toEqual({
      reading: '3.00',
      unit: 'bar',
      neededPx: 67,
      availablePx: 64,
      fits: false,
    })
  })

  it('fits Track BOOST at one decimal', () => {
    expect(trackBoost(1)).toMatchObject({ reading: '3.0', neededPx: 55, fits: true })
  })
})

describe('measureValueFit against the simulator', () => {
  it('matches the simulator on a widened numeric reading', () => {
    const fit = measureValueFit({
      widestValue: 123456789,
      decimalPlaces: 2,
      prefix: '',
      unit: '°C',
      valueFontPx: gaugeDeviceValuePx(
        { displayStyle: 'numeric' },
        bottomRowRect.w,
        bottomRowRect.h
      ),
      columnWidth: bottomRowRect.w,
    })
    expect(fit).toMatchObject({ reading: '123456788.48', neededPx: 157, availablePx: 64 })
  })

  it('matches the simulator on an arc gauge sized by height', () => {
    const rect = resolveGridRect({ col: 3, colSpan: 3, row: 9, rowSpan: 3 }, BOTTOM_ROW_AREA)
    const fit = measureValueFit({
      widestValue: widestConfiguredValue(-40, 999999),
      decimalPlaces: 0,
      prefix: '',
      unit: '°C',
      valueFontPx: gaugeDeviceValuePx({ displayStyle: 'arc' }, rect.w, rect.h),
      columnWidth: rect.w,
    })
    expect(fit).toMatchObject({ reading: '999999', neededPx: 67, availablePx: 63, fits: false })
  })
})

describe('measureValueFit prefix', () => {
  it('puts the prefix in the value face', () => {
    const fit = measureValueFit({
      widestValue: 5,
      decimalPlaces: 0,
      prefix: '+',
      unit: '',
      valueFontPx: 22,
      columnWidth: 72,
    })
    expect(fit).toMatchObject({ reading: '+5', neededPx: 25 })
  })
})
