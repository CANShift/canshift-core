import { existsSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { DEVICE_COMMANDS } from '../wire/device-commands.js'
import { TELEMETRY_FIELDS } from '../wire/telemetry-frame.js'
import { TELEMETRY_FIELD_SIGNALS, TELEMETRY_KEEPALIVE_MS } from '../wire/telemetry-signals.js'
import { firmwareConstant, firmwarePath, readFirmwareSource } from './firmware-source.js'

const BLE_TELEMETRY = firmwarePath('src/hal/ble/ble_telemetry.cpp')
const SIGNAL_IDS = firmwarePath('src/can/signal_map.h')
const SIGNAL_MAP_RS = firmwarePath('rust/signal-map/src/lib.rs')
const TELEMETRY_FRAME_H = firmwarePath('src/hal/ble/telemetry_frame.h')
const APP_CONFIG = firmwarePath('include/app_config.h')
const DEVICE_COMMANDS_CPP = firmwarePath('src/runtime/device_commands.cpp')

const idsByConstant = (source: string, pattern: RegExp): Map<string, number> =>
  new Map([...source.matchAll(pattern)].map((m) => [m[1] ?? '', Number(m[2])]))

const firmwareTeleNames = (): string[] => {
  const table =
    /kBleTeleSignals\[\]\s*=\s*\{([\s\S]*?)\};/.exec(readFirmwareSource(BLE_TELEMETRY))?.[1] ?? ''
  const cppIds = idsByConstant(readFirmwareSource(SIGNAL_IDS), /SignalId\s+(k\w+)\s*=\s*(\d+);/g)
  const rust = readFirmwareSource(SIGNAL_MAP_RS)
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
    const ticks = firmwareConstant(readFirmwareSource(TELEMETRY_FRAME_H), 'kKeepaliveTicks')
    const intervalMs = firmwareConstant(readFirmwareSource(APP_CONFIG), 'kBleTeleIntervalMs')
    expect(ticks).not.toBeNull()
    expect(intervalMs).not.toBeNull()
    expect((ticks ?? 0) * (intervalMs ?? 0)).toBe(TELEMETRY_KEEPALIVE_MS)
  })

  it('names exactly the commands the firmware dispatches', () => {
    const table =
      /kCommands\[\]\s*=\s*\{([\s\S]*?)\};/.exec(readFirmwareSource(DEVICE_COMMANDS_CPP))?.[1] ?? ''
    const names = [...table.matchAll(/"([a-z_]+)"/g)].map((m) => m[1] ?? '')
    expect([...names].sort()).toEqual(Object.values(DEVICE_COMMANDS).sort())
  })
})
