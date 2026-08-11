import { asObject } from '../config-traverse.js'
import type { MigrationFn } from '../types.js'

export const raiseTopBarHeight: MigrationFn = (config) => {
  const topBar = asObject(config.topBar)
  if (topBar?.height !== 24) {
    return { ...config, version: '1.12.0' }
  }
  return { ...config, version: '1.12.0', topBar: { ...topBar, height: 30 } }
}
