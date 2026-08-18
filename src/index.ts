export type { HexColor, WidgetLayout, WidgetStyle, SemVer } from './schemas/common.js'
export { HexColorSchema } from './schemas/common.js'

export {
  BRAND_ACCENT,
  BRAND_INK,
  BRAND_PAPER,
  MONOGRAM_VIEWBOX,
  MONOGRAM_TRANSFORM,
  MONOGRAM_C_PATH,
  MONOGRAM_S_PATH,
  MONOGRAM_STROKE_WIDTH,
  LOCKUP_VIEWBOX,
  LOCKUP_BASELINE_VIEWBOX,
  LOCKUP_MONOGRAM_TRANSFORM,
  LOCKUP_DIVIDER,
  LOCKUP_WORDMARK_TRANSFORM,
  LOCKUP_BASELINE_TRANSFORM,
  LOCKUP_BASELINE_OPACITY,
  WORDMARK_CAN_PATH,
  WORDMARK_SHIFT_PATH,
  BASELINE_TEXT_PATH,
} from './brand.js'

export type {
  DashboardConfig,
  PageConfig,
  PagePalette,
  PageTemplate,
  ThemeFace,
  ThemePreset,
  TopBarConfig,
  TopBarItem,
  TopBarItemPosition,
  PageStatusRow,
} from './schemas/dashboard.js'
export type { UnitPair, UnitSystem } from './units/index.js'
export {
  UNIT_SYSTEMS,
  UNIT_PAIRS,
  DEFAULT_UNIT_SYSTEM,
  unitPairFor,
  hasUnitPair,
  displayUnit,
  displayValue,
  canonicalValue,
} from './units/index.js'

export {
  UnitSystemSchema,
  DashboardConfigSchema,
  DAY_NIGHT_SIGNAL_MAX_LEN,
  DEFAULT_PAGE_PALETTE,
  DEFAULT_TOP_BAR_LAYOUT,
  PAGE_TEMPLATES,
  PageStatusRowSchema,
  PageTemplateSchema,
} from './schemas/dashboard.js'

export type {
  ButtonAction,
  ButtonWidgetConfig,
  CanRawAction,
  CruiseControlAction,
  CruiseControlOp,
  TimerControlAction,
  TimerSource,
  TimerControlOp,
  CycleButtonConfig,
  CycleButtonState,
  DashboardButtonAction,
  EcuButtonAction,
  GaugeDisplayStyle,
  GaugeWidgetConfig,
  GearWidgetConfig,
  ImageWidgetConfig,
  MapSwitchAction,
  NavigateAction,
  SensorIconName,
  ShiftLightWidgetConfig,
  SingleActionButtonConfig,
  TimerWidgetConfig,
  WarningWidgetConfig,
  Widget,
  WidgetConfig,
  WidgetType,
} from './schemas/widgets/index.js'
export {
  CRUISE_CONTROL_OPS,
  TIMER_CONTROL_OPS,
  TIMER_SOURCES,
  TimerSourceSchema,
  TimerControlOpSchema,
  MAX_CYCLE_STATES,
  MIN_CYCLE_STATES,
  SensorIconNameSchema,
  SHIFT_LIGHT_SEGMENT_COUNT,
  ShiftLightWidgetConfigSchema,
  WidgetSchema,
} from './schemas/widgets/index.js'

export type {
  CanSpeedKbps,
  ColorRamp,
  ColorRampStop,
  OutboundCanSignal,
  RampInterpolation,
  SignalByteLength,
  SignalConfig,
  SignalDef,
} from './schemas/signal.js'
export { SIGNAL_BYTE_LENGTHS, SignalConfigSchema, SignalDefSchema } from './schemas/signal.js'

export type { Obd2Mode, Obd2Pid, Obd2Polling } from './schemas/obd2.js'
export {
  Obd2ModeSchema,
  Obd2PidSchema,
  Obd2PollingSchema,
  OBD2_MIN_INTERVAL_MS,
  OBD2_MAX_INTERVAL_MS,
  OBD2_DEFAULT_INTERVAL_MS,
} from './schemas/obd2.js'
export type { Obd2Mode01PidEntry } from './ecu-profiles/obd2-mode01-pids.js'
export { OBD2_MODE01_PIDS, obd2PidLookup } from './ecu-profiles/obd2-mode01-pids.js'
export type { DtcSystem } from './ecu-profiles/obd2-dtc.js'
export {
  OBD2_MODE_READ_DTC,
  OBD2_MODE_CLEAR_DTC,
  OBD2_POSITIVE_RESPONSE_OFFSET,
  OBD2_MODE_READ_DTC_RESPONSE,
  OBD2_MODE_CLEAR_DTC_RESPONSE,
  decodeDtc,
  decodeDtcList,
  dtcSystem,
} from './ecu-profiles/obd2-dtc.js'
export type { DeviceConfig, DeviceConfigResult } from './schemas/device.js'
export {
  DEFAULT_DEVICE_CONFIG,
  DeviceConfigSchema,
  DeviceConfigWireSchema,
  Esp32InputGpioSchema,
  Esp32OutputGpioSchema,
  SAFE_INPUT_PINS_WROOM32,
  SAFE_OUTPUT_PINS_WROOM32,
  deviceConfigFromWire,
  deviceConfigToWire,
  parseDeviceConfig,
} from './schemas/device.js'

export type {
  InputBinding,
  InputBindingsConfig,
  InputBindingsResult,
  InputActiveLevel,
  InputPressKind,
} from './schemas/input-bindings.js'
export {
  InputBindingsConfigSchema,
  InputBindingsConfigWireSchema,
  inputBindingsFromWire,
  inputBindingsToWire,
  parseInputBindings,
  MAX_INPUT_BINDINGS,
  INPUT_BINDING_ID_MAX_LEN,
} from './schemas/input-bindings.js'

export type { TrackTelemetry, TrackTelemetryResult } from './schemas/track-telemetry.js'
export { TrackTelemetrySchema, parseTrackTelemetry } from './schemas/track-telemetry.js'
export type {
  GeoPoint,
  LineSegment,
  LapCrossingDetector,
  LapCrossingDetectorOptions,
} from './track/lap-detection.js'
export {
  createLapCrossingDetector,
  segmentIntersect,
  bearingDeg,
  signedAngleDelta,
} from './track/lap-detection.js'
export type { StartFinishLine } from './track/start-finish-line.js'
export { DEFAULT_HALF_WIDTH_M, startFinishLineFromPosition } from './track/start-finish-line.js'

export type { TelemetryFieldKey, TelemetryFrame } from './wire/telemetry-frame.js'
export {
  TELEMETRY_FIELDS,
  TELEMETRY_FRAME_VERSION,
  TELEMETRY_SCALE,
  encodeTelemetryFrame,
  decodeTelemetryFrame,
} from './wire/telemetry-frame.js'

export type { ScreenSettings, ScreenSettingsResult } from './schemas/screen-settings.js'
export {
  ScreenSettingsSchema,
  SCREEN_SETTINGS_BOUNDS,
  parseSettings,
} from './schemas/screen-settings.js'

export type { BleStatus, BleStatusResult } from './schemas/ble-status.js'
export { BLE_STATUS_MAX_STRING_LEN, parseBleStatus } from './schemas/ble-status.js'
export type { UsbStatus, UsbStatusResult } from './schemas/usb-status.js'
export { USB_STATUS_MAX_STRING_LEN, parseUsbStatus } from './schemas/usb-status.js'
export type {
  TimerBleLap,
  TimerBleState,
  TimerCommand,
  TimerCommandCode,
  TimerLapResult,
  TimerLapWire,
  TimerRunState,
  TimerStateResult,
  TimerStateWire,
} from './schemas/ble-timer.js'
export {
  TIMER_COMMAND_CODES,
  TIMER_LAP_BUFFER_CAPACITY,
  TIMER_RUN_STATES,
  TimerLapWireSchema,
  TimerStateWireSchema,
  encodeTimerCommand,
  parseTimerLap,
  parseTimerState,
  timerLapFromWire,
  timerStateFromWire,
} from './schemas/ble-timer.js'

export type {
  LogFrame,
  CanFrame,
  TeleFrame,
  HeapStatsFrame,
  HeapStatsFrameWire,
} from './schemas/ws-frames.js'
export {
  LogFrameSchema,
  CanFrameSchema,
  TeleFrameSchema,
  HeapStatsFrameWireSchema,
  heapStatsFromWire,
} from './schemas/ws-frames.js'

export {
  SENSOR_KINDS,
  SENSOR_KIND_TO_ICON,
  SENSOR_DEFAULT_RAMPS,
  colorAtValue,
} from './sensor-defaults.js'
export type { SensorKind } from './sensor-defaults.js'

export { SIGNAL_TYPES, SignalTypeSchema } from './schemas/signal-type.js'
export type { SignalType } from './schemas/signal-type.js'

export type { ReleaseAsset, ReleaseInfo, LatestReleaseResult } from './types/releases.js'
export { ReleaseAssetSchema, ReleaseInfoSchema } from './types/releases.js'

export { validateDashboard } from './validation/validate-dashboard.js'
export type { ValidationResult, ValidateDashboardOptions } from './validation/validate-dashboard.js'
export { validateSignalConfig } from './validation/validate-signal-config.js'

export {
  SCREEN_PROFILES,
  DEFAULT_SCREEN_PROFILE_ID,
  ScreenProfileSchema,
  ScreenProfileIdSchema,
  getScreenProfile,
  resolveScreenProfile,
} from './schemas/screen-profile.js'
export type { ScreenProfile, ScreenProfileId } from './schemas/screen-profile.js'

export {
  FIRMWARE_CAPS,
  CANVAS,
  TOPBAR_HEIGHT,
  REV_LIMIT_RPM,
  DECIMAL_PLACES,
  MAX_RAMP_STOPS,
} from './constants/firmware-caps.js'

export { TopBarMetrics } from './topbar-metrics.js'
export type { TopBarMetricsRatios } from './topbar-metrics.js'

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
  WIDGET_FONT_CLAMP,
  ratioScale,
  VALUE_UNIT_FONT_SIZE,
  STALE_PLACEHOLDER,
  GAUGE_ARC,
  GAUGE_TRACK_COLORS,
  GAUGE_VALUE_FONT_BREAKPOINTS,
  gaugeValueFontSize,
  gaugeArcStrokeWidth,
  gaugeValueAngle,
  isValueInDanger,
  gaugeArcPath,
  LABEL_FONT_RATIO,
  labelFontSize,
  WIDGET_TOP_RULE,
  widgetTopRulePx,
  VALUE_UNIT_RATIO,
  VALUE_UNIT_FONT_MIN,
  valueUnitFontSize,
  GEAR_FONT_RATIO,
  gearFontSize,
  GEAR_NEUTRAL_GLYPH,
  GEAR_REVERSE_GLYPH,
  gearGlyph,
  WARNING_BLINK_PERIOD_MS,
  WARNING_BLINK_OPACITY,
  WARNING_IDLE_BG_OPACITY,
  WARNING_STALE_BORDER_WIDTH,
  WARNING_SIGNAL_LABEL_MIN_HEIGHT,
  isWarningTripped,
  TIMER_LONG_PRESS_MS,
  TIMER_BLINK_PERIOD_MS,
  TIMER_STATE_BORDER_WIDTH,
  TIMER_BORDER_COLORS,
  TIMER_FONT_BREAKPOINTS,
  TIMER_PRIMARY_MIN_WIDTH,
  timerFontSize,
  BIG_TO_DEVICE_FONT,
  deviceValueFontPx,
  formatTimerMmSs,
  formatTimerSsMmm,
  SENSOR_DEFAULT_RANGES,
  sensorDefaultRange,
  SENSOR_DANGER_COLOR,
  sensorDefaultDangerThreshold,
  SECONDARY_BAR,
  SHIFT_LIGHT,
  shiftLightLitSegments,
} from './widget-metrics/index.js'
export type { SensorDangerThreshold } from './widget-metrics/index.js'

export { DAY_PALETTE_DEFAULT, DAY_BG_DEFAULT, DAY_THEME_FACE } from './day-theme-defaults.js'

export type { ThemePresetEntry } from './theme-presets.js'
export {
  DEFAULT_THEME_ID,
  THEME_PRESETS,
  defaultThemePreset,
  themePresetById,
} from './theme-presets.js'

export {
  describeWireParseFailure,
  parseJsonObject,
  parseUntrustedJsonObject,
  parseWireJson,
} from './wire/parse-envelope.js'
export type { WireEnvelopeFailure, WireParseFailure } from './wire/parse-envelope.js'

export {
  BUILTIN_MIGRATIONS,
  MigrationError,
  migrateConfig,
  validateMigrationChain,
} from './migrations/index.js'
export type {
  Migration,
  MigrationErrorCode,
  MigrationFn,
  MigrationRegistry,
  MigrationResult,
} from './migrations/index.js'

export type {
  DesignTokens,
  BrandTokens,
  BrandNeutralStep,
  FontTokens,
} from './design-tokens/index.js'
export {
  COLOR_KEY_TO_CSS_VAR,
  DARK_TOKENS,
  tokensToCssVars,
  BRAND_TOKENS,
  BRAND_NEUTRAL_STEPS,
  BRAND_COLOR_KEY_TO_CSS_VAR,
  BRAND_TEXT_CSS_VAR,
  BRAND_DIVIDER_CSS_VAR,
  brandNeutralCssVar,
  brandTokensToCssVars,
  brandLightThemeCssVars,
  FONT_TOKENS,
  FONT_UI_CSS_VAR,
  FONT_MONO_CSS_VAR,
  fontTokensToCssVars,
} from './design-tokens/index.js'

export { CURRENT_SCHEMA_VERSION } from './schema-version.js'

export type { GridArea, GridPlacement, GridRect } from './layout-grid.js'
export type { DisplayTier, DisplayTierId } from './display-tiers.js'
export {
  BASE_DISPLAY_TIER,
  DISPLAY_TIERS,
  DISPLAY_TIER_IDS,
  DISPLAY_TIER_LIST,
  displayTier,
  tierForPanel,
} from './display-tiers.js'
export {
  LAYOUT_GRID,
  clampGridPlacement,
  isSpanOverflowing,
  nearestTrack,
  placementsOverlap,
  resolveGridRect,
} from './layout-grid.js'

export type { EcuProfile } from './ecu-profiles/index.js'
export { ECU_PROFILES, DEFAULT_PROFILE_ID, MAXXECU_SIGNAL_UNITS } from './ecu-profiles/index.js'

export type { ParseCanXmlResult } from './can-xml/parse-can-xml.js'
export { parseCanXml } from './can-xml/parse-can-xml.js'
export type { EvalContext } from './can-xml/eval-expr.js'
export { compileExpr, evalExpr, evalExprChecked } from './can-xml/eval-expr.js'
export {
  PROJECT_FILE_VERSION,
  PROJECT_NAME_MAX,
  ProjectMetaSchema,
  ProjectSchema,
} from './schemas/project.js'
export type { Project, ProjectMeta } from './schemas/project.js'
export {
  CANSHIFT_FILE_FORMAT,
  CANSHIFT_FILE_FORMAT_VERSION,
  CANSHIFT_FILE_EXTENSION,
  CANSHIFT_FILE_MIME,
  serializeCanshiftFile,
  parseCanshiftFile,
  describeCanshiftFileError,
} from './schemas/canshift-file.js'
export type {
  CanshiftFile,
  CanshiftFileResult,
  CanshiftFileError,
} from './schemas/canshift-file.js'

export {
  CHIP_FAMILIES,
  LCD_DRIVERS,
  TOUCH_DRIVERS,
  CAN_CONTROLLERS,
  BOARD_ID_MAX_LEN,
  BOARD_NAME_MAX_LEN,
  BoardProfileWireSchema,
  boardProfileFromWire,
  boardProfileToWire,
  BOARD_PROFILE_MAGIC,
  BOARD_PROFILE_SCHEMA,
  BOARD_PROFILE_FORMAT_VERSION,
  serializeBoardProfile,
  parseBoardProfile,
  BOARD_PROFILES,
  getBoardProfile,
} from './board-profile/index.js'
export type {
  ChipFamily,
  LcdDriver,
  TouchDriver,
  CanController,
  LcdProfile,
  BacklightProfile,
  TouchProfile,
  CanProfile,
  StorageProfile,
  ConnectivityProfile,
  BoardProfile,
  BoardProfileWire,
  BoardProfileBlob,
  BoardProfileResult,
} from './board-profile/index.js'
