import * as z from 'zod'
import { FIRMWARE_CAPS, STRING_CAPS } from '../constants/firmware-caps.js'
import { parseJsonObject, type WireEnvelopeFailure } from '../wire/parse-envelope.js'

export const BlePageIdSchema = z.string().min(1).max(STRING_CAPS.ID)

export const BlePagesWireSchema = z
  .object({
    pages: z.array(BlePageIdSchema).max(FIRMWARE_CAPS.MAX_PAGES),
  })
  .loose()

export type BlePagesResult = { kind: 'ok'; pages: string[] } | WireEnvelopeFailure

export const parseBlePages = (raw: string): BlePagesResult => {
  const json = parseJsonObject(raw)
  if (json.kind !== 'ok') return json
  const result = BlePagesWireSchema.safeParse(json.value)
  if (!result.success) return { kind: 'wrong_shape', issues: result.error.issues }
  return { kind: 'ok', pages: result.data.pages }
}
