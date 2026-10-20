export * from './entries/ecu-profiles.js'
export * from './entries/schema-version.js'
export * from './entries/tokens.js'
export * from './entries/track.js'
export * from './entries/widget-metrics.js'
export * from './entries/wire.js'

export type { HexColor, WidgetLayout } from './schemas/common.js'
export { HexColorSchema } from './schemas/common.js'

export type {
  DashboardConfig,
  PageConfig,
  PagePalette,
  PageStatusRow,
  PageTemplate,
  ThemePreset,
  TopBarConfig,
  TopBarItem,
} from './schemas/dashboard.js'
export {
  DEFAULT_PAGE_PALETTE,
  DEFAULT_TOP_BAR_LAYOUT,
  DashboardConfigSchema,
} from './schemas/dashboard.js'
export { DAY_BG_DEFAULT, DAY_PALETTE_DEFAULT } from './day-theme-defaults.js'
export type { ThemePresetEntry } from './theme-presets.js'
export { THEME_PRESETS, defaultThemePreset } from './theme-presets.js'

export type { ControlDefinition, ControlState, ControlTone } from './controls/index.js'
export {
  CONTROL_KICKER_ENGAGED_OPACITY,
  CONTROL_PAINT,
  CONTROL_STATES,
  CONTROL_STEP_MAX,
  controlByKicker,
  fillParam,
  supportsArmed,
} from './controls/index.js'

export type { UnitSystem } from './units/index.js'
export {
  DEFAULT_UNIT_SYSTEM,
  canonicalValue,
  displayUnit,
  displayValue,
  hasUnitPair,
} from './units/index.js'

export type { CriticalAlert, CriticalAlertDirection } from './schemas/critical-alert.js'
export type { PageButtonRole, PageButtons } from './schemas/page-buttons.js'
export type { WheelButtonSignal } from './constants/dash-signals.js'
export { WHEEL_BUTTON_SIGNALS } from './constants/dash-signals.js'
export { signalDisplayLabel } from './constants/signal-labels.js'

export type {
  ButtonAction,
  ButtonWidgetConfig,
  CanRawAction,
  CruiseControlAction,
  CruiseControlOp,
  GaugeDisplayStyle,
  GaugeWidgetConfig,
  GMeterWidgetConfig,
  GearWidgetConfig,
  MapSwitchAction,
  NavigateAction,
  SensorIconName,
  SingleActionButtonConfig,
  TimerControlAction,
  TimerSource,
  Widget,
  WidgetConfig,
  WidgetOfType,
  WidgetType,
} from './schemas/widgets/index.js'
export {
  CRUISE_CONTROL_OPS,
  MAX_CYCLE_STATES,
  MIN_CYCLE_STATES,
  SHIFT_LIGHT_SEGMENT_COUNT,
  TIMER_CONTROL_OPS,
  TIMER_SOURCES,
  WidgetSchema,
} from './schemas/widgets/index.js'

export type { CanSpeedKbps, SignalByteLength, SignalDef } from './schemas/signal.js'
export { SIGNAL_BYTE_LENGTHS, SignalConfigSchema, SignalDefSchema } from './schemas/signal.js'
export { OBD2_DEFAULT_INTERVAL_MS } from './schemas/obd2.js'

export type { DeviceConfig } from './schemas/device.js'
export {
  DEFAULT_DEVICE_CONFIG,
  DeviceConfigSchema,
  DeviceConfigWireSchema,
  deviceConfigFromWire,
  deviceConfigToWire,
} from './schemas/device.js'

export type { ScreenSettings } from './schemas/screen-settings.js'
export { SCREEN_SETTINGS_BOUNDS } from './schemas/screen-settings.js'
export type { ScreenProfile, ScreenProfileId } from './schemas/screen-profile.js'
export { resolveScreenProfile } from './schemas/screen-profile.js'

export { validateDashboard } from './validation/validate-dashboard.js'
export { MigrationError, migrateConfig } from './migrations/index.js'

export { FIRMWARE_CAPS, STRING_CAPS } from './constants/firmware-caps.js'
export { TOP_BAR_METRICS } from './topbar-metrics.js'

export type { DisplayTier } from './display-tiers.js'
export { DISPLAY_TIERS, DISPLAY_TIER_LIST, tierForPanel } from './display-tiers.js'
export type { GridPlacement, GridRect, GridTracks } from './layout-grid.js'
export {
  BASE_GRID_TRACKS,
  LAYOUT_GRID,
  clampGridPlacement,
  isSpanOverflowing,
  placementsOverlap,
  resolveGridRect,
} from './layout-grid.js'

export { parseCanXml } from './can-xml/parse-can-xml.js'
export { PROJECT_FILE_VERSION } from './schemas/project.js'
export {
  CANSHIFT_FILE_EXTENSION,
  CANSHIFT_FILE_MIME,
  parseCanshiftFile,
  serializeCanshiftFile,
} from './schemas/canshift-file.js'
export type { BoardProfileBlob } from './board-profile/index.js'
export {
  BOARD_PROFILES,
  boardHasImu,
  getBoardProfile,
  serializeBoardProfile,
} from './board-profile/index.js'
