import { z } from 'zod'

import { stripForbiddenKeys } from '../wire/plain-object.js'
import { isIntegerFormatVersion, parseJsonObject } from '../wire/parse-envelope.js'

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
  | { kind: 'wrong_shape'; issues: z.core.$ZodIssue[] }
  | { kind: 'not_a_board_profile'; magic: unknown }

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
  const json = parseJsonObject(raw, stripForbiddenKeys)
  if (json.kind !== 'ok') return json
  const parsed = json.value
  const record = parsed as Record<string, unknown>

  if (record.magic !== BOARD_PROFILE_MAGIC) {
    return { kind: 'not_a_board_profile', magic: record.magic }
  }
  if (
    isIntegerFormatVersion(record.formatVersion) &&
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
