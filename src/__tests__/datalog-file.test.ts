import { datalogCrc16 } from '../wire/datalog-crc.js'
import { decodeDatalog, type DatalogSession } from '../wire/datalog-file.js'
import {
  DATALOG_END_VECTOR,
  DATALOG_LAP_VECTOR,
  DATALOG_PREAMBLE_VECTOR,
  DATALOG_SAMPLE_VECTOR,
} from './__fixtures__/datalog-vectors.js'

const SIGNALS = [
  { id: 0, name: 'rpm' },
  { id: 1, name: 'throttle_pos' },
  { id: 12, name: 'gear' },
]

const frame = (kind: number, payload: readonly number[]): number[] => {
  const body = [kind, payload.length & 0xff, payload.length >> 8, ...payload]
  const crc = datalogCrc16(Uint8Array.from(body))
  return [...body, crc & 0xff, crc >> 8]
}

const headerFrame = (signals: readonly { id: number; name: string }[]): number[] =>
  frame(1, [
    50,
    0,
    7,
    0,
    signals.length,
    ...signals.flatMap(({ id, name }) => [
      id,
      name.length,
      ...Array.from(name, (c) => c.charCodeAt(0)),
    ]),
  ])

const file = (...parts: readonly number[][]): Uint8Array =>
  Uint8Array.from([...DATALOG_PREAMBLE_VECTOR, ...parts.flat()])

const fullFile = (): Uint8Array =>
  file(headerFrame(SIGNALS), DATALOG_SAMPLE_VECTOR, DATALOG_LAP_VECTOR, DATALOG_END_VECTOR)

const decodedSession = (bytes: Uint8Array): DatalogSession => {
  const result = decodeDatalog(bytes)
  if (!result.ok) throw new Error(result.error)
  return result.session
}

describe('datalog-file decoding', () => {
  it('uses the CCITT-FALSE crc', () => {
    expect(datalogCrc16(new TextEncoder().encode('123456789'))).toBe(0x29b1)
  })

  it('decodes the canonical vectors shared with the firmware encoder', () => {
    expect(decodedSession(fullFile())).toEqual({
      header: { samplePeriodMs: 50, session: 7, signals: SIGNALS },
      samples: [{ tMs: 1000, values: { rpm: 3500, throttle_pos: 45.5, gear: -1 } }],
      laps: [{ tMs: 61000, index: 1, lapMs: 60500 }],
      end: { tMs: 62000, dropped: 3 },
      truncated: false,
    })
  })
})

describe('datalog-file recovery', () => {
  it('keeps every whole record before a torn tail', () => {
    const torn = fullFile().subarray(0, fullFile().length - 1)
    const session = decodedSession(torn)
    expect(session.truncated).toBe(true)
    expect(session.laps).toHaveLength(1)
    expect(session.end).toBeNull()
  })

  it('stops at a record whose crc does not hold', () => {
    const corrupt = file(headerFrame(SIGNALS), DATALOG_SAMPLE_VECTOR, DATALOG_LAP_VECTOR)
    corrupt[corrupt.length - 1] = (corrupt.at(-1) ?? 0) ^ 0xff
    const session = decodedSession(corrupt)
    expect(session.truncated).toBe(true)
    expect(session.samples).toHaveLength(1)
    expect(session.laps).toEqual([])
  })

  it('skips a record kind it does not know', () => {
    const session = decodedSession(file(headerFrame(SIGNALS), frame(9, [1, 2]), DATALOG_LAP_VECTOR))
    expect(session.truncated).toBe(false)
    expect(session.laps).toHaveLength(1)
  })

  it('drops a value whose slot the header does not name', () => {
    const session = decodedSession(file(headerFrame(SIGNALS.slice(0, 1)), DATALOG_SAMPLE_VECTOR))
    expect(session.samples[0]?.values).toEqual({ rpm: 3500 })
  })
})

describe('datalog-file refusals', () => {
  it.each([
    ['an empty buffer', new Uint8Array(0), 'not_a_datalog'],
    ['a foreign file', Uint8Array.from([0x50, 0x4b, 0x03, 0x04, 0x01]), 'not_a_datalog'],
    ['a newer format', Uint8Array.from([0x43, 0x53, 0x4c, 0x47, 0x02]), 'unsupported_version'],
    ['a file without a header', file(DATALOG_SAMPLE_VECTOR), 'missing_header'],
    ['a preamble alone', file(), 'missing_header'],
  ])('refuses %s', (_name, bytes, error) => {
    expect(decodeDatalog(bytes)).toEqual({ ok: false, error })
  })

  it('refuses a header whose signal table overruns it', () => {
    const header = headerFrame(SIGNALS)
    const overrun = frame(1, [...header.slice(3, -2), 0])
    expect(decodeDatalog(file(overrun))).toEqual({ ok: false, error: 'missing_header' })
  })
})
