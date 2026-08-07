export const TELEMETRY_FIELDS = [
  'r',
  'tps',
  'map',
  'mi',
  'bst',
  'iat',
  'ct',
  'ot',
  'op',
  'fp',
  'lam',
  's',
  'g',
  'bat',
] as const

export type TelemetryFieldKey = (typeof TELEMETRY_FIELDS)[number]

export type TelemetryFrame = Partial<Record<TelemetryFieldKey, number>>

export const TELEMETRY_FRAME_VERSION = 1

export const TELEMETRY_SCALE = 1000

const HEADER_BYTES = 3

const VALUE_BYTES = 4

const FIELD_MASK = (1 << TELEMETRY_FIELDS.length) - 1

const scaleToInt = (value: number): number => {
  const magnitude = Math.round(Math.abs(value) * TELEMETRY_SCALE)
  return value < 0 ? -magnitude : magnitude
}

const countBits = (mask: number): number => {
  let count = 0
  for (let bit = mask; bit !== 0; bit >>>= 1) count += bit & 1
  return count
}

export const encodeTelemetryFrame = (frame: TelemetryFrame): Uint8Array => {
  let mask = 0
  const values: number[] = []
  for (let index = 0; index < TELEMETRY_FIELDS.length; index++) {
    const key = TELEMETRY_FIELDS[index]
    if (key === undefined) continue
    const value = frame[key]
    if (value === undefined || !Number.isFinite(value)) continue
    mask |= 1 << index
    values.push(scaleToInt(value))
  }

  const bytes = new Uint8Array(HEADER_BYTES + values.length * VALUE_BYTES)
  const view = new DataView(bytes.buffer)
  view.setUint8(0, TELEMETRY_FRAME_VERSION)
  view.setUint16(1, mask, true)
  let offset = HEADER_BYTES
  for (const value of values) {
    view.setInt32(offset, value, true)
    offset += VALUE_BYTES
  }
  return bytes
}

export const decodeTelemetryFrame = (bytes: Uint8Array): TelemetryFrame | null => {
  if (bytes.length < HEADER_BYTES) return null
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  if (view.getUint8(0) !== TELEMETRY_FRAME_VERSION) return null

  const mask = view.getUint16(1, true)
  if ((mask & ~FIELD_MASK) !== 0) return null
  if (bytes.length !== HEADER_BYTES + countBits(mask) * VALUE_BYTES) return null

  const frame: TelemetryFrame = {}
  let offset = HEADER_BYTES
  for (let index = 0; index < TELEMETRY_FIELDS.length; index++) {
    if ((mask & (1 << index)) === 0) continue
    const key = TELEMETRY_FIELDS[index]
    if (key === undefined) continue
    frame[key] = view.getInt32(offset, true) / TELEMETRY_SCALE
    offset += VALUE_BYTES
  }
  return frame
}
