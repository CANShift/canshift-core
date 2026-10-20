import type { HexColor } from '../schemas/common.js'
import type { TimerSource } from '../schemas/widgets/timer.js'

import { WIDGET_ACCENT_COLOR, WIDGET_DIM_COLORS } from './colors.js'
import { sizeForHeight } from './scale.js'

export const TIMER_LONG_PRESS_MS = 600
export const TIMER_BLINK_PERIOD_MS = 1000
export const TIMER_STATE_BORDER_WIDTH = 2
export const TIMER_BORDER_COLORS = {
  running: WIDGET_ACCENT_COLOR,
  paused: WIDGET_DIM_COLORS.night,
} as const satisfies Record<'running' | 'paused', HexColor>

export interface TimerSourceKicker {
  metric: string
  imperial: string
}

const sameInBoth = (kicker: string): TimerSourceKicker => ({ metric: kicker, imperial: kicker })

export const TIMER_SOURCE_KICKERS: Readonly<Record<TimerSource, TimerSourceKicker>> = {
  elapsed: sameInBoth('TIMER'),
  lap: sameInBoth('LAP'),
  best: sameInBoth('BEST'),
  last: sameInBoth('LAST'),
  lapCount: sameInBoth('LAPS'),
  delta: sameInBoth('DELTA'),
  launchSprint: { metric: '0-100', imperial: '0-60' },
  launchStrip: { metric: '400 M', imperial: '1/4 MI' },
}

export const TIMER_FONT_BREAKPOINTS = [
  { minHeight: 55, size: 40 },
  { minHeight: 28, size: 22 },
  { minHeight: 0, size: 17 },
] as const

const TIMER_PRIMARY_MIN_WIDTH = 150

export const timerFontSize = (height: number, width?: number): number => {
  const size = sizeForHeight(TIMER_FONT_BREAKPOINTS, height)
  const primary = TIMER_FONT_BREAKPOINTS[0]
  if (size !== primary.size) return size
  const fitsPrimary = width !== undefined && width >= TIMER_PRIMARY_MIN_WIDTH
  return fitsPrimary ? primary.size : TIMER_FONT_BREAKPOINTS[1].size
}

const pad = (value: number, width: number): string => String(value).padStart(width, '0')

export const formatTimerMmSs = (elapsedMs: number, colonVisible: boolean): string => {
  const totalSeconds = Math.floor(elapsedMs / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  const separator = colonVisible ? ':' : ' '
  return `${pad(minutes, 2)}${separator}${pad(seconds, 2)}`
}

export const formatTimerSsMmm = (elapsedMs: number): string => {
  const totalSeconds = Math.floor(elapsedMs / 1000)
  const millis = elapsedMs % 1000
  return `${pad(totalSeconds, 2)}.${pad(millis, 3)}`
}
