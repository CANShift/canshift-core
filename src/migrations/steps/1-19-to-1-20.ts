import { asObject, mapWidgets } from '../config-traverse.js'
import type { MigrationFn } from '../types.js'

export const dropHideWhenInvalid: MigrationFn = (config) =>
  mapWidgets(config, '1.20.0', (widget) => {
    const cfg = asObject(widget.config)
    if (!cfg || !('hideWhenInvalid' in cfg)) return widget
    const rest = { ...cfg }
    delete rest.hideWhenInvalid
    return { ...widget, config: rest }
  })
