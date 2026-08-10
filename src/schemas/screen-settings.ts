import { z } from 'zod'

const BRIGHTNESS_MIN_PCT = 10
const BRIGHTNESS_MAX_PCT = 100

const ALLOWED_ROTATIONS = [0, 180] as const

const BrightnessSchema = z
  .number()
  .int('brightness must be a whole percent')
  .min(BRIGHTNESS_MIN_PCT, `brightness cannot be below ${String(BRIGHTNESS_MIN_PCT)}%`)
  .max(BRIGHTNESS_MAX_PCT, `brightness cannot exceed ${String(BRIGHTNESS_MAX_PCT)}%`)

const RotationSchema = z.union([z.literal(0), z.literal(180)])

export const ScreenSettingsSchema = z
  .object({
    brightness: BrightnessSchema,
    rotation: RotationSchema.optional(),
  })
  .strict()

export type ScreenSettings = z.infer<typeof ScreenSettingsSchema>

export const SCREEN_SETTINGS_BOUNDS = {
  brightnessMinPct: BRIGHTNESS_MIN_PCT,
  brightnessMaxPct: BRIGHTNESS_MAX_PCT,
  allowedRotations: ALLOWED_ROTATIONS,
} as const

export type ScreenSettingsResult =
  | { kind: 'ok'; settings: ScreenSettings }
  | { kind: 'invalid_json'; raw: string }
  | { kind: 'not_an_object'; payload: unknown }
  | { kind: 'wrong_shape'; issues: z.core.$ZodIssue[] }

export const parseSettings = (raw: string): ScreenSettingsResult => {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return { kind: 'invalid_json', raw }
  }
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return { kind: 'not_an_object', payload: parsed }
  }
  const result = ScreenSettingsSchema.safeParse(parsed)
  if (!result.success) {
    return { kind: 'wrong_shape', issues: result.error.issues }
  }
  return { kind: 'ok', settings: result.data }
}
