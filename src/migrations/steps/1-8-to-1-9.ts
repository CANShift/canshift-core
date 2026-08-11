import { asPlainObject, mapWidgets } from '../config-traverse.js'
import { resizeWithinCanvas } from '../legacy-layout.js'
import type { MigrationFn } from '../types.js'

export const growHorizontalBars: MigrationFn = (config) =>
  mapWidgets(config, '1.9.0', (widget) => {
    const cfg = asPlainObject(widget.config)
    const layout = asPlainObject(widget.layout)
    if (!cfg || !layout) return widget
    if (cfg.displayStyle !== 'bar') return widget
    if (cfg.barOrientation !== 'horizontal') return widget
    if (layout.w !== 320 || layout.h !== 28) return widget
    return { ...widget, layout: resizeWithinCanvas(layout, 320, 56) }
  })
