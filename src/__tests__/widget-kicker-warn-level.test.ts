import { STRING_CAPS } from '../constants/firmware-caps.js'
import { HexColorSchema } from '../schemas/common.js'
import { WidgetSchema } from '../schemas/widgets/index.js'

const hex = (value: string): ReturnType<typeof HexColorSchema.parse> => HexColorSchema.parse(value)

const widgetStyle = {
  primaryColor: hex('#FFFFFF'),
  secondaryColor: hex('#000000'),
  warningColor: hex('#FF8800'),
  criticalColor: hex('#FF4444'),
  textColor: hex('#FFFFFF'),
  fontSize: 14,
}

const layout = { col: 0, colSpan: 4, row: 0, rowSpan: 4, zOrder: 0 }

const gauge = (config: Record<string, unknown>): Record<string, unknown> => ({
  id: 'g1',
  type: 'gauge',
  signal: 'coolant_temp_c',
  layout,
  style: widgetStyle,
  config: {
    type: 'gauge',
    displayStyle: 'numeric',
    minValue: 0,
    maxValue: 140,
    dangerLevel: 110,
    decimalPlaces: 0,
    ...config,
  },
})

const gear = (config: Record<string, unknown>): Record<string, unknown> => ({
  id: 'gr1',
  type: 'gear',
  signal: 'gear',
  layout,
  style: widgetStyle,
  config: { type: 'gear', decimalPlaces: 0, ...config },
})

const issuePaths = (widget: Record<string, unknown>): string[] => {
  const result = WidgetSchema.safeParse(widget)
  return result.success ? [] : result.error.issues.map((issue) => issue.path.join('.'))
}

describe('gauge warnLevel', () => {
  it('accepts a high-side warn tier below the danger level', () => {
    expect(issuePaths(gauge({ warnLevel: 100 }))).toEqual([])
  })

  it('accepts a low-side warn tier above the danger level', () => {
    expect(
      issuePaths(
        gauge({ minValue: 0, maxValue: 8, dangerLevel: 1.1, dangerBelow: true, warnLevel: 1.5 })
      )
    ).toEqual([])
  })

  it('stays optional, so a gauge without one still validates', () => {
    expect(issuePaths(gauge({}))).toEqual([])
  })

  it('rejects a high-side warn tier at or past the danger level', () => {
    expect(issuePaths(gauge({ warnLevel: 110 }))).toEqual(['config.warnLevel'])
    expect(issuePaths(gauge({ warnLevel: 120 }))).toEqual(['config.warnLevel'])
  })

  it('rejects a low-side warn tier at or below the danger level', () => {
    expect(
      issuePaths(
        gauge({ minValue: 0, maxValue: 8, dangerLevel: 1.1, dangerBelow: true, warnLevel: 1.0 })
      )
    ).toEqual(['config.warnLevel'])
  })

  it('rejects a warn tier outside the gauge range', () => {
    expect(issuePaths(gauge({ warnLevel: -5 }))).toEqual(['config.warnLevel'])
  })
})

describe('per-widget kicker', () => {
  it('accepts a kicker on a gauge and on a gear', () => {
    expect(issuePaths(gauge({ kicker: 'WATER' }))).toEqual([])
    expect(issuePaths(gear({ kicker: 'GEAR' }))).toEqual([])
  })

  it('caps the kicker at the firmware label length', () => {
    const tooLong = 'K'.repeat(STRING_CAPS.WIDGET_LABEL + 1)
    expect(issuePaths(gauge({ kicker: tooLong }))).toEqual(['config.kicker'])
    expect(issuePaths(gear({ kicker: tooLong }))).toEqual(['config.kicker'])
  })

  it('is not offered on a widget that draws no kicker', () => {
    const timer = {
      id: 't1',
      type: 'timer',
      signal: '',
      layout,
      style: widgetStyle,
      config: { type: 'timer', kicker: 'LAP' },
    }
    expect(WidgetSchema.safeParse(timer).success).toBe(false)
  })
})
