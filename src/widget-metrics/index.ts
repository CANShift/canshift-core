export type { FontBreakpoint, Ratio } from './scale.js'
export { WIDGET_FONT_CLAMP, ratioScale } from './scale.js'
export {
  WIDGET_ZONE_COLORS,
  WIDGET_ACCENT_COLOR,
  WIDGET_MUTED_COLOR,
  WIDGET_TEXT_COLORS,
  WIDGET_DIM_COLORS,
  WIDGET_STALE_TEXT_COLORS,
  widgetTextColor,
  widgetDimColor,
  widgetStaleTextColor,
} from './colors.js'
export {
  VALUE_UNIT_FONT_SIZE,
  VALUE_UNIT_RATIO,
  VALUE_UNIT_FONT_MIN,
  STALE_PLACEHOLDER,
  valueUnitFontSize,
  BIG_TO_DEVICE_FONT,
  deviceValueFontPx,
} from './value-font.js'
export {
  GAUGE_ARC,
  GAUGE_TRACK_COLORS,
  WIDGET_TOP_RULE,
  widgetTopRulePx,
  GAUGE_VALUE_FONT_BREAKPOINTS,
  gaugeValueFontSize,
  gaugeArcStrokeWidth,
  gaugeValueAngle,
  gaugeArcPath,
} from './gauge.js'
export {
  LABEL_FONT_RATIO,
  labelFontSize,
  GEAR_FONT_RATIO,
  gearFontSize,
  GEAR_NEUTRAL_GLYPH,
  GEAR_REVERSE_GLYPH,
  gearGlyph,
} from './label-gear.js'
export {
  WARNING_BLINK_PERIOD_MS,
  WARNING_BLINK_OPACITY,
  WARNING_IDLE_BG_OPACITY,
  WARNING_STALE_BORDER_WIDTH,
  WARNING_SIGNAL_LABEL_MIN_HEIGHT,
  isWarningTripped,
} from './warning.js'
export {
  TIMER_LONG_PRESS_MS,
  TIMER_BLINK_PERIOD_MS,
  TIMER_STATE_BORDER_WIDTH,
  TIMER_BORDER_COLORS,
  TIMER_FONT_BREAKPOINTS,
  TIMER_PRIMARY_MIN_WIDTH,
  timerFontSize,
  formatTimerMmSs,
  formatTimerSsMmm,
} from './timer.js'
export type { SensorDangerThreshold } from './sensor.js'
export {
  SENSOR_DEFAULT_RANGES,
  sensorDefaultRange,
  SENSOR_DANGER_COLOR,
  sensorDefaultDangerThreshold,
} from './sensor.js'
export { SECONDARY_BAR, SHIFT_LIGHT, shiftLightLitSegments } from './shift-light.js'
