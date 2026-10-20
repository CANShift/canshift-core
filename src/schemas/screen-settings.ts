import * as z from 'zod'
import { camelToSnakeDeep, snakeToCamelDeep } from '../wire/keymap.js'
import { parseJsonObject, type WireEnvelopeFailure } from '../wire/parse-envelope.js'
import { SoundsSchema, VOLUME_MAX_PCT, VOLUME_MIN_PCT, VolumeSchema } from './sound-settings.js'

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
    volume: VolumeSchema.optional(),
    sounds: SoundsSchema.optional(),
  })
  .strict()

export type ScreenSettings = z.infer<typeof ScreenSettingsSchema>

export const SCREEN_SETTINGS_BOUNDS = {
  brightnessMinPct: BRIGHTNESS_MIN_PCT,
  brightnessMaxPct: BRIGHTNESS_MAX_PCT,
  allowedRotations: ALLOWED_ROTATIONS,
  volumeMinPct: VOLUME_MIN_PCT,
  volumeMaxPct: VOLUME_MAX_PCT,
} as const

export const screenSettingsToWire = (settings: ScreenSettings): Record<string, unknown> =>
  camelToSnakeDeep(settings)

export type ScreenSettingsResult = { kind: 'ok'; settings: ScreenSettings } | WireEnvelopeFailure

export const parseSettings = (raw: string): ScreenSettingsResult => {
  const json = parseJsonObject(raw)
  if (json.kind !== 'ok') return json
  const result = ScreenSettingsSchema.safeParse(snakeToCamelDeep(json.value))
  if (!result.success) return { kind: 'wrong_shape', issues: result.error.issues }
  return { kind: 'ok', settings: result.data }
}
