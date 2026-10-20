export { WIDGET_FONT_CLAMP } from './scale.js'
export {
  WIDGET_ZONE_COLORS,
  WIDGET_ACCENT_COLOR,
  WIDGET_TEXT_COLORS,
  WIDGET_DIM_COLORS,
  WIDGET_STALE_TEXT_COLORS,
  WIDGET_GROUND_COLORS,
  WIDGET_TRACK_COLORS,
  WIDGET_LOCK_LINE_COLORS,
  WIDGET_LOCK_INK_COLORS,
  widgetTextColor,
  widgetDimColor,
  widgetStaleTextColor,
  widgetGroundColor,
  widgetTrackColor,
  widgetLockLineColor,
  widgetLockInkColor,
} from './colors.js'
export {
  VALUE_UNIT_FONT_SIZE,
  STALE_PLACEHOLDER,
  valueUnitFontSize,
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
  isValueInDanger,
} from './gauge.js'
export { gaugeSeverity, signalSeverity } from './gauge-severity.js'
export type { GaugeSeverity, SignalLimits } from './gauge-severity.js'
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
  TIMER_SOURCE_KICKERS,
  timerFontSize,
  formatTimerMmSs,
  formatTimerSsMmm,
} from './timer.js'
export type { TimerSourceKicker } from './timer.js'
export type { SensorDangerBand } from './sensor.js'
export {
  SENSOR_DEFAULT_RANGES,
  sensorDefaultRange,
  SENSOR_DANGER_COLOR,
  sensorDefaultDangerThreshold,
  sensorDefaultDangerBand,
  isOutsideDangerBand,
} from './sensor.js'
export { SECONDARY_BAR, SHIFT_LIGHT, shiftLightLitSegments } from './shift-light.js'
export {
  G_METER,
  G_METER_RANGE_G,
  G_METER_SECTOR_DIRECTIONS,
  gMeterEnvelopeVertex,
  gMeterFeltForce,
  gMeterPlotBox,
  gMeterPlotOffset,
} from './g-meter.js'
export type { GMeterOffset, GMeterPlotBox } from './g-meter.js'
