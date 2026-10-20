import { existsSync } from 'node:fs'
import { DATALOG_SIGNAL_SLOTS } from '../wire/datalog-records.js'
import {
  DATALOG_END_VECTOR,
  DATALOG_LAP_VECTOR,
  DATALOG_PREAMBLE_VECTOR,
  DATALOG_SAMPLE_VECTOR,
} from './__fixtures__/datalog-vectors.js'
import { firmwareConstant, firmwarePath, readFirmwareSource } from './firmware-source.js'

const DATALOG_HEADER = firmwarePath('include/datalog_rs.h')
const DATALOG_TEST = firmwarePath('test/test_datalog_frame/test_main.cpp')

const normaliseHex = (source: string): string =>
  Array.from(source.matchAll(/0x([0-9a-fA-F]{2})/g), (match) =>
    (match[1] ?? '').toLowerCase()
  ).join(' ')

const hexOf = (vector: readonly number[]): string =>
  vector.map((byte) => byte.toString(16).padStart(2, '0')).join(' ')

const describeIfFirmware = existsSync(DATALOG_TEST) ? describe : describe.skip

describeIfFirmware('datalog firmware parity', () => {
  it('sizes a sample for the same signal slots', () => {
    const header = readFirmwareSource(DATALOG_HEADER)
    expect(firmwareConstant(header, 'kDatalogSignalSlots')).toBe(DATALOG_SIGNAL_SLOTS)
    expect(firmwareConstant(header, 'kDatalogPreambleBytes')).toBe(DATALOG_PREAMBLE_VECTOR.length)
  })

  it.each([
    ['sample', DATALOG_SAMPLE_VECTOR],
    ['lap', DATALOG_LAP_VECTOR],
    ['end', DATALOG_END_VECTOR],
  ])('pins the %s byte vector in the firmware encoder test', (_name, vector) => {
    expect(normaliseHex(readFirmwareSource(DATALOG_TEST))).toContain(hexOf(vector))
  })
})
