import { existsSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { GAUGE_ARC, GAUGE_VALUE_FONT_BREAKPOINTS } from '../widget-metrics/gauge.js'
import { firmwareConstant, firmwarePath, readFirmwareSource } from './firmware-source.js'

const GAUGE_WIDGET = firmwarePath('src/ui/widgets/gauge_widget.cpp')
const GAUGE_ARCS = firmwarePath('src/ui/widgets/gauge_arcs.cpp')
const GAUGE_ARCS_HEADER = firmwarePath('src/ui/widgets/gauge_arcs.h')

const firmwarePresent = [GAUGE_WIDGET, GAUGE_ARCS, GAUGE_ARCS_HEADER].every((p) => existsSync(p))
const describeIfFirmware = firmwarePresent ? describe : describe.skip

describeIfFirmware('gauge firmware parity', () => {
  const widget = readFirmwareSource(GAUGE_WIDGET)
  const arcs = readFirmwareSource(GAUGE_ARCS) + readFirmwareSource(GAUGE_ARCS_HEADER)
  const fromWidget = (name: string): number | null => firmwareConstant(widget, name)
  const fromArcs = (name: string): number | null => firmwareConstant(arcs, name)

  it('steps the value font at the heights the firmware compiles in', () => {
    expect(GAUGE_VALUE_FONT_BREAKPOINTS).toEqual([
      {
        minHeight: fromWidget('kValueFontHeightPrimary'),
        size: fromWidget('kValueFontSizePrimary'),
      },
      {
        minHeight: fromWidget('kValueFontHeightSecondary'),
        size: fromWidget('kValueFontSizeSecondary'),
      },
      { minHeight: 0, size: fromWidget('kValueFontSizeUnits') },
    ])
  })

  it('draws the arc with the firmware geometry', () => {
    expect(GAUGE_ARC.sweepDeg).toBe(fromArcs('kArcSweep'))
    expect(GAUGE_ARC.sweepDeg).toBe(fromArcs('kArcSweepInt'))
    expect(GAUGE_ARC.rotationDeg).toBe(fromArcs('kArcRotation'))
    expect(GAUGE_ARC.minDiameter).toBe(fromArcs('kMinArcDiam'))
    expect(GAUGE_ARC.containerPadding).toBe(fromArcs('kArcContainerPadding'))
    expect(GAUGE_ARC.yShift).toBe(fromArcs('kArcYShift'))
  })
})
