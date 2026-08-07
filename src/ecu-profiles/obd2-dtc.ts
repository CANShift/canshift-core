export const OBD2_MODE_READ_DTC = 0x03
export const OBD2_MODE_CLEAR_DTC = 0x04

export const OBD2_POSITIVE_RESPONSE_OFFSET = 0x40
export const OBD2_MODE_READ_DTC_RESPONSE = OBD2_MODE_READ_DTC + OBD2_POSITIVE_RESPONSE_OFFSET
export const OBD2_MODE_CLEAR_DTC_RESPONSE = OBD2_MODE_CLEAR_DTC + OBD2_POSITIVE_RESPONSE_OFFSET

export type DtcSystem = 'powertrain' | 'chassis' | 'body' | 'network'

const DTC_PREFIX = ['P', 'C', 'B', 'U'] as const

const DTC_SYSTEM: Record<(typeof DTC_PREFIX)[number], DtcSystem> = {
  P: 'powertrain',
  C: 'chassis',
  B: 'body',
  U: 'network',
}

export const decodeDtc = (byteA: number, byteB: number): string => {
  const prefix: (typeof DTC_PREFIX)[number] = DTC_PREFIX[(byteA >> 6) & 0x03] ?? 'P'
  const firstDigit = (byteA >> 4) & 0x03
  const remaining = ((byteA & 0x0f) << 8) | (byteB & 0xff)
  return `${prefix}${String(firstDigit)}${remaining.toString(16).toUpperCase().padStart(3, '0')}`
}

export const decodeDtcList = (bytes: readonly number[]): string[] => {
  const codes: string[] = []
  for (let i = 0; i + 1 < bytes.length; i += 2) {
    const byteA = bytes[i]
    const byteB = bytes[i + 1]
    if (byteA === undefined || byteB === undefined) break
    if (byteA === 0 && byteB === 0) continue
    codes.push(decodeDtc(byteA, byteB))
  }
  return codes
}

export const dtcSystem = (code: string): DtcSystem => {
  const prefix = code[0] as (typeof DTC_PREFIX)[number] | undefined
  return prefix !== undefined && prefix in DTC_SYSTEM ? DTC_SYSTEM[prefix] : 'powertrain'
}
