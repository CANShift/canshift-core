import { asObject, mapPages } from '../config-traverse.js'
import type { MigrationFn } from '../types.js'

export const dropPageNamesAndMapFlags: MigrationFn = (config) => {
  const withPages = mapPages(config, '1.7.0', (page) => {
    const rest = { ...page }
    delete rest.name
    return rest
  })
  const topBar = asObject(config.topBar)
  if (!topBar) return withPages
  const rest = { ...topBar }
  delete rest.showMapName
  delete rest.showMapProfile
  return { ...withPages, topBar: rest }
}
