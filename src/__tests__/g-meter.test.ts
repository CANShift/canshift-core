import { HexColorSchema } from '../schemas/common.js'
import { WidgetSchema } from '../schemas/widgets/index.js'
import {
  G_METER,
  G_METER_RANGE_G,
  gMeterEnvelopeVertex,
  gMeterFeltForce,
  gMeterPlotBox,
  gMeterPlotOffset,
} from '../widget-metrics/index.js'

const hex = (value: string): ReturnType<typeof HexColorSchema.parse> => HexColorSchema.parse(value)

const gMeter = (config: Record<string, unknown>): unknown => ({
  id: 'g',
  type: 'g_meter',
  signal: '',
  layout: { col: 0, colSpan: 8, row: 0, rowSpan: 9, zOrder: 0 },
  style: {
    primaryColor: hex('#FFFFFF'),
    secondaryColor: hex('#222222'),
    warningColor: hex('#FF8800'),
    criticalColor: hex('#FF4444'),
    textColor: hex('#FFFFFF'),
    fontSize: 17,
  },
  config: { type: 'g_meter', ...config },
})

describe('g_meter widget schema', () => {
  it('accepts a g-meter with no signal binding', () => {
    expect(WidgetSchema.safeParse(gMeter({ rangeG: 1.5 })).success).toBe(true)
  })

  it('accepts the optional peak hold and kicker', () => {
    const widget = gMeter({ rangeG: 2, peakHold: false, kicker: 'Lat g' })
    expect(WidgetSchema.safeParse(widget).success).toBe(true)
  })

  it('bounds the range to what the firmware clamps to', () => {
    expect(WidgetSchema.safeParse(gMeter({ rangeG: G_METER_RANGE_G.min })).success).toBe(true)
    expect(WidgetSchema.safeParse(gMeter({ rangeG: G_METER_RANGE_G.max })).success).toBe(true)
    expect(WidgetSchema.safeParse(gMeter({ rangeG: 0.4 })).success).toBe(false)
    expect(WidgetSchema.safeParse(gMeter({ rangeG: 3.5 })).success).toBe(false)
  })

  it('requires a range', () => {
    expect(WidgetSchema.safeParse(gMeter({})).success).toBe(false)
  })

  it('rejects an unknown config key', () => {
    expect(WidgetSchema.safeParse(gMeter({ rangeG: 1.5, decay: 3 })).success).toBe(false)
  })
})

describe('g-meter plot geometry', () => {
  it('fits the plot square under the rule, right of the readout column', () => {
    expect(gMeterPlotBox(200, 150)).toEqual({ x: 52, y: G_METER.plotTopInsetPx, side: 140 })
    expect(gMeterPlotBox(300, 100)).toEqual({ x: 199, y: G_METER.plotTopInsetPx, side: 93 })
  })

  it('collapses to nothing when the widget is narrower than the readout', () => {
    expect(gMeterPlotBox(40, 100).side).toBe(0)
  })

  it('plots felt force: braking up, a left-hand corner right', () => {
    expect(gMeterFeltForce(0, -0.8)).toEqual([-0, 0.8])
    expect(gMeterFeltForce(-0.5, 0)).toEqual([0.5, -0])
  })

  it('maps the range to the radius with screen y pointing down', () => {
    expect(gMeterPlotOffset(0, 1.5, 1.5, 40)).toEqual({ dx: 0, dy: -40 })
    expect(gMeterPlotOffset(0.75, 0, 1.5, 40)).toEqual({ dx: 20, dy: 0 })
  })

  it('pins an over-range point to the ring', () => {
    expect(gMeterPlotOffset(3, 0, 1.5, 40)).toEqual({ dx: 40, dy: 0 })
  })

  it('keeps a point at the centre when there is no range or radius', () => {
    expect(gMeterPlotOffset(1, 1, 0, 40)).toEqual({ dx: 0, dy: 0 })
    expect(gMeterPlotOffset(1, 1, 1.5, 0)).toEqual({ dx: 0, dy: 0 })
  })

  it('places an envelope vertex along its sector, clockwise from up', () => {
    expect(gMeterEnvelopeVertex(0.75, 2, 1.5, 40)).toEqual({ dx: 20, dy: 0 })
    expect(gMeterEnvelopeVertex(1.5, 0, 1.5, 40)).toEqual({ dx: 0, dy: -40 })
    expect(gMeterEnvelopeVertex(0, 5, 1.5, 40)).toEqual({ dx: 0, dy: 0 })
  })
})
