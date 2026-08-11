import { hex } from '../colors/hex.js'
import type { HexColor } from '../schemas/common.js'

export const WIDGET_ZONE_COLORS = {
  warning: hex('#FF8800'),
  danger: hex('#FF4444'),
} as const satisfies Record<'warning' | 'danger', HexColor>

export const WIDGET_ACCENT_COLOR = hex('#FF4747')
export const WIDGET_MUTED_COLOR = hex('#BABABA')

export const WIDGET_TEXT_COLORS = {
  day: hex('#000000'),
  night: hex('#FFFFFF'),
} as const satisfies Record<'day' | 'night', HexColor>

export const WIDGET_STALE_TEXT_COLORS = {
  day: hex('#888888'),
  night: hex('#555555'),
} as const satisfies Record<'day' | 'night', HexColor>

export const widgetTextColor = (isDayMode: boolean): HexColor =>
  isDayMode ? WIDGET_TEXT_COLORS.day : WIDGET_TEXT_COLORS.night

export const widgetStaleTextColor = (isDayMode: boolean): HexColor =>
  isDayMode ? WIDGET_STALE_TEXT_COLORS.day : WIDGET_STALE_TEXT_COLORS.night
