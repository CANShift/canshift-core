import {
  LAYOUT_GRID,
  resolveGridRect,
  type GridArea,
  type GridPlacement,
  type GridRect,
} from './layout-grid.js'

export const SHIFT_STRIP = {
  HEIGHT: 7,
  ROW_GAP: 6,
} as const

const SHIFT_STRIP_BAND = SHIFT_STRIP.HEIGHT + SHIFT_STRIP.ROW_GAP

const bandRow = (row: number): number => (row > 0 ? row - 1 : row)

export const resolveContentRect = (
  placement: GridPlacement,
  area: GridArea,
  hasShiftStrip: boolean
): GridRect => {
  if (!hasShiftStrip) return resolveGridRect(placement, area)
  const content = { width: area.width, height: Math.max(area.height - SHIFT_STRIP_BAND, 0) }
  const rect = resolveGridRect({ ...placement, row: bandRow(placement.row) }, content)
  return { ...rect, y: rect.y + SHIFT_STRIP_BAND }
}

export const pageHasShiftStrip = (page: { widgets: readonly { type: string }[] }): boolean =>
  page.widgets.some((widget) => widget.type === 'shift_light')

const resolveStripRect = (placement: GridPlacement, width: number): GridRect => {
  const strip = { col: placement.col, colSpan: placement.colSpan, row: 0, rowSpan: 1 }
  const rect = resolveGridRect(strip, { width, height: width })
  return { x: rect.x, w: rect.w, y: LAYOUT_GRID.FRAME_PADDING, h: SHIFT_STRIP.HEIGHT }
}

export interface PlacedWidget {
  type: string
  layout: GridPlacement
}

export const resolvePageWidgetRect = (
  widget: PlacedWidget,
  area: GridArea,
  hasShiftStrip: boolean
): GridRect => {
  if (hasShiftStrip && widget.type === 'shift_light')
    return resolveStripRect(widget.layout, area.width)
  return resolveContentRect(widget.layout, area, hasShiftStrip)
}
