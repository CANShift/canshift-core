import { asPlainObject, asObjectArray, mapPages } from '../config-traverse.js'
import { legacyPixelLayoutToSpans, legacyProfileDimensions } from '../legacy-layout.js'
import type { MigrationFn } from '../types.js'

export const pixelLayoutToGridSpans: MigrationFn = (config) => {
  const profile = legacyProfileDimensions(config)
  const topBar = asPlainObject(config.topBar)
  const topBarHeight = typeof topBar?.height === 'number' ? topBar.height : 0
  return mapPages(config, '1.25.0', (page) => {
    const widgets = asObjectArray(page.widgets)
    if (!widgets) return page
    const areaHeight = page.showTopBar !== false ? profile.height - topBarHeight : profile.height
    return {
      ...page,
      widgets: widgets.map((widget) => {
        const layout = asPlainObject(widget.layout)
        if (!layout) return widget
        const spans = legacyPixelLayoutToSpans(layout, profile.width, areaHeight)
        if (!spans) return widget
        return { ...widget, layout: spans }
      }),
    }
  })
}
