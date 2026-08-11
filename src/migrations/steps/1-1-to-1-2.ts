import { asPlainObject, mapWidgets } from '../config-traverse.js'
import type { MigrationFn } from '../types.js'

export const labelToGauge: MigrationFn = (config) =>
  mapWidgets(config, '1.2.0', (widget) => {
    const cfg = asPlainObject(widget.config)
    if (!cfg) return widget

    if (widget.type === 'label') {
      return {
        ...widget,
        type: 'gauge',
        config: {
          type: 'gauge',
          displayStyle: 'numeric',
          minValue: 0,
          maxValue: 100,
          warningLevel: 80,
          dangerLevel: 95,
          decimalPlaces: (cfg.decimalPlaces as number | undefined) ?? 0,
          ...(cfg.prefix !== undefined && { prefix: cfg.prefix }),
          ...(cfg.suffix !== undefined && { suffix: cfg.suffix }),
          ...(cfg.hideWhenInvalid !== undefined && { hideWhenInvalid: cfg.hideWhenInvalid }),
          ...(cfg.iconName !== undefined && { iconName: cfg.iconName }),
        },
      }
    }

    if (widget.type === 'gauge' && !cfg.displayStyle) {
      return {
        ...widget,
        config: {
          ...cfg,
          type: 'gauge',
          displayStyle: 'arc',
          decimalPlaces: (cfg.decimalPlaces as number | undefined) ?? 0,
        },
      }
    }

    return widget
  })
