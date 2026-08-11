export const WARNING_BLINK_PERIOD_MS = 1000
export const WARNING_BLINK_OPACITY = { min: 0x00, max: 0xcc } as const
export const WARNING_IDLE_BG_OPACITY = 0x18
export const WARNING_STALE_BORDER_WIDTH = 1
export const WARNING_SIGNAL_LABEL_MIN_HEIGHT = 28

export const isWarningTripped = (
  value: number,
  threshold: number,
  invertLogic: boolean
): boolean => (invertLogic ? value < threshold : value >= threshold)
