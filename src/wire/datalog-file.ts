import { datalogCrc16 } from './datalog-crc.js'
import {
  readEnd,
  readHeader,
  readLap,
  readSample,
  type DatalogEnd,
  type DatalogHeader,
  type DatalogLap,
  type DatalogSample,
} from './datalog-records.js'

export const DATALOG_MAGIC = 'CSLG'
export const DATALOG_FORMAT_VERSION = 1

export interface DatalogSession {
  header: DatalogHeader
  samples: DatalogSample[]
  laps: DatalogLap[]
  end: DatalogEnd | null
  truncated: boolean
}

export type DatalogDecodeError = 'not_a_datalog' | 'unsupported_version' | 'missing_header'

export type DatalogDecodeResult =
  { ok: true; session: DatalogSession } | { ok: false; error: DatalogDecodeError }

interface Frame {
  kind: number
  payload: DataView
  next: number
}

interface SessionBuilder {
  session: DatalogSession
  names: ReadonlyMap<number, string>
}

type RecordReader = (builder: SessionBuilder, payload: DataView) => boolean

const PREAMBLE_BYTES = DATALOG_MAGIC.length + 1
const FRAME_PREFIX_BYTES = 3
const FRAME_CRC_BYTES = 2
const RECORD_HEADER = 1
const RECORD_SAMPLE = 2
const RECORD_LAP = 3
const RECORD_END = 4

const pushed = <T>(record: T | null, push: (record: T) => void): boolean => {
  if (record === null) return false
  push(record)
  return true
}

const RECORD_READERS: Readonly<Record<number, RecordReader>> = {
  [RECORD_SAMPLE]: ({ session, names }, payload) =>
    pushed(readSample(payload, names), (sample) => session.samples.push(sample)),
  [RECORD_LAP]: ({ session }, payload) => pushed(readLap(payload), (lap) => session.laps.push(lap)),
  [RECORD_END]: ({ session }, payload) =>
    pushed(readEnd(payload), (end) => {
      session.end = end
    }),
}

const readFrame = (bytes: Uint8Array, offset: number): Frame | null => {
  if (offset + FRAME_PREFIX_BYTES > bytes.length) return null
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  const end = offset + FRAME_PREFIX_BYTES + view.getUint16(offset + 1, true)
  if (end + FRAME_CRC_BYTES > bytes.length) return null
  if (datalogCrc16(bytes.subarray(offset, end)) !== view.getUint16(end, true)) return null
  const payloadStart = bytes.byteOffset + offset + FRAME_PREFIX_BYTES
  return {
    kind: view.getUint8(offset),
    payload: new DataView(bytes.buffer, payloadStart, end - offset - FRAME_PREFIX_BYTES),
    next: end + FRAME_CRC_BYTES,
  }
}

const preambleError = (bytes: Uint8Array): DatalogDecodeError | null => {
  if (bytes.length < PREAMBLE_BYTES) return 'not_a_datalog'
  const magic = String.fromCharCode(...bytes.subarray(0, DATALOG_MAGIC.length))
  if (magic !== DATALOG_MAGIC) return 'not_a_datalog'
  return bytes[DATALOG_MAGIC.length] === DATALOG_FORMAT_VERSION ? null : 'unsupported_version'
}

const readRecords = (builder: SessionBuilder, bytes: Uint8Array, start: number): boolean => {
  let offset = start
  while (offset < bytes.length) {
    const frame = readFrame(bytes, offset)
    if (frame === null) return false
    const reader = RECORD_READERS[frame.kind]
    if (reader !== undefined && !reader(builder, frame.payload)) return false
    offset = frame.next
  }
  return true
}

const newBuilder = (header: DatalogHeader): SessionBuilder => ({
  session: { header, samples: [], laps: [], end: null, truncated: false },
  names: new Map(header.signals.map((signal) => [signal.id, signal.name])),
})

export const decodeDatalog = (bytes: Uint8Array): DatalogDecodeResult => {
  const error = preambleError(bytes)
  if (error !== null) return { ok: false, error }
  const first = readFrame(bytes, PREAMBLE_BYTES)
  const header = first?.kind === RECORD_HEADER ? readHeader(first.payload) : null
  if (first === null || header === null) return { ok: false, error: 'missing_header' }
  const builder = newBuilder(header)
  builder.session.truncated = !readRecords(builder, bytes, first.next)
  return { ok: true, session: builder.session }
}
