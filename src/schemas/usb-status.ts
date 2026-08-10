import { z } from 'zod'
import { parseJsonObject, type WireEnvelopeFailure } from '../wire/parse-envelope.js'

export const USB_STATUS_MAX_STRING_LEN = 64

const CappedStringSchema = z.string().max(USB_STATUS_MAX_STRING_LEN)

const ZeroOrOneSchema = z.union([z.literal(0), z.literal(1)])

export const UsbStatusWireSchema = z
  .object({
    status: z.literal('ok'),
    version: CappedStringSchema,
    protocol: z.number().int().nonnegative(),
    is_day: ZeroOrOneSchema,
    board_id: CappedStringSchema.optional(),
  })
  .loose()

export type UsbStatusWire = z.infer<typeof UsbStatusWireSchema>

export interface UsbStatus {
  firmwareVersion: string
  protocolVersion: number
  isDay: boolean
  boardId?: string
}

export const usbStatusFromWire = (wire: UsbStatusWire): UsbStatus => {
  const out: UsbStatus = {
    firmwareVersion: wire.version,
    protocolVersion: wire.protocol,
    isDay: wire.is_day !== 0,
  }
  if (wire.board_id !== undefined) out.boardId = wire.board_id
  return out
}

export type UsbStatusResult = { kind: 'ok'; status: UsbStatus } | WireEnvelopeFailure

export const parseUsbStatus = (raw: string): UsbStatusResult => {
  const json = parseJsonObject(raw)
  if (json.kind !== 'ok') return json
  const result = UsbStatusWireSchema.safeParse(json.value)
  if (!result.success) return { kind: 'wrong_shape', issues: result.error.issues }
  return { kind: 'ok', status: usbStatusFromWire(result.data) }
}
