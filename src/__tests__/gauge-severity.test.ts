import { gaugeSeverity, gaugeWarnLevel } from '../widget-metrics/index.js'

const coolant = { dangerLevel: 110 }
const oilPressure = { dangerLevel: 1.0, dangerBelow: true }

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
})

describe('gaugeWarnLevel', () => {
  it('prefers the widget warn level over the catalogue', () => {
    expect(gaugeWarnLevel({ ...coolant, warnLevel: 98 }, { highWarningLevel: 100 })).toBe(98)
  })

  it('falls back to the catalogue high-side warn level on a high-side gauge', () => {
    expect(gaugeWarnLevel(coolant, { warningLevel: 10, highWarningLevel: 100 })).toBe(100)
  })

  it('falls back to the catalogue low-side warn level on a low-side gauge', () => {
    expect(gaugeWarnLevel(oilPressure, { warningLevel: 1.5, highWarningLevel: 9 })).toBe(1.5)
  })

  it('skips a catalogue level that sits past the danger level', () => {
    expect(gaugeWarnLevel(coolant, { highWarningLevel: 120, warningLevel: 105 })).toBe(105)
    expect(gaugeWarnLevel(coolant, { highWarningLevel: 120 })).toBeUndefined()
  })
})
