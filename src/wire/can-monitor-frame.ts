import { clamp } from '../math/clamp.js'
import { isValidCanId, tagCanId, untagCanId, type CanMonitorId } from './can-monitor-id.js'

export interface CanMonitorEntry extends CanMonitorId {
  data: readonly number[]
  count: number
  ageMs: number
}

export interface CanMonitorFrame {
  deviceMs: number
  overflow: boolean
  filtered: boolean
  entries: CanMonitorEntry[]
}

export const CAN_MONITOR_FRAME_VERSION = 1

export const CAN_MONITOR_MAX_FRAME_BYTES = 244

export const CAN_MONITOR_MAX_DATA_BYTES = 8

const HEADER_BYTES = 8

const ENTRY_FIXED_BYTES = 9

const UINT16_MAX = 0xffff

const FLAG_OVERFLOW = 0x01
const FLAG_FILTERED = 0x02
const KNOWN_FLAGS = FLAG_OVERFLOW | FLAG_FILTERED

const isByte = (value: number): boolean => Number.isInteger(value) && value >= 0 && value <= 0xff

const isEncodableEntry = (entry: CanMonitorEntry): boolean =>
  isValidCanId(entry) &&
  entry.data.length <= CAN_MONITOR_MAX_DATA_BYTES &&
  entry.data.every(isByte) &&
  Number.isInteger(entry.count) &&
  Number.isInteger(entry.ageMs)

const entryBytes = (entry: CanMonitorEntry): number => ENTRY_FIXED_BYTES + entry.data.length

const frameBytes = (entries: readonly CanMonitorEntry[]): number =>
  entries.reduce((total, entry) => total + entryBytes(entry), HEADER_BYTES)

const isEncodableFrame = (frame: CanMonitorFrame): boolean =>
  Number.isInteger(frame.deviceMs) &&
  frame.deviceMs >= 0 &&
  frame.deviceMs <= 0xffff_ffff &&
  frame.entries.length > 0 &&
  frame.entries.every(isEncodableEntry) &&
  frameBytes(frame.entries) <= CAN_MONITOR_MAX_FRAME_BYTES

const flagsOf = (frame: CanMonitorFrame): number =>
  (frame.overflow ? FLAG_OVERFLOW : 0) | (frame.filtered ? FLAG_FILTERED : 0)

const writeEntry = (view: DataView, offset: number, entry: CanMonitorEntry): number => {
  view.setUint32(offset, tagCanId(entry), true)
  view.setUint8(offset + 4, entry.data.length)
  view.setUint16(offset + 5, clamp(entry.count, 0, UINT16_MAX), true)
  view.setUint16(offset + 7, clamp(entry.ageMs, 0, UINT16_MAX), true)
  new Uint8Array(view.buffer).set(entry.data, offset + ENTRY_FIXED_BYTES)
  return offset + entryBytes(entry)
}

export const encodeCanMonitorFrame = (frame: CanMonitorFrame): Uint8Array | null => {
  if (!isEncodableFrame(frame)) return null
  const bytes = new Uint8Array(frameBytes(frame.entries))
  const view = new DataView(bytes.buffer)
  view.setUint8(0, CAN_MONITOR_FRAME_VERSION)
  view.setUint8(1, frame.entries.length)
  view.setUint8(2, flagsOf(frame))
  view.setUint32(4, frame.deviceMs, true)
  let offset = HEADER_BYTES
  for (const entry of frame.entries) offset = writeEntry(view, offset, entry)
  return bytes
}

interface DecodedEntry {
  entry: CanMonitorEntry
  next: number
}

const readEntry = (view: DataView, bytes: Uint8Array, offset: number): DecodedEntry | null => {
  if (offset + ENTRY_FIXED_BYTES > bytes.length) return null
  const id = untagCanId(view.getUint32(offset, true))
  const length = view.getUint8(offset + 4)
  const end = offset + ENTRY_FIXED_BYTES + length
  if (id === null || length > CAN_MONITOR_MAX_DATA_BYTES || end > bytes.length) return null
  const entry: CanMonitorEntry = {
    ...id,
    data: Array.from(bytes.subarray(offset + ENTRY_FIXED_BYTES, end)),
    count: view.getUint16(offset + 5, true),
    ageMs: view.getUint16(offset + 7, true),
  }
  return { entry, next: end }
}

const readEntries = (
  view: DataView,
  bytes: Uint8Array,
  count: number
): CanMonitorEntry[] | null => {
  const entries: CanMonitorEntry[] = []
  let offset = HEADER_BYTES
  for (let index = 0; index < count; index++) {
    const decoded = readEntry(view, bytes, offset)
    if (decoded === null) return null
    entries.push(decoded.entry)
    offset = decoded.next
  }
  return offset === bytes.length ? entries : null
}

const isTrustedHeader = (view: DataView): boolean =>
  view.getUint8(0) === CAN_MONITOR_FRAME_VERSION &&
  view.getUint8(1) > 0 &&
  (view.getUint8(2) & ~KNOWN_FLAGS) === 0 &&
  view.getUint8(3) === 0

export const decodeCanMonitorFrame = (bytes: Uint8Array): CanMonitorFrame | null => {
  if (bytes.length < HEADER_BYTES || bytes.length > CAN_MONITOR_MAX_FRAME_BYTES) return null
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  if (!isTrustedHeader(view)) return null
  const entries = readEntries(view, bytes, view.getUint8(1))
  if (entries === null) return null
  const flags = view.getUint8(2)
  return {
    deviceMs: view.getUint32(4, true),
    overflow: (flags & FLAG_OVERFLOW) !== 0,
    filtered: (flags & FLAG_FILTERED) !== 0,
    entries,
  }
}
