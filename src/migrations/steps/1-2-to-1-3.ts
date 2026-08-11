import { mapPages } from '../config-traverse.js'
import { DEFAULT_PALETTE } from '../legacy-values.js'
import type { MigrationFn } from '../types.js'

export const defaultPagePalettes: MigrationFn = (config) =>
  mapPages(config, '1.3.0', (page) => {
    if (page.palette !== undefined) return page
    return { ...page, palette: { ...DEFAULT_PALETTE } }
  })
