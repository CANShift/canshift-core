export { SensorIconNameSchema } from './sensor-icon.js'
export type { SensorIconName } from './sensor-icon.js'

export { GaugeDisplayStyleSchema, GaugeWidgetConfigSchema } from './gauge.js'
export type { GaugeDisplayStyle } from './gauge.js'

export { WarningWidgetConfigSchema } from './warning.js'

export {
  ButtonActionSchema,
  CRUISE_CONTROL_OPS,
  CruiseControlOpSchema,
  TIMER_CONTROL_OPS,
  TimerControlOpSchema,
} from './button-action.js'
export type {
  ButtonAction,
  CanRawAction,
  CruiseControlAction,
  CruiseControlOp,
  TimerControlAction,
  TimerControlOp,
  DashboardButtonAction,
  EcuButtonAction,
  MapSwitchAction,
  NavigateAction,
} from './button-action.js'

export {
  ButtonWidgetConfigSchema,
  CycleButtonConfigSchema,
  CycleButtonStateSchema,
  MAX_CYCLE_STATES,
  MIN_CYCLE_STATES,
  SingleActionButtonConfigSchema,
} from './button.js'

export { TimerWidgetConfigSchema, TIMER_SOURCES, TimerSourceSchema } from './timer.js'
export type { TimerSource } from './timer.js'
export { GearWidgetConfigSchema } from './gear.js'
export { ImageWidgetConfigSchema } from './image.js'
export { SHIFT_LIGHT_SEGMENT_COUNT, ShiftLightWidgetConfigSchema } from './shift-light.js'

export { WIDGET_TYPES, WidgetConfigSchema, WidgetSchema, WidgetTypeSchema } from './widget.js'
export type {
  ButtonWidgetConfig,
  CycleButtonConfig,
  CycleButtonState,
  GaugeWidgetConfig,
  GearWidgetConfig,
  ImageWidgetConfig,
  ShiftLightWidgetConfig,
  SingleActionButtonConfig,
  TimerWidgetConfig,
  WarningWidgetConfig,
  Widget,
  WidgetConfig,
  WidgetType,
} from './widget.js'
