import { asPlainObject, mapWidgets } from '../config-traverse.js'
import { brightenHex } from '../legacy-values.js'
import type { MigrationFn } from '../types.js'

export const buttonColorsAndGaugeIcons: MigrationFn = (config) =>
  mapWidgets(config, '1.8.0', (widget) => {
    const type = widget.type
    const cfg = asPlainObject(widget.config)
    if (!cfg) return widget

    if (type === 'button') {
      if (cfg.colors !== undefined) return widget
      const style = asPlainObject(widget.style)
      const normal = typeof style?.primaryColor === 'string' ? style.primaryColor : '#FF4444'
      const active = brightenHex(normal)
      return { ...widget, config: { ...cfg, colors: { normal, active } } }
    }

    if (type === 'gauge' || type === 'bar') {
      if (!('iconName' in cfg)) return widget
      const rest = { ...cfg }
      delete rest.iconName
      return { ...widget, config: rest }
    }

    return widget
  })
