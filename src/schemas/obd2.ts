import * as z from 'zod'

export const OBD2_MIN_INTERVAL_MS = 100

export const OBD2_MAX_INTERVAL_MS = 60000

export const OBD2_DEFAULT_INTERVAL_MS = 1000

const Obd2ModeSchema = z.literal(0x01)

const Obd2PidSchema = z.number().int().min(0).max(0xff)

export const Obd2PollingSchema = z
  .object({
    mode: Obd2ModeSchema,
    pid: Obd2PidSchema,
    intervalMs: z.number().int().min(OBD2_MIN_INTERVAL_MS).max(OBD2_MAX_INTERVAL_MS),
  })
  .strict()

export type Obd2Pid = z.infer<typeof Obd2PidSchema>
