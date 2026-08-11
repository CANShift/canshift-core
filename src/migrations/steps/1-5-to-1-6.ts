import { asPlainObject, mapWidgets } from '../config-traverse.js'
import { STANDARD_WIDGET_TYPES, resizeWithinCanvas, upgradeLegacySize } from '../legacy-layout.js'
import type { MigrationFn } from '../types.js'

export const upgradeLegacyWidgetSizes: MigrationFn = (config) =>
  mapWidgets(config, '1.6.0', (widget) => {
    const type = widget.type
    if (typeof type !== 'string' || !STANDARD_WIDGET_TYPES.has(type)) return widget

    const layout = asPlainObject(widget.layout)
    if (!layout) return widget
    const w = layout.w
    const h = layout.h
    if (typeof w !== 'number' || typeof h !== 'number') return widget

    const upgraded = upgradeLegacySize(w, h)
    if (!upgraded) return widget

    return { ...widget, layout: resizeWithinCanvas(layout, upgraded.w, upgraded.h) }
  })
