export const ALERT_SOURCES = [
  'oil_pressure',
  'coolant_temp',
  'oil_temp',
  'battery_voltage',
  'exhaust_temp',
  'gearbox_temp',
  'diff_temp',
  'configured',
] as const

export type AlertSource = (typeof ALERT_SOURCES)[number]

export type BuiltInAlertSource = Exclude<AlertSource, 'configured'>

export const BUILT_IN_ALERT_SIGNALS: Readonly<Record<BuiltInAlertSource, string>> = {
  oil_pressure: 'oil_press_bar',
  coolant_temp: 'coolant_temp_c',
  oil_temp: 'oil_temp_c',
  battery_voltage: 'battery_volts',
  exhaust_temp: 'egt_c',
  gearbox_temp: 'gearbox_temp_c',
  diff_temp: 'diff_temp_c',
}

export const alertSourceId = (source: AlertSource): number => ALERT_SOURCES.indexOf(source)

export const alertSourceFromId = (id: number): AlertSource | undefined => ALERT_SOURCES[id]

export const ALERT_ACK_COMMAND = 'ack_alert'

export const alertAckCommand = (source?: AlertSource): string =>
  JSON.stringify(
    source === undefined
      ? { cmd: ALERT_ACK_COMMAND }
      : { cmd: ALERT_ACK_COMMAND, source: alertSourceId(source) }
  )
