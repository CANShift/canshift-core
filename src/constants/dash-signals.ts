export const WHEEL_BUTTON_SIGNALS = [
  'wheel_button_1',
  'wheel_button_2',
  'wheel_button_3',
  'wheel_button_4',
] as const

export type WheelButtonSignal = (typeof WHEEL_BUTTON_SIGNALS)[number]

export const DASH_SIGNALS = [
  'rpm',
  'throttle_pos',
  'map_kpa',
  'boost_bar',
  'iat_c',
  'coolant_temp_c',
  'oil_temp_c',
  'oil_press_bar',
  'fuel_press_bar',
  'lambda_1',
  'afr_1',
  'speed_kph',
  'gear',
  'battery_volts',
  'fuel_level_pct',
  'egt_c',
  'gearbox_temp_c',
  'diff_temp_c',
  'knock_count',
  'knock_cyl',
  'flag_mil',
  'flag_launch_ctrl',
  'flag_flat_shift',
  'flag_anti_lag',
  'flag_traction_cut',
  'clutch_state',
  'flag_brake',
  'flag_pit_limit',
  'flag_cruise',
  'boost_target_bar',
  'map_number',
  'map_name_idx',
  'odo_km',
  'trip_km',
  'lap_timer_ms',
  'flag_boost_cut',
  'flag_fuel_cut',
  'flag_ignition_cut',
  'flag_ignition_retard',
  'flag_rev_limit',
  'flag_pit_limit_cut',
  'flag_overheat_protect',
  'flag_limp_mode',
  ...WHEEL_BUTTON_SIGNALS,
] as const

export type DashSignal = (typeof DASH_SIGNALS)[number]

const DASH_SIGNAL_SET: ReadonlySet<string> = new Set(DASH_SIGNALS)

export const isDashSignal = (name: string): name is DashSignal => DASH_SIGNAL_SET.has(name)
