import { asPlainObject, cloneJsonWithoutForbiddenKeys } from '../wire/plain-object.js'
import { MigrationError } from './errors.js'

export { asPlainObject } from '../wire/plain-object.js'

type Config = Record<string, unknown>

export const asObjectArray = (value: unknown): Config[] | undefined =>
  Array.isArray(value) ? (value as Config[]) : undefined

export const mapPages = (config: Config, version: string, fn: (page: Config) => Config): Config => {
  const pages = asObjectArray(config.pages)
  if (!pages) return { ...config, version }
  return { ...config, version, pages: pages.map(fn) }
}

export const mapWidgets = (
  config: Config,
  version: string,
  fn: (widget: Config) => Config
): Config =>
  mapPages(config, version, (page) => {
    const widgets = asObjectArray(page.widgets)
    if (!widgets) return page
    return { ...page, widgets: widgets.map(fn) }
  })

export const dropWidgetConfigKeys = (
  config: Config,
  version: string,
  keys: readonly string[]
): Config =>
  mapWidgets(config, version, (widget) => {
    const widgetConfig = asPlainObject(widget.config)
    if (!widgetConfig) return widget
    if (!keys.some((key) => key in widgetConfig)) return widget
    const kept = Object.entries(widgetConfig).filter(([key]) => !keys.includes(key))
    return { ...widget, config: Object.fromEntries(kept) }
  })

export const cloneAndStripForbiddenKeys = (
  value: Record<string, unknown>
): Record<string, unknown> => {
  try {
    return cloneJsonWithoutForbiddenKeys(value)
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err)
    throw new MigrationError(
      'not_serializable',
      `Invalid config: not serializable to JSON (${reason})`,
      {
        cause: err,
      }
    )
  }
}
