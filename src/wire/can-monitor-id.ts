export const CAN_MONITOR_EXTENDED_ID = 0x8000_0000

export const CAN_STANDARD_ID_MAX = 0x7ff

export const CAN_EXTENDED_ID_MAX = 0x1fff_ffff

export interface CanMonitorId {
  id: number
  extended: boolean
}

const isUint32 = (value: number): boolean => Number.isInteger(value) && value >= 0

export const isValidCanId = ({ id, extended }: CanMonitorId): boolean =>
  isUint32(id) && id <= (extended ? CAN_EXTENDED_ID_MAX : CAN_STANDARD_ID_MAX)

export const tagCanId = ({ id, extended }: CanMonitorId): number =>
  (extended ? id | CAN_MONITOR_EXTENDED_ID : id) >>> 0

export const untagCanId = (tagged: number): CanMonitorId | null => {
  const extended = (tagged & CAN_MONITOR_EXTENDED_ID) !== 0
  const id = (tagged & CAN_EXTENDED_ID_MAX) >>> 0
  const reservedBits = (tagged & ~(CAN_MONITOR_EXTENDED_ID | CAN_EXTENDED_ID_MAX)) !== 0
  if (reservedBits || !isValidCanId({ id, extended })) return null
  return { id, extended }
}
