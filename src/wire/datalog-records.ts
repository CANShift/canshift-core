export const DATALOG_SIGNAL_SLOTS = 64

export interface DatalogSignal {
  id: number
  name: string
}

export interface DatalogHeader {
  samplePeriodMs: number
  session: number
  signals: DatalogSignal[]
}

export interface DatalogSample {
  tMs: number
  values: Record<string, number>
}

export interface DatalogLap {
  tMs: number
  index: number
  lapMs: number
}

export interface DatalogEnd {
  tMs: number
  dropped: number
}

const HEADER_FIXED_BYTES = 5
const SIGNAL_ENTRY_FIXED_BYTES = 2
const SAMPLE_FIXED_BYTES = 12
const VALUE_BYTES = 4
const LAP_BYTES = 10
const END_BYTES = 8
const MASK_LOW_OFFSET = 4
const MASK_HIGH_OFFSET = 8
const WORD_BITS = 32

const ASCII = new TextDecoder('ascii')

const readSignal = (payload: DataView, offset: number): DatalogSignal | null => {
  if (offset + SIGNAL_ENTRY_FIXED_BYTES > payload.byteLength) return null
  const nameLength = payload.getUint8(offset + 1)
  const nameStart = offset + SIGNAL_ENTRY_FIXED_BYTES
  if (nameStart + nameLength > payload.byteLength) return null
  const bytes = new Uint8Array(payload.buffer, payload.byteOffset + nameStart, nameLength)
  return { id: payload.getUint8(offset), name: ASCII.decode(bytes) }
}

const readSignals = (payload: DataView, count: number): DatalogSignal[] | null => {
  const signals: DatalogSignal[] = []
  let offset = HEADER_FIXED_BYTES
  for (let index = 0; index < count; index++) {
    const signal = readSignal(payload, offset)
    if (signal === null) return null
    signals.push(signal)
    offset += SIGNAL_ENTRY_FIXED_BYTES + signal.name.length
  }
  return offset === payload.byteLength ? signals : null
}

export const readHeader = (payload: DataView): DatalogHeader | null => {
  if (payload.byteLength < HEADER_FIXED_BYTES) return null
  const signals = readSignals(payload, payload.getUint8(4))
  if (signals === null) return null
  return {
    samplePeriodMs: payload.getUint16(0, true),
    session: payload.getUint16(2, true),
    signals,
  }
}

const presentSlots = (payload: DataView): number[] => {
  const low = payload.getUint32(MASK_LOW_OFFSET, true)
  const high = payload.getUint32(MASK_HIGH_OFFSET, true)
  const slots: number[] = []
  for (let slot = 0; slot < DATALOG_SIGNAL_SLOTS; slot++) {
    const word = slot < WORD_BITS ? low : high
    if (((word >>> (slot % WORD_BITS)) & 1) === 1) slots.push(slot)
  }
  return slots
}

export const readSample = (
  payload: DataView,
  names: ReadonlyMap<number, string>
): DatalogSample | null => {
  if (payload.byteLength < SAMPLE_FIXED_BYTES) return null
  const slots = presentSlots(payload)
  if (payload.byteLength !== SAMPLE_FIXED_BYTES + slots.length * VALUE_BYTES) return null
  const values: Record<string, number> = {}
  slots.forEach((slot, index) => {
    const name = names.get(slot)
    if (name === undefined) return
    values[name] = payload.getFloat32(SAMPLE_FIXED_BYTES + index * VALUE_BYTES, true)
  })
  return { tMs: payload.getUint32(0, true), values }
}

export const readLap = (payload: DataView): DatalogLap | null =>
  payload.byteLength === LAP_BYTES
    ? {
        tMs: payload.getUint32(0, true),
        index: payload.getUint16(4, true),
        lapMs: payload.getUint32(6, true),
      }
    : null

export const readEnd = (payload: DataView): DatalogEnd | null =>
  payload.byteLength === END_BYTES
    ? { tMs: payload.getUint32(0, true), dropped: payload.getUint32(4, true) }
    : null
