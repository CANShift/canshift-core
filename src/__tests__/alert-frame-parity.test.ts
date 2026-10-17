import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { ALERT_FRAME_VERSION } from '../wire/alert-frame.js'
import { ALERT_SOURCE_ID_COUNT, BUILT_IN_ALERT_SIGNALS } from '../wire/alert-sources.js'
import {
  CONFIGURED_AND_COOLANT_VECTOR,
  OIL_PRESSURE_VECTOR,
} from './__fixtures__/alert-frame-vectors.js'

const here = dirname(fileURLToPath(import.meta.url))
const FIRMWARE = resolve(here, '../../../canshift-firmware')
const ALERT_FRAME_HEADER = resolve(FIRMWARE, 'src/hal/ble/alert_frame.h')
const ALERT_SOURCES_HEADER = resolve(FIRMWARE, 'src/ui/alert_sources.h')
const ALERT_FRAME_TEST = resolve(FIRMWARE, 'test/test_alert_frame/test_main.cpp')

const SIGNAL_KEY_RE = /"([a-z0-9]+(?:_[a-z0-9]+)+)"/g

const readFirmware = (path: string): string => (existsSync(path) ? readFileSync(path, 'utf8') : '')

const builtInSignalKeys = (source: string): string[] => {
  const table = /kSources\[\]\s*=\s*\{([\s\S]*?)\n\};/.exec(source)?.[1] ?? ''
  return Array.from(table.matchAll(SIGNAL_KEY_RE), (match) => match[1] ?? '')
}

const extractConstant = (source: string, name: string): number | null => {
  const match = new RegExp(`constexpr\\s+\\w+\\s+${name}\\s*=\\s*(0x[0-9a-fA-F]+|\\d+)`).exec(
    source
  )
  return match ? Number(match[1]) : null
}

const normaliseHex = (source: string): string =>
  Array.from(source.matchAll(/0x([0-9a-fA-F]{2})/g), (match) =>
    (match[1] ?? '').toLowerCase()
  ).join(' ')

const hexOf = (vector: readonly number[]): string =>
  vector.map((byte) => byte.toString(16).padStart(2, '0')).join(' ')

const describeIfFirmware = existsSync(ALERT_FRAME_HEADER) ? describe : describe.skip

describeIfFirmware('alert-frame firmware parity', () => {
  const frameHeader = readFirmware(ALERT_FRAME_HEADER)

  it('speaks the same frame version', () => {
    expect(extractConstant(frameHeader, 'kVersion')).toBe(ALERT_FRAME_VERSION)
  })

  it('sizes the frame for the same source ids', () => {
    expect(extractConstant(frameHeader, 'kSourceCount')).toBe(ALERT_SOURCE_ID_COUNT)
  })

  it('orders the built-in sources the same way on both sides', () => {
    const keys = builtInSignalKeys(readFirmware(ALERT_SOURCES_HEADER))
    expect(keys).toEqual(Object.values(BUILT_IN_ALERT_SIGNALS))
  })

  it.each([
    ['oil pressure', OIL_PRESSURE_VECTOR],
    ['configured and coolant', CONFIGURED_AND_COOLANT_VECTOR],
  ])('pins the %s byte vector in the firmware encoder test', (_name, vector) => {
    expect(normaliseHex(readFirmware(ALERT_FRAME_TEST))).toContain(hexOf(vector))
  })
})
