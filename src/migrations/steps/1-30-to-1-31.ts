import { asPlainObject, asObjectArray, mapWidgets } from '../config-traverse.js'
import type { MigrationFn } from '../types.js'

const BUTTON_ICON_KEYS = ['iconName', 'iconPath', 'showIcon'] as const

const withoutKeys = (source: Record<string, unknown>, keys: readonly string[]) =>
  Object.fromEntries(Object.entries(source).filter(([key]) => !keys.includes(key)))

const stripButtonIconFields = (widget: Record<string, unknown>): Record<string, unknown> => {
  const widgetConfig = asPlainObject(widget.config)
  if (widgetConfig?.type !== 'button') return widget
  const cleaned = withoutKeys(widgetConfig, BUTTON_ICON_KEYS)
  const states = asObjectArray(widgetConfig.states)
  if (states) {
    cleaned.states = states.map((state) => withoutKeys(state, ['iconName']))
  }
  return { ...widget, config: cleaned }
}

export const stripButtonIcons: MigrationFn = (config) =>
  mapWidgets(config, '1.31.0', stripButtonIconFields)
