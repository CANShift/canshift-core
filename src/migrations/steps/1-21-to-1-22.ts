import { asObject, mapWidgets } from '../config-traverse.js'
import type { MigrationFn } from '../types.js'

export const stripNonButtonLabels: MigrationFn = (config) =>
  mapWidgets(config, '1.22.0', (widget) => {
    if (widget.type === 'button') return widget
    const cfg = asObject(widget.config)
    if (!cfg) return widget
    if (!('label' in cfg) && !('labelPosition' in cfg)) return widget
    const rest = { ...cfg }
    delete rest.label
    delete rest.labelPosition
    return { ...widget, config: rest }
  })
