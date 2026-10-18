export const SIGNAL_LABELS: ReadonlyMap<string, string> = new Map([
  ['rpm', 'RPM'],
  ['speed_kph', 'SPEED'],
  ['coolant_temp_c', 'WATER'],
  ['oil_temp_c', 'OIL T'],
  ['oil_press_bar', 'OIL PRESS'],
  ['fuel_press_bar', 'FUEL PRESS'],
  ['fuel_level_pct', 'FUEL'],
  ['map_kpa', 'MAP'],
  ['boost_bar', 'BOOST'],
  ['boost_target_bar', 'TARGET'],
  ['throttle_pos', 'TPS'],
  ['gear', 'GEAR'],
  ['afr_1', 'AFR'],
  ['lambda_1', 'LAMBDA'],
  ['iat_c', 'IAT'],
  ['egt_c', 'EGT'],
  ['gearbox_temp_c', 'GEARBOX'],
  ['diff_temp_c', 'DIFF'],
  ['knock_count', 'KNOCK'],
  ['clutch_state', 'CLUTCH'],
  ['odo_km', 'ODO'],
  ['trip_km', 'TRIP'],
  ['battery_volts', 'BATT'],
  ['flag_mil', 'MIL'],
  ['flag_anti_lag', 'ALS'],
  ['flag_launch_ctrl', 'LAUNCH'],
  ['flag_traction_cut', 'TC'],
  ['flag_flat_shift', 'FLAT SHIFT'],
])

export const NO_SIGNAL_LABEL = '—'

const labelFromName = (signal: string): string => signal.replace(/_+/g, ' ').toUpperCase().trim()

export const signalDisplayLabel = (signal: string): string => {
  if (!signal) return NO_SIGNAL_LABEL
  return SIGNAL_LABELS.get(signal) ?? labelFromName(signal)
}
