import { asPlainObject, mapWidgets } from '../config-traverse.js'
import type { MigrationFn } from '../types.js'

export const syncWidgetTypeWithConfig: MigrationFn = (config) =>
  mapWidgets(config, '1.27.0', (widget) => {
    const configType = asPlainObject(widget.config)?.type
    return typeof configType === 'string' && configType !== widget.type
      ? { ...widget, type: configType }
      : widget
  })
