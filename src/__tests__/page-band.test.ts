import { existsSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { resolveGridRect } from '../layout-grid.js'
import { SHIFT_STRIP, pageHasShiftStrip, resolveContentRect } from '../page-band.js'
import { firmwareConstant, firmwarePath, readFirmwareSource } from './firmware-source.js'

const DASH_METRICS = firmwarePath('src/ui/dash_metrics.h')
const LAYOUT_RESOLVER = firmwarePath('src/config/config_layout_resolver.inc')
const AREA = { width: 320, height: 224 }

const describeIfFirmware = [DASH_METRICS, LAYOUT_RESOLVER].every((p) => existsSync(p))
  ? describe
  : describe.skip

describe('resolveContentRect', () => {
  it('is the plain grid rect on a page without a shift strip', () => {
    const placement = { col: 6, colSpan: 3, row: 9, rowSpan: 3 }
    expect(resolveContentRect(placement, AREA, false)).toEqual(resolveGridRect(placement, AREA))
  })

  it('moves a row up and fits the grid below the strip band', () => {
    const rect = resolveContentRect({ col: 6, colSpan: 3, row: 9, rowSpan: 3 }, AREA, true)
    const below = resolveGridRect(
      { col: 6, colSpan: 3, row: 8, rowSpan: 3 },
      { width: 320, height: 211 }
    )
    expect(rect).toEqual({ ...below, y: below.y + 13 })
  })

  it('keeps row 0 at row 0', () => {
    const rect = resolveContentRect({ col: 0, colSpan: 7, row: 0, rowSpan: 5 }, AREA, true)
    expect(rect.y).toBe(
      resolveGridRect({ col: 0, colSpan: 7, row: 0, rowSpan: 5 }, { width: 320, height: 211 }).y +
        13
    )
  })
})

describe('pageHasShiftStrip', () => {
  it('is set by a shift light anywhere on the page', () => {
    expect(pageHasShiftStrip({ widgets: [] })).toBe(false)
    expect(pageHasShiftStrip({ widgets: [{ type: 'gauge' }, { type: 'shift_light' }] })).toBe(true)
  })
})

describeIfFirmware('page band firmware parity', () => {
  const metrics = readFirmwareSource(DASH_METRICS)
  const resolver = readFirmwareSource(LAYOUT_RESOLVER)

  it('reserves the band the firmware reserves for the shift strip', () => {
    expect(SHIFT_STRIP.HEIGHT).toBe(firmwareConstant(metrics, 'kShiftStripHeightPx'))
    expect(SHIFT_STRIP.ROW_GAP).toBe(firmwareConstant(metrics, 'kRowGapPx'))
    expect(metrics).toMatch(/kShiftStripBandPx = kShiftStripHeightPx \+ kRowGapPx;/)
  })

  it('moves every row but the first up by one on a strip page', () => {
    expect(resolver).toMatch(
      /band\.hasStrip && L\.row > 0 \? static_cast<uint8_t>\(L\.row - 1\) : L\.row/
    )
    expect(resolver).toMatch(/w\.type == WidgetType::SHIFT_LIGHT/)
  })
})
