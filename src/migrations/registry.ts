import type { Migration } from './types.js'
import { dropAlertThreshold } from './steps/1-39-to-1-40.js'
import { pairThemeFaces } from './steps/1-36-to-1-37.js'
import { stripButtonIcons } from './steps/1-30-to-1-31.js'
import { dropArcFillStyle } from './steps/1-29-to-1-30.js'
import { retrackTopBar } from './steps/1-28-to-1-29.js'
import { syncWidgetTypeWithConfig } from './steps/1-26-to-1-27.js'
import { pixelLayoutToGridSpans } from './steps/1-24-to-1-25.js'

export const MIGRATION_FLOOR_VERSION = '1.24.0'

export const BUILTIN_MIGRATIONS: readonly Migration[] = [
  { fromVersion: '1.24.0', toVersion: '1.25.0', migrate: pixelLayoutToGridSpans },
  { fromVersion: '1.26.0', toVersion: '1.27.0', migrate: syncWidgetTypeWithConfig },
  { fromVersion: '1.28.0', toVersion: '1.29.0', migrate: retrackTopBar },
  { fromVersion: '1.29.0', toVersion: '1.30.0', migrate: dropArcFillStyle },
  { fromVersion: '1.30.0', toVersion: '1.31.0', migrate: stripButtonIcons },
  { fromVersion: '1.36.0', toVersion: '1.37.0', migrate: pairThemeFaces },
  { fromVersion: '1.39.0', toVersion: '1.40.0', migrate: dropAlertThreshold },
]
