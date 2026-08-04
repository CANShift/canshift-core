import { z } from 'zod'

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
  .passthrough()

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

export type UsbStatusResult =
  | { kind: 'ok'; status: UsbStatus }
  | { kind: 'invalid_json'; raw: string }
  | { kind: 'not_an_object'; payload: unknown }
  | { kind: 'wrong_shape'; issues: z.ZodIssue[] }

export const parseUsbStatus = (raw: string): UsbStatusResult => {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return { kind: 'invalid_json', raw }
  }
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return { kind: 'not_an_object', payload: parsed }
  }
  const result = UsbStatusWireSchema.safeParse(parsed)
  if (!result.success) {
    return { kind: 'wrong_shape', issues: result.error.issues }
  }
  return { kind: 'ok', status: usbStatusFromWire(result.data) }
}
