import { dropWidgetConfigKeys } from '../config-traverse.js'
import type { MigrationFn } from '../types.js'

export const dropAlertThreshold: MigrationFn = (config) =>
  dropWidgetConfigKeys(config, '1.40.0', ['alertThreshold'])
