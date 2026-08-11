import { asPlainObject } from '../config-traverse.js'
import type { MigrationFn } from '../types.js'

const LEGACY_FLAG_TOP_BAR = [
  { type: 'label', text: 'CAN', position: 'left' },
  { type: 'statusDot', signal: 'any', position: 'left' },
  { type: 'modeFlag', signal: 'flag_anti_lag', text: 'ALS', position: 'center' },
  { type: 'separator', position: 'center' },
  { type: 'modeFlag', signal: 'flag_launch_ctrl', text: 'LC', position: 'center' },
  { type: 'separator', position: 'center' },
  { type: 'modeFlag', signal: 'flag_flat_shift', text: 'FS', position: 'center' },
  { type: 'separator', position: 'center' },
  { type: 'modeFlag', signal: 'flag_traction_cut', text: 'TC', position: 'center' },
  { type: 'signal', signal: 'map_number', format: 'MAP%.0f', position: 'right' },
  { type: 'separator', position: 'right' },
  { type: 'bleIcon', position: 'right' },
  { type: 'themeToggle', position: 'right' },
]

const TRACK_TOP_BAR = [
  { type: 'label', text: 'CAN', position: 'left' },
  { type: 'canRate', position: 'left' },
  { type: 'label', text: 'MAP', position: 'center' },
  { type: 'signal', signal: 'map_number', format: '%.0f', position: 'center' },
  { type: 'trackBadge', position: 'right' },
]

const isLegacyFlagTopBar = (layout: unknown): boolean =>
  JSON.stringify(layout) === JSON.stringify(LEGACY_FLAG_TOP_BAR)

export const retrackTopBar: MigrationFn = (config) => {
  const topBar = asPlainObject(config.topBar)
  if (!topBar || !isLegacyFlagTopBar(topBar.layout)) return { ...config, version: '1.29.0' }
  return {
    ...config,
    version: '1.29.0',
    topBar: { ...topBar, layout: TRACK_TOP_BAR.map((item) => ({ ...item })) },
  }
}
