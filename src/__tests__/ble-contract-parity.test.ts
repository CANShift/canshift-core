import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { DEVICE_COMMANDS } from '../wire/device-commands.js'
import { TELEMETRY_FIELDS } from '../wire/telemetry-frame.js'
import { TELEMETRY_FIELD_SIGNALS, TELEMETRY_KEEPALIVE_MS } from '../wire/telemetry-signals.js'

const here = dirname(fileURLToPath(import.meta.url))
const FIRMWARE = resolve(here, '../../../canshift-firmware')
const BLE_TELEMETRY = resolve(FIRMWARE, 'src/hal/ble/ble_telemetry.cpp')
const SIGNAL_IDS = resolve(FIRMWARE, 'src/can/signal_map.h')
const SIGNAL_MAP_RS = resolve(FIRMWARE, 'rust/signal-map/src/lib.rs')
const TELEMETRY_FRAME_H = resolve(FIRMWARE, 'src/hal/ble/telemetry_frame.h')
const APP_CONFIG = resolve(FIRMWARE, 'include/app_config.h')
const DEVICE_COMMANDS_CPP = resolve(FIRMWARE, 'src/runtime/device_commands.cpp')

const read = (path: string): string => readFileSync(path, 'utf8')

const constant = (source: string, name: string): number => {
  const match = new RegExp(`constexpr\\s+[\\w:]+\\s+${name}\\s*=\\s*(\\d+)`).exec(source)
  return Number.parseInt(match?.[1] ?? 'NaN', 10)
}

const idsByConstant = (source: string, pattern: RegExp): Map<string, number> =>
  new Map([...source.matchAll(pattern)].map((m) => [m[1] ?? '', Number(m[2])]))

const firmwareTeleNames = (): string[] => {
  const table = /kBleTeleSignals\[\]\s*=\s*\{([\s\S]*?)\};/.exec(read(BLE_TELEMETRY))?.[1] ?? ''
  const cppIds = idsByConstant(read(SIGNAL_IDS), /SignalId\s+(k\w+)\s*=\s*(\d+);/g)
  const rust = read(SIGNAL_MAP_RS)
  const rustIds = idsByConstant(rust, /pub const (\w+): SignalId = (\d+);/g)
  const nameById = new Map(
    [...rust.matchAll(/\("([a-z0-9_]+)",\s*ids::(\w+)\)/g)].map((m) => [
      rustIds.get(m[2] ?? ''),
      m[1] ?? '',
    ])
  )
  return [...table.matchAll(/SignalIds::(k\w+)/g)].map(
    (m) => nameById.get(cppIds.get(m[1] ?? '')) ?? `unknown ${m[1] ?? ''}`
  )
}

const describeIfFirmware = existsSync(BLE_TELEMETRY) ? describe : describe.skip

describeIfFirmware('BLE contract parity with the firmware', () => {
  it('sends the TELE fields in the firmware order, signal by signal', () => {
    const expected = TELEMETRY_FIELDS.map((field) => TELEMETRY_FIELD_SIGNALS[field])
    expect(firmwareTeleNames()).toEqual(expected)
  })

  it('keeps the TELE keepalive the firmware resends an unchanged frame at', () => {
    const ticks = constant(read(TELEMETRY_FRAME_H), 'kKeepaliveTicks')
    const intervalMs = constant(read(APP_CONFIG), 'kBleTeleIntervalMs')
    expect(ticks * intervalMs).toBe(TELEMETRY_KEEPALIVE_MS)
  })

  it('names exactly the commands the firmware dispatches', () => {
    const table = /kCommands\[\]\s*=\s*\{([\s\S]*?)\};/.exec(read(DEVICE_COMMANDS_CPP))?.[1] ?? ''
    const names = [...table.matchAll(/"([a-z_]+)"/g)].map((m) => m[1] ?? '')
    expect([...names].sort()).toEqual(Object.values(DEVICE_COMMANDS).sort())
  })
})
