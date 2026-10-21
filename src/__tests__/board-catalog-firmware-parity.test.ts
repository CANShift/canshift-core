import { existsSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

import { BOARD_PROFILES, boardProfileToWire } from '../board-profile/index.js'

import { firmwarePath, readFirmwareSource } from './firmware-source.js'

type WireValue = string | number | boolean
type WireSection = Record<string, WireValue>
type WireProfile = Record<string, WireValue | WireSection>

const SECTION_OPEN = /^\s*\.(\w+) =\s*$/
const FIELD = /^\s*\.(\w+) = (.+),$/
const SECTION_CLOSE = /^\s*},$/
const ABSENT_SECTION = /^kNo[A-Z]/

const ENUM_SLUGS: Record<string, string> = {
  PosX: 'x',
  NegX: '-x',
  PosY: 'y',
  NegY: '-y',
  PosZ: 'z',
  NegZ: '-z',
  EspTwai: 'esp_twai',
  Esp32s3: 'esp32s3',
  Sdmmc1Bit: 'sdmmc_1bit',
}

const enumSlug = (name: string): string => ENUM_SLUGS[name] ?? name.toLowerCase()

const parseValue = (raw: string): WireValue => {
  if (raw.startsWith('"')) return raw.slice(1, -1).replaceAll('\\"', '"')
  if (raw === 'true' || raw === 'false') return raw === 'true'
  if (raw.includes('::')) return enumSlug(raw.split('::')[1] ?? raw)
  return Number(raw.replace(/[uUlL]+$/, ''))
}

interface ParseState {
  profile: WireProfile
  section: WireSection | null
}

const readLine = (state: ParseState, line: string): void => {
  const open = SECTION_OPEN.exec(line)
  if (open?.[1] !== undefined) {
    state.section = {}
    state.profile[open[1]] = state.section
    return
  }
  if (SECTION_CLOSE.test(line)) {
    state.section = null
    return
  }
  const field = FIELD.exec(line)
  if (field?.[1] === undefined || field[2] === undefined || ABSENT_SECTION.test(field[2])) return
  const target = state.section ?? state.profile
  target[field[1]] = parseValue(field[2])
}

const parseFirmwareBoard = (source: string): WireProfile => {
  const state: ParseState = { profile: {}, section: null }
  for (const line of source.split('\n')) readLine(state, line)
  return state.profile
}

const headerFor = (boardId: string): string => firmwarePath(`include/boards/${boardId}.h`)

const firmwarePresent = BOARD_PROFILES.every((profile) => existsSync(headerFor(profile.boardId)))
const describeIfFirmware = firmwarePresent ? describe : describe.skip

describeIfFirmware('board catalog firmware parity', () => {
  it.each(BOARD_PROFILES.map((profile) => profile.boardId))(
    '%s matches its firmware board header field for field',
    (boardId) => {
      const profile = BOARD_PROFILES.find((candidate) => candidate.boardId === boardId)!
      const firmware = parseFirmwareBoard(readFirmwareSource(headerFor(boardId)))
      expect(boardProfileToWire(profile)).toEqual(firmware)
    }
  )
})

describe('firmware board header parser', () => {
  it('reads scalar fields, sections, enums and the absent-section markers', () => {
    const source = [
      '    .board_id = "demo",',
      '    .audio = kNoAudio,',
      '    .chip_family = ChipFamily::Esp32s3,',
      '    .imu = kNoImu,',
      '    .can =',
      '        {',
      '            .controller = CanController::EspTwai,',
      '            .pin_tx = -1,',
      '            .default_speed_kbps = 500,',
      '            .freq_hz = 400000UL,',
      '            .present = true,',
      '        },',
    ].join('\n')
    expect(parseFirmwareBoard(source)).toEqual({
      board_id: 'demo',
      chip_family: 'esp32s3',
      can: {
        controller: 'esp_twai',
        pin_tx: -1,
        default_speed_kbps: 500,
        freq_hz: 400000,
        present: true,
      },
    })
  })
})

describe('firmware board header parser — sections', () => {
  it('reads hex addresses and signed axes', () => {
    const source = [
      '    .imu =',
      '        {',
      '            .i2c_addr = 0x6B,',
      '            .screen_x = ImuAxis::NegY,',
      '        },',
    ].join('\n')
    expect(parseFirmwareBoard(source)).toEqual({ imu: { i2c_addr: 0x6b, screen_x: '-y' } })
  })

  it('reads the audio section', () => {
    const source = [
      '    .audio =',
      '        {',
      '            .present = true,',
      '            .pin_bck = 48,',
      '        },',
    ].join('\n')
    expect(parseFirmwareBoard(source)).toEqual({ audio: { present: true, pin_bck: 48 } })
  })
})
