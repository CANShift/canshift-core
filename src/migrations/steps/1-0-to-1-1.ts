import { asPlainObject, flatMapWidgets } from '../config-traverse.js'
import type { MigrationFn } from '../types.js'

export const buttonActionsFromTarget: MigrationFn = (config) =>
  flatMapWidgets(config, '1.1.0', (widget) => {
    if (widget.type !== 'button') return [widget]
    const cfg = asPlainObject(widget.config)
    if (!cfg) return [widget]
    if (Array.isArray(cfg.actions)) return cfg.actions.length > 0 ? [widget] : []

    const targetPageId = cfg.targetPageId
    if (typeof targetPageId !== 'string' || targetPageId.length === 0) return []

    const rest = { ...cfg }
    delete rest.targetPageId
    return [
      {
        ...widget,
        config: {
          ...rest,
          actions: [{ category: 'dashboard', type: 'navigate', pageId: targetPageId }],
        },
      },
    ]
  })
