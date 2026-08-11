import { asObject, flatMapWidgets } from '../config-traverse.js'
import type { MigrationFn } from '../types.js'

export const defaultButtonModeSingle: MigrationFn = (config) =>
  flatMapWidgets(config, '1.23.0', (widget) => {
    if (widget.type !== 'button') return [widget]
    const cfg = asObject(widget.config)
    if (!cfg) return [widget]
    if (cfg.mode === 'cycle') return [widget]
    if (Array.isArray(cfg.actions) && cfg.actions.length === 0) return []
    if ('mode' in cfg) return [widget]
    return [{ ...widget, config: { ...cfg, mode: 'single' } }]
  })
