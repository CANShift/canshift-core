import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  BOARD_PROFILES,
  BOARD_PROFILE_FORMAT_VERSION,
  BOARD_PROFILE_MAGIC,
  BOARD_PROFILE_SCHEMA,
  boardProfileFromWire,
  boardProfileToWire,
  getBoardProfile,
  parseBoardProfile,
  serializeBoardProfile,
} from '../index.js'

const FIRMWARE_BOARDS = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../../../canshift-firmware/.github/boards.json'
)

const firmwareBoards: { id: string; release?: boolean }[] = existsSync(FIRMWARE_BOARDS)
  ? (JSON.parse(readFileSync(FIRMWARE_BOARDS, 'utf8')) as { id: string; release?: boolean }[])
  : []

const releasableBoardIds: string[] | null = firmwareBoards.some((b) => 'release' in b)
  ? firmwareBoards.filter((board) => board.release).map((board) => board.id)
  : null

const crowpanel = getBoardProfile('crowpanel_28')!

describe('board-profile catalog', () => {
  it('ships every releasable board the firmware publishes, and nothing else', () => {
    if (releasableBoardIds === null) {
      expect(BOARD_PROFILES.length).toBeGreaterThan(0)
      return
    }
    expect([...BOARD_PROFILES.map((p) => p.boardId)].sort()).toEqual([...releasableBoardIds].sort())
  })

  it('looks a profile up by id and returns undefined for an unknown board', () => {
    expect(getBoardProfile('crowpanel_28')?.chipFamily).toBe('esp32')
    expect(getBoardProfile('nope')).toBeUndefined()
  })

  it('every catalog profile serializes and round-trips back to itself', () => {
    for (const profile of BOARD_PROFILES) {
      const result = parseBoardProfile(serializeBoardProfile(profile))
      expect(result.kind).toBe('ok')
      if (result.kind === 'ok') {
        expect(result.profile).toEqual(profile)
      }
    }
  })
})

describe('boardProfileFromWire / boardProfileToWire', () => {
  it('round-trips every catalog profile through the wire mapper', () => {
    for (const profile of BOARD_PROFILES) {
      expect(boardProfileFromWire(boardProfileToWire(profile))).toEqual(profile)
    }
  })

  it('emits snake_case wire keys mirroring the firmware struct', () => {
    const wire = boardProfileToWire(crowpanel)
    expect(Object.keys(wire)).toEqual([
      'board_id',
      'board_name',
      'chip_family',
      'lcd',
      'backlight',
      'touch',
      'can',
      'storage',
      'conn',
    ])
    expect(wire.lcd.pin_mosi).toBe(13)
    expect(wire.lcd.bus_shared_with_touch).toBe(true)
    expect(wire.touch.pin_sda).toBe(-1)
    expect(wire.backlight.default_duty).toBe(200)
  })
})

describe('serializeBoardProfile / parseBoardProfile', () => {
  it('produces a byte-equivalent blob after a round-trip', () => {
    const serialized = serializeBoardProfile(crowpanel)
    const result = parseBoardProfile(serialized)
    expect(result.kind).toBe('ok')
    if (result.kind === 'ok') {
      expect(serializeBoardProfile(result.profile)).toBe(serialized)
    }
  })

  it('wraps the profile in the versioned magic envelope', () => {
    const blob = JSON.parse(serializeBoardProfile(crowpanel)) as Record<string, unknown>
    expect(blob.magic).toBe(BOARD_PROFILE_MAGIC)
    expect(blob.schema).toBe(BOARD_PROFILE_SCHEMA)
    expect(blob.formatVersion).toBe(BOARD_PROFILE_FORMAT_VERSION)
  })
})

const blobWith = (
  profileMutator: (p: Record<string, unknown>) => Record<string, unknown>,
  formatVersion = BOARD_PROFILE_FORMAT_VERSION
): string => {
  const wire = boardProfileToWire(crowpanel) as unknown as Record<string, unknown>
  return JSON.stringify({
    magic: BOARD_PROFILE_MAGIC,
    schema: BOARD_PROFILE_SCHEMA,
    formatVersion,
    profile: profileMutator({ ...wire }),
  })
}

describe('parseBoardProfile rejection paths', () => {
  it('flags invalid JSON', () => {
    expect(parseBoardProfile('{not json').kind).toBe('invalid_json')
  })

  it('flags non-object payloads', () => {
    expect(parseBoardProfile('42').kind).toBe('not_an_object')
    expect(parseBoardProfile('[1,2]').kind).toBe('not_an_object')
  })

  it('tells "wrong file type" apart from "malformed file"', () => {
    const result = parseBoardProfile(JSON.stringify({ magic: 'nope', profile: {} }))
    expect(result.kind).toBe('not_a_board_profile')
    if (result.kind === 'not_a_board_profile') {
      expect(result.magic).toBe('nope')
    }
  })

  it('rejects a newer blob format version', () => {
    const result = parseBoardProfile(blobWith((p) => p, BOARD_PROFILE_FORMAT_VERSION + 1))
    expect(result.kind).toBe('unsupported_blob_version')
    if (result.kind === 'unsupported_blob_version') {
      expect(result.blobVersion).toBe(BOARD_PROFILE_FORMAT_VERSION + 1)
      expect(result.supported).toBe(BOARD_PROFILE_FORMAT_VERSION)
    }
  })

  it('rejects a profile with an out-of-range pin', () => {
    const result = parseBoardProfile(
      blobWith((p) => ({ ...p, lcd: { ...(p.lcd as object), pin_mosi: 9999 } }))
    )
    expect(result.kind).toBe('wrong_shape')
  })

  it('rejects a profile with an unknown display driver', () => {
    const result = parseBoardProfile(
      blobWith((p) => ({ ...p, lcd: { ...(p.lcd as object), driver: 'ssd1306' } }))
    )
    expect(result.kind).toBe('wrong_shape')
  })

  it('rejects an unknown extra key in the profile (strict)', () => {
    const result = parseBoardProfile(blobWith((p) => ({ ...p, rogue: 1 })))
    expect(result.kind).toBe('wrong_shape')
  })
})

describe('parseBoardProfile prototype-pollution hardening', () => {
  it('strips a __proto__ key without polluting Object.prototype', () => {
    const raw = serializeBoardProfile(crowpanel).replace(
      '"magic"',
      '"__proto__":{"polluted":true},"magic"'
    )
    const result = parseBoardProfile(raw)
    expect(result.kind).toBe('ok')
    expect(({} as Record<string, unknown>).polluted).toBeUndefined()
  })
})
