import { STRING_CAPS } from '../constants/firmware-caps.js'
import type { CriticalAlertDirection } from '../schemas/critical-alert.js'
import {
  ALERT_SOURCE_ID_COUNT,
  alertOriginFromId,
  alertSourceId,
  isConfiguredAlertIndex,
  type AlertOrigin,
} from './alert-sources.js'
import { toFixedPoint } from './fixed-point.js'
import { TELEMETRY_SCALE } from './telemetry-frame.js'
import { clamp } from '../math/clamp.js'

export interface AlertLimit {
  value: number
  direction: CriticalAlertDirection
}

interface AlertReading {
  signal: string
  value: number
  limit: AlertLimit | null
  acknowledged: boolean
  displayed: boolean
  activeSeconds: number
}

export type ActiveAlert = AlertOrigin & AlertReading

export const ALERT_FRAME_VERSION = 2

export const MAX_ALERT_ACTIVE_SECONDS = 0xffff

const HEADER_BYTES = 2

const ENTRY_FIXED_BYTES = 13

const FLAG_HAS_LIMIT = 0x01
const FLAG_BELOW = 0x02
const FLAG_ACKNOWLEDGED = 0x04
const FLAG_DISPLAYED = 0x08
const KNOWN_FLAGS = FLAG_HAS_LIMIT | FLAG_BELOW | FLAG_ACKNOWLEDGED | FLAG_DISPLAYED

const PRINTABLE_ASCII_RE = /^[\x21-\x7e]+$/

const isEncodableSignal = (signal: string): boolean =>
  signal.length <= STRING_CAPS.SIGNAL_NAME && PRINTABLE_ASCII_RE.test(signal)

const isEncodableOrigin = (origin: AlertOrigin): boolean =>
  origin.source !== 'configured' || isConfiguredAlertIndex(origin.configuredIndex)

const isEncodable = (alert: ActiveAlert): boolean =>
  isEncodableOrigin(alert) &&
  Number.isFinite(alert.value) &&
  (alert.limit === null || Number.isFinite(alert.limit.value)) &&
  isEncodableSignal(alert.signal)

const isEncodableSet = (alerts: readonly ActiveAlert[]): boolean =>
  alerts.length <= ALERT_SOURCE_ID_COUNT &&
  alerts.every(isEncodable) &&
  new Set(alerts.map(alertSourceId)).size === alerts.length &&
  alerts.filter((alert) => alert.displayed).length <= 1

const flagsOf = (alert: ActiveAlert): number =>
  (alert.limit === null ? 0 : FLAG_HAS_LIMIT) |
  (alert.limit?.direction === 'below' ? FLAG_BELOW : 0) |
  (alert.acknowledged ? FLAG_ACKNOWLEDGED : 0) |
  (alert.displayed ? FLAG_DISPLAYED : 0)

const writeEntry = (view: DataView, offset: number, alert: ActiveAlert): number => {
  view.setUint8(offset, alertSourceId(alert))
  view.setUint8(offset + 1, flagsOf(alert))
  view.setInt32(offset + 2, toFixedPoint(alert.value, TELEMETRY_SCALE), true)
  view.setInt32(offset + 6, toFixedPoint(alert.limit?.value ?? 0, TELEMETRY_SCALE), true)
  view.setUint16(offset + 10, clamp(alert.activeSeconds, 0, MAX_ALERT_ACTIVE_SECONDS), true)
  view.setUint8(offset + 12, alert.signal.length)
  for (let index = 0; index < alert.signal.length; index++) {
    view.setUint8(offset + ENTRY_FIXED_BYTES + index, alert.signal.charCodeAt(index))
  }
  return offset + ENTRY_FIXED_BYTES + alert.signal.length
}

export const encodeAlertFrame = (alerts: readonly ActiveAlert[]): Uint8Array | null => {
  if (!isEncodableSet(alerts)) return null
  const size = alerts.reduce(
    (total, alert) => total + ENTRY_FIXED_BYTES + alert.signal.length,
    HEADER_BYTES
  )
  const bytes = new Uint8Array(size)
  const view = new DataView(bytes.buffer)
  view.setUint8(0, ALERT_FRAME_VERSION)
  view.setUint8(1, alerts.length)
  let offset = HEADER_BYTES
  for (const alert of alerts) offset = writeEntry(view, offset, alert)
  return bytes
}

interface DecodedEntry {
  alert: ActiveAlert | null
  next: number
}

const readSignal = (bytes: Uint8Array, start: number, length: number): string | null => {
  const signal = String.fromCharCode(...bytes.subarray(start, start + length))
  return isEncodableSignal(signal) ? signal : null
}

const readLimit = (view: DataView, offset: number, flags: number): AlertLimit | null => {
  if ((flags & FLAG_HAS_LIMIT) === 0) return null
  const direction = (flags & FLAG_BELOW) === 0 ? 'above' : 'below'
  return { value: view.getInt32(offset + 6, true) / TELEMETRY_SCALE, direction }
}

const readEntry = (view: DataView, bytes: Uint8Array, offset: number): DecodedEntry | null => {
  if (offset + ENTRY_FIXED_BYTES > bytes.length) return null
  const origin = alertOriginFromId(view.getUint8(offset))
  const flags = view.getUint8(offset + 1)
  if (origin === undefined || (flags & ~KNOWN_FLAGS) !== 0) return null
  const signalLength = view.getUint8(offset + 12)
  const next = offset + ENTRY_FIXED_BYTES + signalLength
  if (next > bytes.length) return null
  const signal = readSignal(bytes, offset + ENTRY_FIXED_BYTES, signalLength)
  if (signal === null) return { alert: null, next }
  const alert: ActiveAlert = {
    ...origin,
    signal,
    value: view.getInt32(offset + 2, true) / TELEMETRY_SCALE,
    limit: readLimit(view, offset, flags),
    acknowledged: (flags & FLAG_ACKNOWLEDGED) !== 0,
    displayed: (flags & FLAG_DISPLAYED) !== 0,
    activeSeconds: view.getUint16(offset + 10, true),
  }
  return { alert, next }
}

const readEntries = (view: DataView, bytes: Uint8Array, count: number): ActiveAlert[] | null => {
  const alerts: ActiveAlert[] = []
  let offset = HEADER_BYTES
  for (let index = 0; index < count; index++) {
    const entry = readEntry(view, bytes, offset)
    if (entry === null) return null
    if (entry.alert !== null) alerts.push(entry.alert)
    offset = entry.next
  }
  return offset === bytes.length ? alerts : null
}

export const decodeAlertFrame = (bytes: Uint8Array): ActiveAlert[] | null => {
  if (bytes.length < HEADER_BYTES) return null
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  if (view.getUint8(0) !== ALERT_FRAME_VERSION) return null
  const count = view.getUint8(1)
  if (count > ALERT_SOURCE_ID_COUNT) return null
  const alerts = readEntries(view, bytes, count)
  if (alerts === null || !isEncodableSet(alerts)) return null
  return alerts
}
