import { existsSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { CAN_MONITOR_FILTER_VERSION, CAN_MONITOR_MAX_FILTERS } from '../wire/can-monitor-filter.js'
import {
  CAN_MONITOR_FRAME_VERSION,
  CAN_MONITOR_MAX_DATA_BYTES,
  CAN_MONITOR_MAX_FRAME_BYTES,
} from '../wire/can-monitor-frame.js'
import { CAN_MONITOR_EXTENDED_ID } from '../wire/can-monitor-id.js'
import {
  EXTENDED_EXACT_FILTER_VECTOR,
  FILTERED_EXTENDED_ID_VECTOR,
  STANDARD_PREFIX_FILTER_VECTOR,
  TWO_STANDARD_IDS_VECTOR,
} from './__fixtures__/can-monitor-vectors.js'
import { firmwarePath, readFirmwareSource } from './firmware-source.js'

const CRATE = firmwarePath('rust/can-monitor/src')
const VECTORS = `${CRATE}/vectors.rs`

const rustConstant = (file: string, name: string): number | null => {
  const match = new RegExp(`pub const ${name}: \\w+ = (0x[0-9a-fA-F_]+|[\\d_]+);`).exec(
    readFirmwareSource(`${CRATE}/${file}`)
  )
  return match ? Number((match[1] ?? '').replaceAll('_', '')) : null
}

const normaliseHex = (source: string): string =>
  Array.from(source.matchAll(/0x([0-9a-fA-F]{2})\b/g), (match) =>
    (match[1] ?? '').toLowerCase()
  ).join(' ')

const hexOf = (vector: readonly number[]): string =>
  vector.map((byte) => byte.toString(16).padStart(2, '0')).join(' ')

const describeIfFirmware = existsSync(firmwarePath('platformio.ini')) ? describe : describe.skip

describeIfFirmware('can monitor firmware parity', () => {
  it.each([
    ['frame.rs', 'CAN_MONITOR_FRAME_VERSION', CAN_MONITOR_FRAME_VERSION],
    ['frame.rs', 'CAN_MONITOR_MAX_FRAME_BYTES', CAN_MONITOR_MAX_FRAME_BYTES],
    ['table.rs', 'CAN_MONITOR_MAX_DATA_BYTES', CAN_MONITOR_MAX_DATA_BYTES],
    ['table.rs', 'CAN_MONITOR_EXTENDED_ID', CAN_MONITOR_EXTENDED_ID],
    ['filter.rs', 'CAN_MONITOR_FILTER_VERSION', CAN_MONITOR_FILTER_VERSION],
    ['filter.rs', 'CAN_MONITOR_MAX_FILTERS', CAN_MONITOR_MAX_FILTERS],
  ])('agrees with %s on %s', (file, name, expected) => {
    expect(rustConstant(file, name)).toBe(expected)
  })

  it.each([
    ['two standard ids', TWO_STANDARD_IDS_VECTOR],
    ['filtered extended id', FILTERED_EXTENDED_ID_VECTOR],
    ['extended exact filter', EXTENDED_EXACT_FILTER_VECTOR],
    ['standard prefix filter', STANDARD_PREFIX_FILTER_VECTOR],
  ])('pins the %s byte vector in the firmware tests', (_name, vector) => {
    expect(normaliseHex(readFirmwareSource(VECTORS))).toContain(hexOf(vector))
  })
})
