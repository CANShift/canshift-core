import type { MigrationFn } from '../types.js'

export const liftCriticalAlertIntoList: MigrationFn = (config) => {
  const { criticalAlert, ...rest } = config
  const migrated = { ...rest, version: '1.43.0' }
  if (criticalAlert === undefined || criticalAlert === null) return migrated
  return { ...migrated, criticalAlerts: [criticalAlert] }
}
