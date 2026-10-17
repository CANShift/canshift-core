import { STRING_CAPS, Z_ORDER } from '../../constants/firmware-caps.js'
import { asObjectArray, asPlainObject, mapPages } from '../config-traverse.js'
import type { MigrationFn } from '../types.js'

type Config = Record<string, unknown>

const CAPPED_ITEM_KEYS: Readonly<Record<string, number>> = {
  text: STRING_CAPS.TOPBAR_TEXT,
  format: STRING_CAPS.TOPBAR_FORMAT,
}

const truncate = (value: unknown, cap: number): unknown =>
  typeof value === 'string' ? value.slice(0, cap) : value

const clampZOrder = (value: unknown): unknown =>
  typeof value === 'number' ? Math.min(Z_ORDER.MAX, Math.max(Z_ORDER.MIN, value)) : value

const capKeys = (source: Config, caps: Readonly<Record<string, number>>): Config =>
  Object.fromEntries(
    Object.entries(source).map(([key, value]) => {
      const cap = caps[key]
      return [key, cap === undefined ? value : truncate(value, cap)]
    })
  )

const capItem = (item: unknown): unknown => {
  const object = asPlainObject(item)
  return object ? capKeys(object, CAPPED_ITEM_KEYS) : item
}

const capStatusRow = (row: unknown): unknown => {
  const object = asPlainObject(row)
  if (!object) return row
  return Object.fromEntries(Object.entries(object).map(([slot, item]) => [slot, capItem(item)]))
}

const capAction = (action: unknown): unknown => {
  const object = asPlainObject(action)
  return object ? capKeys(object, { pageId: STRING_CAPS.ID }) : action
}

const capButtonConfig = (config: Config): Config => {
  const actions = asObjectArray(config.actions)
  const states = asObjectArray(config.states)
  const capped = { ...config }
  if (actions) capped.actions = actions.map(capAction)
  if (states) capped.states = states.map((state) => ({ ...state, action: capAction(state.action) }))
  return capped
}

const capWidget = (widget: Config): Config => {
  const layout = asPlainObject(widget.layout)
  const config = asPlainObject(widget.config)
  const capped: Config = { ...widget, id: truncate(widget.id, STRING_CAPS.ID) }
  if (layout) capped.layout = { ...layout, zOrder: clampZOrder(layout.zOrder) }
  if (config?.type === 'button') capped.config = capButtonConfig(config)
  return capped
}

const capPage = (page: Config): Config => {
  const widgets = asObjectArray(page.widgets)
  const capped: Config = { ...page, id: truncate(page.id, STRING_CAPS.ID) }
  if (widgets) capped.widgets = widgets.map(capWidget)
  if (page.statusRow !== undefined) capped.statusRow = capStatusRow(page.statusRow)
  return capped
}

const capTopBar = (topBar: unknown): unknown => {
  const object = asPlainObject(topBar)
  const layout = asObjectArray(object?.layout)
  if (!object || !layout) return topBar
  return { ...object, layout: layout.map(capItem) }
}

export const capFirmwareStrings: MigrationFn = (config) => {
  const capped = mapPages(config, '1.44.0', capPage)
  return {
    ...capped,
    defaultPageId: truncate(capped.defaultPageId, STRING_CAPS.ID),
    topBar: capTopBar(capped.topBar),
  }
}
