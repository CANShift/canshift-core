export const SIGNAL_FALLBACK_UNITS: ReadonlyMap<string, string> = new Map([
  ['rpm', 'rpm'],
  ['speed_kph', 'km/h'],
  ['coolant_temp_c', '°C'],
  ['oil_temp_c', '°C'],
  ['oil_press_bar', 'bar'],
  ['fuel_press_bar', 'bar'],
  ['fuel_level_pct', '%'],
  ['map_kpa', 'kPa'],
  ['boost_bar', 'bar'],
  ['boost_target_bar', 'bar'],
  ['throttle_pos', '%'],
  ['gear', ''],
  ['afr_1', ''],
  ['lambda_1', 'λ'],
  ['iat_c', '°C'],
  ['maf_gps', 'g/s'],
  ['run_time_s', 's'],
  ['egt_c', '°C'],
  ['gearbox_temp_c', '°C'],
  ['diff_temp_c', '°C'],
  ['knock_count', ''],
  ['clutch_state', ''],
  ['odo_km', 'km'],
  ['trip_km', 'km'],
  ['battery_volts', 'V'],
  ['flag_mil', ''],
  ['flag_anti_lag', ''],
  ['flag_launch_ctrl', ''],
  ['flag_traction_cut', ''],
  ['flag_flat_shift', ''],
])

export const signalUnitOnDash = (signal: string, declaredUnit: string | undefined): string => {
  if (declaredUnit !== undefined && declaredUnit !== '') return declaredUnit
  return SIGNAL_FALLBACK_UNITS.get(signal) ?? ''
}
