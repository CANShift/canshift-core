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

export const WIDGET_DIM_COLORS = {
  day: hex('#5A5A5A'),
  night: hex('#BABAB8'),
} as const satisfies Record<'day' | 'night', HexColor>

export const WIDGET_GROUND_COLORS = {
  day: hex('#DDDDDD'),
  night: hex('#121212'),
} as const satisfies Record<'day' | 'night', HexColor>

export const WIDGET_TRACK_COLORS = {
  day: hex('#C4C4C4'),
  night: hex('#222222'),
} as const satisfies Record<'day' | 'night', HexColor>

export const WIDGET_LOCK_LINE_COLORS = {
  day: hex('#B4B4B4'),
  night: hex('#333333'),
} as const satisfies Record<'day' | 'night', HexColor>

export const WIDGET_LOCK_INK_COLORS = {
  day: hex('#8A8A8A'),
  night: hex('#6B6B6B'),
} as const satisfies Record<'day' | 'night', HexColor>

export const WIDGET_STALE_TEXT_COLORS = {
  day: hex('#888888'),
  night: hex('#555555'),
} as const satisfies Record<'day' | 'night', HexColor>

export const widgetTextColor = (isDayMode: boolean): HexColor =>
  isDayMode ? WIDGET_TEXT_COLORS.day : WIDGET_TEXT_COLORS.night

export const widgetDimColor = (isDayMode: boolean): HexColor =>
  isDayMode ? WIDGET_DIM_COLORS.day : WIDGET_DIM_COLORS.night

export const widgetStaleTextColor = (isDayMode: boolean): HexColor =>
  isDayMode ? WIDGET_STALE_TEXT_COLORS.day : WIDGET_STALE_TEXT_COLORS.night

export const widgetGroundColor = (isDayMode: boolean): HexColor =>
  isDayMode ? WIDGET_GROUND_COLORS.day : WIDGET_GROUND_COLORS.night

export const widgetTrackColor = (isDayMode: boolean): HexColor =>
  isDayMode ? WIDGET_TRACK_COLORS.day : WIDGET_TRACK_COLORS.night

export const widgetLockLineColor = (isDayMode: boolean): HexColor =>
  isDayMode ? WIDGET_LOCK_LINE_COLORS.day : WIDGET_LOCK_LINE_COLORS.night

export const widgetLockInkColor = (isDayMode: boolean): HexColor =>
  isDayMode ? WIDGET_LOCK_INK_COLORS.day : WIDGET_LOCK_INK_COLORS.night
