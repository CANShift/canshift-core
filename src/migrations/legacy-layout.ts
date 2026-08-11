import { CANVAS } from '../constants/firmware-caps.js'
import { LAYOUT_GRID } from '../layout-grid.js'
import { SCREEN_PROFILES, resolveScreenProfile } from '../schemas/screen-profile.js'

type Config = Record<string, unknown>

export const STANDARD_WIDGET_TYPES = new Set(['button', 'warning', 'gear', 'timer', 'image'])

export const resizeWithinCanvas = (layout: Config, w: number, h: number): Config => {
  const x =
    typeof layout.x === 'number' ? Math.max(0, Math.min(layout.x, CANVAS.WIDTH - w)) : layout.x
  const y =
    typeof layout.y === 'number' ? Math.max(0, Math.min(layout.y, CANVAS.HEIGHT - h)) : layout.y
  return { ...layout, x, y, w, h }
}

export const upgradeLegacySize = (w: number, h: number): { w: number; h: number } | null =>
  w === 80 && (h === 28 || h === 56 || h === 112) ? { w: 160, h: 56 } : null

const clampInt = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max)

export const legacyAxisToSpan = (
  start: number,
  length: number,
  size: number,
  tracks: number
): { track: number; span: number } => {
  const content = size - 2 * LAYOUT_GRID.FRAME_PADDING
  if (content <= 0) return { track: 0, span: 1 }
  const pitch = content + LAYOUT_GRID.GUTTER
  const boundary = (px: number): number =>
    Math.round(((px - LAYOUT_GRID.FRAME_PADDING) * tracks) / pitch)
  const track = clampInt(boundary(start), 0, tracks - 1)
  const end = clampInt(boundary(start + length + LAYOUT_GRID.GUTTER), track + 1, tracks)
  return { track, span: end - track }
}

export const legacyProfileDimensions = (config: Config): { width: number; height: number } => {
  const target = typeof config.targetProfile === 'string' ? config.targetProfile : undefined
  const profile =
    SCREEN_PROFILES.find((p) => (p.id as string) === target) ?? resolveScreenProfile(undefined)
  return { width: profile.width, height: profile.height }
}

export const legacyPixelLayoutToSpans = (
  layout: Config,
  areaWidth: number,
  areaHeight: number
): Config | undefined => {
  const { x, y, w, h } = layout
  if (
    typeof x !== 'number' ||
    typeof y !== 'number' ||
    typeof w !== 'number' ||
    typeof h !== 'number'
  ) {
    return undefined
  }
  const cols = legacyAxisToSpan(x, w, areaWidth, LAYOUT_GRID.COLUMNS)
  const rows = legacyAxisToSpan(y, h, areaHeight, LAYOUT_GRID.ROWS)
  return {
    col: cols.track,
    colSpan: cols.span,
    row: rows.track,
    rowSpan: rows.span,
    zOrder: typeof layout.zOrder === 'number' ? layout.zOrder : 0,
  }
}
