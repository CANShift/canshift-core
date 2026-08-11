import { mapPages } from '../config-traverse.js'
import { PALETTE_1_3 } from '../legacy-values.js'
import type { MigrationFn } from '../types.js'

export const defaultPagePalettes: MigrationFn = (config) =>
  mapPages(config, '1.3.0', (page) => {
    if (page.palette !== undefined) return page
    return { ...page, palette: { ...PALETTE_1_3 } }
  })
