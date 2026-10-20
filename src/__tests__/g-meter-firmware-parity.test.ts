import { existsSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

import { G_METER, G_METER_RANGE_G } from '../widget-metrics/g-meter.js'

import { firmwareConstant, firmwarePath, readFirmwareSource } from './firmware-source.js'

const METRICS = firmwarePath('src/ui/widgets/g_meter_metrics.h')
const CONFIG_TYPES = firmwarePath('src/config/config_types.h')
const WIDGET = firmwarePath('src/ui/widgets/g_meter_widget.cpp')

const firmwarePresent = [METRICS, CONFIG_TYPES, WIDGET].every((path) => existsSync(path))
const describeIfFirmware = firmwarePresent ? describe : describe.skip

const stringConstant = (source: string, name: string): string | null =>
  new RegExp(`${name}\\s*=\\s*"([^"]*)"`).exec(source)?.[1] ?? null

describeIfFirmware('g-meter firmware parity', () => {
  const metrics = readFirmwareSource(METRICS)
  const fromMetrics = (name: string): number | null => firmwareConstant(metrics, name)

  it('lays the plot out with the firmware geometry', () => {
    expect(G_METER.plotTopInsetPx).toBe(fromMetrics('kPlotTopInsetPx'))
    expect(G_METER.plotBottomInsetPx).toBe(fromMetrics('kPlotBottomInsetPx'))
    expect(G_METER.plotRightInsetPx).toBe(fromMetrics('kPlotRightInsetPx'))
    expect(G_METER.readoutColumnPx).toBe(fromMetrics('kReadoutColumnPx'))
    expect(G_METER.readoutTopPx).toBe(fromMetrics('kReadoutTopPx'))
    expect(G_METER.innerRingDivisor).toBe(fromMetrics('kInnerRingDivisor'))
  })

  it('draws the dot, the strokes and the reading at the firmware sizes', () => {
    expect(G_METER.dotSidePx).toBe(fromMetrics('kDotSidePx'))
    expect(G_METER.strokePx).toBe(fromMetrics('kStrokePx'))
    expect(G_METER.valueFontPx).toBe(fromMetrics('kValueFontPx'))
    expect(G_METER.valueDecimals).toBe(fromMetrics('kValueDecimals'))
  })

  it('clamps the range where the firmware parser does', () => {
    const config = readFirmwareSource(CONFIG_TYPES)
    expect(G_METER_RANGE_G.min).toBe(firmwareConstant(config, 'kGMeterMinRangeG'))
    expect(G_METER_RANGE_G.max).toBe(firmwareConstant(config, 'kGMeterMaxRangeG'))
    expect(G_METER_RANGE_G.default).toBe(firmwareConstant(config, 'kGMeterDefaultRangeG'))
  })

  it('writes the same kicker, unit and unavailable reason', () => {
    const widget = readFirmwareSource(WIDGET)
    expect(G_METER.defaultKicker).toBe(stringConstant(widget, 'kDefaultKicker'))
    expect(G_METER.unit).toBe(stringConstant(widget, 'kUnit'))
    expect(G_METER.noImuReason).toBe(stringConstant(widget, 'kNoImuReason'))
  })
})
