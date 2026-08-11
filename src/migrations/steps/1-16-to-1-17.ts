import { asObject, mapWidgets } from '../config-traverse.js'
import type { MigrationFn } from '../types.js'

export const promoteWarningToDanger: MigrationFn = (config) =>
  mapWidgets(config, '1.17.0', (widget) => {
    const cfg = asObject(widget.config)
    if (!cfg) return widget
    if (!('warningLevel' in cfg)) return widget
    const { warningLevel: wl, ...rest } = cfg
    const newCfg =
      rest.dangerLevel === undefined && typeof wl === 'number' ? { ...rest, dangerLevel: wl } : rest
    return { ...widget, config: newCfg }
  })
