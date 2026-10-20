import * as z from 'zod'

export const VOLUME_MIN_PCT = 0
export const VOLUME_MAX_PCT = 100

export const VolumeSchema = z
  .number()
  .int('volume must be a whole percent')
  .min(VOLUME_MIN_PCT, `volume cannot be below ${String(VOLUME_MIN_PCT)}%`)
  .max(VOLUME_MAX_PCT, `volume cannot exceed ${String(VOLUME_MAX_PCT)}%`)

export const SoundsSchema = z
  .object({
    boot: z.boolean().optional(),
    shiftTone: z.boolean().optional(),
  })
  .strict()

export const SoundsWireSchema = z
  .object({
    boot: z.boolean(),
    shift_tone: z.boolean(),
  })
  .strict()

export type SoundsWire = z.infer<typeof SoundsWireSchema>

export interface SoundSettings {
  volume: number
  boot: boolean
  shiftTone: boolean
}

export const soundSettingsFromWire = (volume: number, sounds: SoundsWire): SoundSettings => ({
  volume,
  boot: sounds.boot,
  shiftTone: sounds.shift_tone,
})
