import { FIRMWARE_CAPS } from '../constants/firmware-caps.js'
import { HexColorSchema, SemVerSchema } from '../schemas/common.js'
import { SignalConfigSchema, type SignalConfig } from '../schemas/signal.js'
import { validateDashboard } from '../validation/validate-dashboard.js'

const hex = (value: string): ReturnType<typeof HexColorSchema.parse> => HexColorSchema.parse(value)
const semver = (value: string): ReturnType<typeof SemVerSchema.parse> => SemVerSchema.parse(value)

const widgetStyle = {
  primaryColor: hex('#FFFFFF'),
  secondaryColor: hex('#000000'),
  warningColor: hex('#FF8800'),
  criticalColor: hex('#FF4444'),
  textColor: hex('#FFFFFF'),
  fontSize: 14,
}

const gaugeWidget = (overrides: Record<string, unknown> = {}): Record<string, unknown> => ({
  id: 'w0',
  type: 'gauge',
  signal: 'rpm',
  layout: { col: 0, colSpan: 3, row: 0, rowSpan: 2, zOrder: 0 },
  style: widgetStyle,
  config: {
    type: 'gauge',
    displayStyle: 'arc',
    minValue: 0,
    maxValue: 100,
    dangerLevel: 90,
    decimalPlaces: 0,
  },
  ...overrides,
})

const minimalPage = (overrides: Record<string, unknown> = {}): Record<string, unknown> => ({
  id: 'p1',
  backgroundImage: null,
  backgroundColor: hex('#000000'),
  showTopBar: true,
  widgets: [gaugeWidget()],
  ...overrides,
})

const minimalConfig = (overrides: Record<string, unknown> = {}): Record<string, unknown> => ({
  version: '1.14.0',
  name: 'Test',
  defaultPageId: 'p1',
  revLimitRpm: 7000,
  topBar: { height: 16, bgColor: hex('#000000'), textColor: hex('#FFFFFF') },
  pages: [minimalPage()],
  ...overrides,
})

const buttonWithActions = (count: number): Record<string, unknown> => ({
  id: 'btn',
  type: 'button',
  signal: 'rpm',
  layout: { col: 0, colSpan: 3, row: 0, rowSpan: 2, zOrder: 0 },
  style: widgetStyle,
  config: {
    type: 'button',
    mode: 'single',
    label: 'go',
    actions: Array.from({ length: count }, (_, i) => ({
      category: 'dashboard',
      type: 'navigate',
      pageId: `p${i.toString()}`,
    })),
  },
})

const signalCatalogWithLegacyRamp = (stops: unknown[]): SignalConfig =>
  ({
    version: semver('1.14.0'),
    protocol: 'custom_v1.0',
    canSpeedKbps: 500,
    signals: [
      {
        name: 'rpm',
        canFrameId: '0x370',
        startByte: 0,
        byteLength: 2,
        bigEndian: true,
        signed: false,
        scale: 1,
        offset: 0,
        unit: 'rpm',
        min: 0,
        max: 8000,
        timeoutMs: 1000,
        colorRamp: { stops, interpolate: 'linear' },
      },
    ],
  }) as unknown as SignalConfig

describe('validateDashboard — button.actions cap (issue #700)', () => {
  it('accepts a button with exactly MAX_BUTTON_ACTIONS (4) actions', () => {
    const result = validateDashboard(
      minimalConfig({
        pages: [
          minimalPage({
            widgets: [buttonWithActions(FIRMWARE_CAPS.MAX_BUTTON_ACTIONS)],
          }),
        ],
      })
    )
    expect(result.errors.filter((e) => e.includes('too many actions'))).toHaveLength(0)
  })

  it('rejects a button with MAX_BUTTON_ACTIONS + 1 (5) actions', () => {
    const result = validateDashboard(
      minimalConfig({
        pages: [
          minimalPage({
            widgets: [buttonWithActions(FIRMWARE_CAPS.MAX_BUTTON_ACTIONS + 1)],
          }),
        ],
      })
    )
    expect(result.valid).toBe(false)
    expect(
      result.errors.some(
        (e) => e.includes('actions') && e.includes(String(FIRMWARE_CAPS.MAX_BUTTON_ACTIONS))
      )
    ).toBe(true)
  })
})

describe('validateDashboard — legacy colorRamp on a catalogue signal (issue #86)', () => {
  const ascending = [
    { value: 0, color: '#00FF00' },
    { value: 50, color: '#FFFF00' },
    { value: 100, color: '#FF0000' },
  ]

  it('accepts a catalogue whose signals still carry the dropped field', () => {
    const result = validateDashboard(minimalConfig(), {
      signalCatalog: signalCatalogWithLegacyRamp(ascending),
    })
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('no longer rejects a ramp that breaks the old stop rules', () => {
    const overCap = Array.from({ length: FIRMWARE_CAPS.MAX_RAMP_STOPS + 1 }, (_, i) => ({
      value: i * 10,
      color: '#00FF00',
    }))
    const result = validateDashboard(minimalConfig(), {
      signalCatalog: signalCatalogWithLegacyRamp(overCap),
    })
    expect(result.valid).toBe(true)
  })

  it('drops the field rather than carrying it through', () => {
    const parsed = SignalConfigSchema.parse(signalCatalogWithLegacyRamp(ascending))
    expect(parsed.signals[0]).not.toHaveProperty('colorRamp')
  })
})
