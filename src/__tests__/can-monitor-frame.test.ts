import { describe, expect, it } from 'vitest'
import {
  CAN_MONITOR_MAX_FRAME_BYTES,
  decodeCanMonitorFrame,
  encodeCanMonitorFrame,
  type CanMonitorEntry,
  type CanMonitorFrame,
} from '../wire/can-monitor-frame.js'
import {
  FILTERED_EXTENDED_ID_FRAME,
  FILTERED_EXTENDED_ID_VECTOR,
  TWO_STANDARD_IDS_FRAME,
  TWO_STANDARD_IDS_VECTOR,
} from './__fixtures__/can-monitor-vectors.js'

const bytesOf = (vector: readonly number[]): Uint8Array => Uint8Array.from(vector)

const withByte = (vector: readonly number[], index: number, value: number): Uint8Array => {
  const bytes = bytesOf(vector)
  bytes[index] = value
  return bytes
}

const fullEntry = (id: number): CanMonitorEntry => ({
  id,
  extended: false,
  data: [0, 0, 0, 0, 0, 0, 0, 0],
  count: 1,
  ageMs: 0,
})

const frameOf = (entries: CanMonitorEntry[]): CanMonitorFrame => ({
  deviceMs: 0,
  overflow: false,
  filtered: false,
  entries,
})

describe('can monitor frame decoding', () => {
  it.each([
    ['two standard ids', TWO_STANDARD_IDS_FRAME, TWO_STANDARD_IDS_VECTOR],
    ['a filtered extended id', FILTERED_EXTENDED_ID_FRAME, FILTERED_EXTENDED_ID_VECTOR],
  ])('encodes and decodes %s against the pinned vector', (_name, frame, vector) => {
    expect(Array.from(encodeCanMonitorFrame(frame) ?? [])).toEqual(vector)
    expect(decodeCanMonitorFrame(bytesOf(vector))).toEqual(frame)
  })

  it('reads the overflow flag', () => {
    const frame = decodeCanMonitorFrame(withByte(TWO_STANDARD_IDS_VECTOR, 2, 0x01))
    expect(frame?.overflow).toBe(true)
  })

  it('decodes a view into a larger buffer', () => {
    const padded = new Uint8Array([0xaa, ...TWO_STANDARD_IDS_VECTOR])
    expect(decodeCanMonitorFrame(padded.subarray(1))).toEqual(TWO_STANDARD_IDS_FRAME)
  })
})

describe('can monitor frame rejection', () => {
  it.each([
    ['an unknown version', withByte(TWO_STANDARD_IDS_VECTOR, 0, 0x02)],
    ['an empty frame', bytesOf([0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00])],
    ['reserved flag bits', withByte(TWO_STANDARD_IDS_VECTOR, 2, 0x04)],
    ['a reserved header byte', withByte(TWO_STANDARD_IDS_VECTOR, 3, 0x01)],
    ['a dlc past eight', withByte(FILTERED_EXTENDED_ID_VECTOR, 12, 0x09)],
    ['reserved id bits', withByte(FILTERED_EXTENDED_ID_VECTOR, 11, 0xd8)],
    ['a standard id past 11 bits', withByte(TWO_STANDARD_IDS_VECTOR, 9, 0x08)],
    ['a truncated entry', bytesOf(TWO_STANDARD_IDS_VECTOR.slice(0, -1))],
    ['trailing bytes', bytesOf([...TWO_STANDARD_IDS_VECTOR, 0x00])],
    ['a short header', bytesOf([0x01, 0x01])],
  ])('rejects %s', (_name, bytes) => {
    expect(decodeCanMonitorFrame(bytes)).toBeNull()
  })
})

describe('can monitor frame encoding', () => {
  it('saturates count and age at the u16 range', () => {
    const entry = { ...fullEntry(0x100), count: 70_000, ageMs: 90_000 }
    const decoded = decodeCanMonitorFrame(encodeCanMonitorFrame(frameOf([entry])) ?? bytesOf([]))
    expect(decoded?.entries[0]).toMatchObject({ count: 0xffff, ageMs: 0xffff })
  })

  it.each([
    ['no entries', frameOf([])],
    ['a standard id past 11 bits', frameOf([fullEntry(0x800)])],
    ['more than eight data bytes', frameOf([{ ...fullEntry(1), data: new Array(9).fill(0) }])],
    ['a non-byte data value', frameOf([{ ...fullEntry(1), data: [256] }])],
    ['a negative device time', { ...frameOf([fullEntry(1)]), deviceMs: -1 }],
  ])('refuses to encode %s', (_name, frame) => {
    expect(encodeCanMonitorFrame(frame)).toBeNull()
  })

  it('refuses a frame past the notify payload', () => {
    const fits = Math.floor((CAN_MONITOR_MAX_FRAME_BYTES - 8) / 17)
    const entries = Array.from({ length: fits + 1 }, (_, index) => fullEntry(index))
    expect(encodeCanMonitorFrame(frameOf(entries.slice(0, fits)))).not.toBeNull()
    expect(encodeCanMonitorFrame(frameOf(entries))).toBeNull()
  })
})
