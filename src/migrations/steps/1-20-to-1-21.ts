import { asPlainObject, flatMapWidgets } from '../config-traverse.js'
import type { MigrationFn } from '../types.js'

export const retireBarWidgets: MigrationFn = (config) =>
  flatMapWidgets(config, '1.21.0', (widget) => {
    if (widget.type === 'bar') return []
    if (widget.type !== 'gauge') return [widget]
    const cfg = asPlainObject(widget.config)
    if (!cfg) return [widget]
    const hadBarStyle = cfg.displayStyle === 'bar'
    if (!hadBarStyle && !('barOrientation' in cfg)) return [widget]
    const rest = { ...cfg }
    delete rest.barOrientation
    if (hadBarStyle) rest.displayStyle = 'numeric'
    return [{ ...widget, config: rest }]
  })
