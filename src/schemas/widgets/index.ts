export type { SensorIconName } from './sensor-icon.js'

export type { GaugeDisplayStyle } from './gauge.js'

export { ButtonActionSchema, CRUISE_CONTROL_OPS, TIMER_CONTROL_OPS } from './button-action.js'
export type {
  ButtonAction,
  CanRawAction,
  CruiseControlAction,
  CruiseControlOp,
  TimerControlAction,
  MapSwitchAction,
  NavigateAction,
} from './button-action.js'

export { ButtonWidgetConfigSchema, MAX_CYCLE_STATES, MIN_CYCLE_STATES } from './button.js'

export { TimerWidgetConfigSchema, TIMER_SOURCES } from './timer.js'
export type { TimerSource } from './timer.js'
export { SHIFT_LIGHT_SEGMENT_COUNT } from './shift-light.js'

export { WidgetSchema } from './widget.js'
export type {
  ButtonWidgetConfig,
  GaugeWidgetConfig,
  GearWidgetConfig,
  ImageWidgetConfig,
  SingleActionButtonConfig,
  Widget,
  WidgetConfig,
  WidgetOfType,
  WidgetType,
} from './widget.js'
