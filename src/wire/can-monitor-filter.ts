import {
  CAN_EXTENDED_ID_MAX,
  CAN_MONITOR_EXTENDED_ID,
  isValidCanId,
  tagCanId,
  type CanMonitorId,
} from './can-monitor-id.js'

export interface CanIdFilter extends CanMonitorId {
  mask: number
}

export const CAN_MONITOR_FILTER_VERSION = 1

export const CAN_MONITOR_MAX_FILTERS = 8

const HEADER_BYTES = 2

const PAIR_BYTES = 8

const isEncodableFilter = (filter: CanIdFilter): boolean =>
  isValidCanId(filter) &&
  Number.isInteger(filter.mask) &&
  filter.mask >= 0 &&
  filter.mask <= CAN_EXTENDED_ID_MAX

const wireMask = (filter: CanIdFilter): number => (filter.mask | CAN_MONITOR_EXTENDED_ID) >>> 0

export const encodeCanMonitorFilter = (filters: readonly CanIdFilter[]): Uint8Array | null => {
  if (filters.length > CAN_MONITOR_MAX_FILTERS || !filters.every(isEncodableFilter)) return null
  const bytes = new Uint8Array(HEADER_BYTES + filters.length * PAIR_BYTES)
  const view = new DataView(bytes.buffer)
  view.setUint8(0, CAN_MONITOR_FILTER_VERSION)
  view.setUint8(1, filters.length)
  filters.forEach((filter, index) => {
    const offset = HEADER_BYTES + index * PAIR_BYTES
    view.setUint32(offset, tagCanId(filter), true)
    view.setUint32(offset + 4, wireMask(filter), true)
  })
  return bytes
}
