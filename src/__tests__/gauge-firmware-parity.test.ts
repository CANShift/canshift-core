import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { GAUGE_ARC, GAUGE_VALUE_FONT_BREAKPOINTS } from '../widget-metrics/gauge.js'

const here = dirname(fileURLToPath(import.meta.url))
const WIDGETS = resolve(here, '../../../canshift-firmware/src/ui/widgets')
const GAUGE_WIDGET = resolve(WIDGETS, 'gauge_widget.cpp')
const GAUGE_ARCS = resolve(WIDGETS, 'gauge_arcs.cpp')
const GAUGE_ARCS_HEADER = resolve(WIDGETS, 'gauge_arcs.h')

const readIfPresent = (path: string): string => (existsSync(path) ? readFileSync(path, 'utf8') : '')

const constant = (source: string, name: string): number | null => {
  const match = new RegExp(`constexpr\\s+[\\w:]+\\s+${name}\\s*=\\s*([\\d.]+)f?;`).exec(source)
  return match ? Number(match[1]) : null
}

const firmwarePresent = [GAUGE_WIDGET, GAUGE_ARCS, GAUGE_ARCS_HEADER].every((p) => existsSync(p))
const describeIfFirmware = firmwarePresent ? describe : describe.skip

describeIfFirmware('gauge firmware parity', () => {
  const widget = readIfPresent(GAUGE_WIDGET)
  const arcs = readIfPresent(GAUGE_ARCS) + readIfPresent(GAUGE_ARCS_HEADER)

  it('steps the value font at the heights the firmware compiles in', () => {
    expect(GAUGE_VALUE_FONT_BREAKPOINTS).toEqual([
      {
        minHeight: constant(widget, 'kValueFontHeightPrimary'),
        size: constant(widget, 'kValueFontSizePrimary'),
      },
      {
        minHeight: constant(widget, 'kValueFontHeightSecondary'),
        size: constant(widget, 'kValueFontSizeSecondary'),
      },
      { minHeight: 0, size: constant(widget, 'kValueFontSizeUnits') },
    ])
  })

  it('draws the arc with the firmware geometry', () => {
    expect(GAUGE_ARC.sweepDeg).toBe(constant(arcs, 'kArcSweepInt'))
    expect(GAUGE_ARC.rotationDeg).toBe(constant(arcs, 'kArcRotation'))
    expect(GAUGE_ARC.minDiameter).toBe(constant(arcs, 'kMinArcDiam'))
    expect(GAUGE_ARC.containerPadding).toBe(constant(arcs, 'kArcContainerPadding'))
    expect(GAUGE_ARC.yShift).toBe(constant(arcs, 'kArcYShift'))
  })
})
