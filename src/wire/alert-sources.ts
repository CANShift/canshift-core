import { DEVICE_COMMANDS } from './device-commands.js'
import { FIRMWARE_CAPS } from '../constants/firmware-caps.js'

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

type AlertSource = (typeof ALERT_SOURCES)[number]

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

export type AlertOrigin =
  | { source: BuiltInAlertSource; configuredIndex: null }
  | { source: 'configured'; configuredIndex: number }

const BUILT_IN_ALERT_SOURCES = ALERT_SOURCES.filter(
  (source): source is BuiltInAlertSource => source !== 'configured'
)

export const FIRST_CONFIGURED_ALERT_ID = BUILT_IN_ALERT_SOURCES.length

export const ALERT_SOURCE_ID_COUNT = FIRST_CONFIGURED_ALERT_ID + FIRMWARE_CAPS.MAX_CRITICAL_ALERTS

export const isConfiguredAlertIndex = (index: number): boolean =>
  Number.isInteger(index) && index >= 0 && index < FIRMWARE_CAPS.MAX_CRITICAL_ALERTS

export const alertSourceId = (origin: AlertOrigin): number =>
  origin.source === 'configured'
    ? FIRST_CONFIGURED_ALERT_ID + origin.configuredIndex
    : BUILT_IN_ALERT_SOURCES.indexOf(origin.source)

export const alertOriginFromId = (id: number): AlertOrigin | undefined => {
  if (!Number.isInteger(id) || id < 0 || id >= ALERT_SOURCE_ID_COUNT) return undefined
  const builtIn = BUILT_IN_ALERT_SOURCES[id]
  if (builtIn !== undefined) return { source: builtIn, configuredIndex: null }
  return { source: 'configured', configuredIndex: id - FIRST_CONFIGURED_ALERT_ID }
}

export const ALERT_ACK_COMMAND = DEVICE_COMMANDS.ackAlert

export const alertAckCommand = (origin?: AlertOrigin): string =>
  JSON.stringify(
    origin === undefined
      ? { cmd: ALERT_ACK_COMMAND }
      : { cmd: ALERT_ACK_COMMAND, source: alertSourceId(origin) }
  )
