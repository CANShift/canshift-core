import { z } from 'zod'

import { isForbiddenKey } from '../wire/keymap.js'

import {
  BoardProfileWireSchema,
  boardProfileFromWire,
  boardProfileToWire,
  type BoardProfile,
} from './board-profile.js'

export const BOARD_PROFILE_MAGIC = 'CANSHIFT_BOARD'
export const BOARD_PROFILE_SCHEMA = 'board-profile'
export const BOARD_PROFILE_FORMAT_VERSION = 1

const BoardProfileBlobSchema = z
  .object({
    magic: z.literal(BOARD_PROFILE_MAGIC),
    schema: z.literal(BOARD_PROFILE_SCHEMA),
    formatVersion: z.number().int().positive(),
    profile: BoardProfileWireSchema,
  })
  .strict()

export interface BoardProfileBlob {
  magic: typeof BOARD_PROFILE_MAGIC
  schema: typeof BOARD_PROFILE_SCHEMA
  formatVersion: number
  profile: z.infer<typeof BoardProfileWireSchema>
}

export type BoardProfileResult =
  | { kind: 'ok'; profile: BoardProfile }
  | { kind: 'invalid_json'; raw: string }
  | { kind: 'not_an_object'; payload: unknown }
  | { kind: 'unsupported_blob_version'; blobVersion: number; supported: number }
  | { kind: 'wrong_shape'; issues: z.ZodIssue[] }

const asPlainObject = (value: unknown): Record<string, unknown> | null =>
  typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null

const stripForbiddenKeys = (key: string, value: unknown): unknown =>
  isForbiddenKey(key) ? undefined : value

const badMagicIssue: z.ZodIssue[] = [
  {
    code: z.ZodIssueCode.custom,
    path: ['magic'],
    message: `not a CANShift board profile blob (expected magic "${BOARD_PROFILE_MAGIC}")`,
  },
]

export const serializeBoardProfile = (profile: BoardProfile): string => {
  const validated = BoardProfileWireSchema.parse(boardProfileToWire(profile))
  const blob: BoardProfileBlob = {
    magic: BOARD_PROFILE_MAGIC,
    schema: BOARD_PROFILE_SCHEMA,
    formatVersion: BOARD_PROFILE_FORMAT_VERSION,
    profile: validated,
  }
  return JSON.stringify(blob, null, 2)
}

export const parseBoardProfile = (raw: string): BoardProfileResult => {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw, stripForbiddenKeys)
  } catch {
    return { kind: 'invalid_json', raw }
  }

  const record = asPlainObject(parsed)
  if (record === null) {
    return { kind: 'not_an_object', payload: parsed }
  }
  if (record.magic !== BOARD_PROFILE_MAGIC) {
    return { kind: 'wrong_shape', issues: badMagicIssue }
  }
  if (
    typeof record.formatVersion === 'number' &&
    record.formatVersion > BOARD_PROFILE_FORMAT_VERSION
  ) {
    return {
      kind: 'unsupported_blob_version',
      blobVersion: record.formatVersion,
      supported: BOARD_PROFILE_FORMAT_VERSION,
    }
  }

  const blob = BoardProfileBlobSchema.safeParse(parsed)
  if (!blob.success) {
    return { kind: 'wrong_shape', issues: blob.error.issues }
  }
  return { kind: 'ok', profile: boardProfileFromWire(blob.data.profile) }
}
