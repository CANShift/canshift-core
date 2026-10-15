import { DashboardConfigSchema } from '../schemas/dashboard.js'
import { CriticalAlertSchema } from '../schemas/critical-alert.js'
import { STRING_CAPS } from '../constants/firmware-caps.js'

const oilPressure = {
  signal: 'oil_press_bar',
  firesAt: 1.0,
  direction: 'below',
  acknowledgeOn: 'dash',
}

const dashboard = (extra: Record<string, unknown>): Record<string, unknown> => ({
  version: '1.41.0',
  name: 'Test',
  defaultPageId: 'p1',
  revLimitRpm: 7000,
  topBar: { height: 30, bgColor: '#000000', textColor: '#FFFFFF' },
  pages: [
    {
      id: 'p1',
      backgroundImage: null,
      backgroundColor: '#000000',
      showTopBar: true,
      widgets: [],
    },
  ],
  ...extra,
})

describe('CriticalAlertSchema', () => {
  it('accepts one signal, one threshold, a direction and the dash as acknowledge target', () => {
    expect(CriticalAlertSchema.safeParse(oilPressure).success).toBe(true)
  })

  it('accepts both directions', () => {
    expect(CriticalAlertSchema.safeParse({ ...oilPressure, direction: 'above' }).success).toBe(true)
    expect(CriticalAlertSchema.safeParse({ ...oilPressure, direction: 'sideways' }).success).toBe(
      false
    )
  })

  it('rejects the phone as acknowledge target until the transport can carry it', () => {
    expect(CriticalAlertSchema.safeParse({ ...oilPressure, acknowledgeOn: 'phone' }).success).toBe(
      false
    )
    expect(CriticalAlertSchema.safeParse({ ...oilPressure, acknowledgeOn: 'both' }).success).toBe(
      false
    )
  })

  it('rejects an empty or over-long signal name', () => {
    expect(CriticalAlertSchema.safeParse({ ...oilPressure, signal: '' }).success).toBe(false)
    const tooLong = 's'.repeat(STRING_CAPS.SIGNAL_NAME + 1)
    expect(CriticalAlertSchema.safeParse({ ...oilPressure, signal: tooLong }).success).toBe(false)
  })

  it('rejects a non-finite threshold and unknown keys', () => {
    expect(CriticalAlertSchema.safeParse({ ...oilPressure, firesAt: Infinity }).success).toBe(false)
    expect(CriticalAlertSchema.safeParse({ ...oilPressure, holdMs: 500 }).success).toBe(false)
  })
})

describe('DashboardConfigSchema.criticalAlert', () => {
  it('is optional — a dashboard without one never takes the screen for a user signal', () => {
    expect(DashboardConfigSchema.safeParse(dashboard({})).success).toBe(true)
  })

  it('carries exactly one alert object, not a list', () => {
    expect(DashboardConfigSchema.safeParse(dashboard({ criticalAlert: oilPressure })).success).toBe(
      true
    )
    expect(
      DashboardConfigSchema.safeParse(dashboard({ criticalAlert: [oilPressure] })).success
    ).toBe(false)
  })
})
