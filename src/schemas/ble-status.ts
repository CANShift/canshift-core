import { z } from 'zod'
import { parseJsonObject, type WireEnvelopeFailure } from '../wire/parse-envelope.js'

export const BLE_STATUS_MAX_STRING_LEN = 32

const CappedStringSchema = z.string().max(BLE_STATUS_MAX_STRING_LEN)

const ZeroOrOneSchema = z.union([z.literal(0), z.literal(1)])

export const BleStatusWireSchema = z
  .object({
    ver: CappedStringSchema.optional(),
    board_id: CappedStringSchema.optional(),
    can: ZeroOrOneSchema.optional(),
    is_day: ZeroOrOneSchema.optional(),
  })
  .loose()

export type BleStatusWire = z.infer<typeof BleStatusWireSchema>

export interface BleStatus {
  firmwareVersion?: string
  boardId?: string
  canHealthy?: boolean
  isDay?: boolean
}

export const bleStatusFromWire = (wire: BleStatusWire): BleStatus => {
  const out: BleStatus = {}
  if (wire.ver !== undefined) out.firmwareVersion = wire.ver
  if (wire.board_id !== undefined) out.boardId = wire.board_id
  if (wire.can !== undefined) out.canHealthy = wire.can !== 0
  if (wire.is_day !== undefined) out.isDay = wire.is_day !== 0
  return out
}

export type BleStatusResult = { kind: 'ok'; status: BleStatus } | WireEnvelopeFailure

export const parseBleStatus = (raw: string): BleStatusResult => {
  const json = parseJsonObject(raw)
  if (json.kind !== 'ok') return json
  const result = BleStatusWireSchema.safeParse(json.value)
  if (!result.success) return { kind: 'wrong_shape', issues: result.error.issues }
  return { kind: 'ok', status: bleStatusFromWire(result.data) }
}
