import { migrateConfig } from '../migrations/index.js'
import { DashboardConfigSchema } from '../schemas/dashboard.js'

const oilPressure = {
  signal: 'oil_press_bar',
  firesAt: 1,
  direction: 'below',
  acknowledgeOn: 'dash',
}

const dashboardAt = (version: string, extra: Record<string, unknown>): Record<string, unknown> => ({
  version,
  name: 'Test',
  defaultPageId: 'p1',
  revLimitRpm: 7000,
  topBar: { height: 30, bgColor: '#000000', textColor: '#FFFFFF' },
  pages: [
    { id: 'p1', backgroundImage: null, backgroundColor: '#000000', showTopBar: true, widgets: [] },
  ],
  ...extra,
})

describe('migrateConfig — 1.42.0 → 1.43.0 (one critical alert becomes a list)', () => {
  it('turns the single alert into a one-entry list and drops the old field', () => {
    const { config, applied } = migrateConfig(
      dashboardAt('1.42.0', { criticalAlert: oilPressure }),
      '1.43.0'
    )
    expect(applied).toEqual(['1.42.0 → 1.43.0'])
    expect(config.criticalAlerts).toEqual([oilPressure])
    expect('criticalAlert' in config).toBe(false)
    expect(DashboardConfigSchema.safeParse(config).success).toBe(true)
  })

  it('leaves a dashboard without an alert without a list', () => {
    const { config } = migrateConfig(dashboardAt('1.42.0', {}), '1.43.0')
    expect(config).toEqual(dashboardAt('1.43.0', {}))
  })

  it('drops a null alert instead of listing it', () => {
    const { config } = migrateConfig(dashboardAt('1.42.0', { criticalAlert: null }), '1.43.0')
    expect(config).toEqual(dashboardAt('1.43.0', {}))
  })

  it('carries the alert from an older config through every step', () => {
    const { config } = migrateConfig(
      dashboardAt('1.41.0', { criticalAlert: oilPressure }),
      '1.43.0'
    )
    expect(config.criticalAlerts).toEqual([oilPressure])
  })
})
