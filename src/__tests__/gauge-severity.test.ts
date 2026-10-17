import { gaugeSeverity, signalSeverity } from '../widget-metrics/index.js'

const coolant = { dangerLevel: 110 }
const oilPressure = { dangerLevel: 1.0, dangerBelow: true }
const batteryCatalogue = {
  warningLevel: 12.0,
  dangerLevel: 11.5,
  highWarningLevel: 15.0,
  highDangerLevel: 16.0,
}

describe('gaugeSeverity', () => {
  it('walks normal → warn → danger on a high-side gauge', () => {
    const thresholds = { ...coolant, warnLevel: 100 }
    expect(gaugeSeverity(90, thresholds)).toBe('normal')
    expect(gaugeSeverity(100, thresholds)).toBe('warn')
    expect(gaugeSeverity(110, thresholds)).toBe('danger')
  })

  it('walks the other way on a low-side gauge', () => {
    const thresholds = { ...oilPressure, warnLevel: 1.5 }
    expect(gaugeSeverity(3, thresholds)).toBe('normal')
    expect(gaugeSeverity(1.4, thresholds)).toBe('warn')
    expect(gaugeSeverity(0.9, thresholds)).toBe('danger')
  })

  it('has no amber tier when neither the widget nor the catalogue gives one', () => {
    expect(gaugeSeverity(105, coolant)).toBe('normal')
  })

  it('takes the low side of a battery from the catalogue', () => {
    const widget = { dangerLevel: 16 }
    expect(gaugeSeverity(13.8, widget, batteryCatalogue)).toBe('normal')
    expect(gaugeSeverity(11.9, widget, batteryCatalogue)).toBe('warn')
    expect(gaugeSeverity(10.8, widget, batteryCatalogue)).toBe('danger')
    expect(gaugeSeverity(16.1, widget, batteryCatalogue)).toBe('danger')
  })

  it('never looks calmer than the catalogue', () => {
    const lateWidget = { dangerLevel: 125 }
    expect(gaugeSeverity(116, lateWidget, { warningLevel: 100, dangerLevel: 115 })).toBe('danger')
  })

  it('keeps a widget limit that fires before the catalogue', () => {
    const earlyWidget = { dangerLevel: 105 }
    expect(gaugeSeverity(106, earlyWidget, { warningLevel: 100, dangerLevel: 115 })).toBe('danger')
  })
})

describe('signalSeverity', () => {
  it('reads both sides of a battery', () => {
    expect(signalSeverity(15.2, batteryCatalogue)).toBe('warn')
    expect(signalSeverity(11.5, batteryCatalogue)).toBe('danger')
    expect(signalSeverity(13.8, batteryCatalogue)).toBe('normal')
  })

  it('infers a low-side primary pair from its order', () => {
    const oil = { warningLevel: 1.5, dangerLevel: 1.0 }
    expect(signalSeverity(3, oil)).toBe('normal')
    expect(signalSeverity(1.4, oil)).toBe('warn')
    expect(signalSeverity(0.9, oil)).toBe('danger')
  })

  it('reads a lone danger level as high side', () => {
    expect(signalSeverity(120, { dangerLevel: 115 })).toBe('danger')
    expect(signalSeverity(-20, { dangerLevel: 115 })).toBe('normal')
  })

  it('stays normal without limits', () => {
    expect(signalSeverity(9999, {})).toBe('normal')
  })
})
