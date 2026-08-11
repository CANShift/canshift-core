import { asObject, mapWidgets } from '../config-traverse.js'
import type { MigrationFn } from '../types.js'

export const dropArcFillStyle: MigrationFn = (config) =>
  mapWidgets(config, '1.30.0', (widget) => {
    const widgetConfig = asObject(widget.config)
    if (!widgetConfig || !('arcFillStyle' in widgetConfig)) return widget
    const rest = Object.fromEntries(
      Object.entries(widgetConfig).filter(([key]) => key !== 'arcFillStyle')
    )
    return { ...widget, config: rest }
  })
