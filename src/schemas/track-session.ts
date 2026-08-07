import { z } from 'zod'

export const TRACK_SESSION_NAME_MAX_LEN = 80

const LatSchema = z.number().min(-90).max(90)
const LngSchema = z.number().min(-180).max(180)

export const GeoPointSchema = z
  .object({
    lat: LatSchema,
    lng: LngSchema,
  })
  .strict()

export type GeoPoint = z.infer<typeof GeoPointSchema>

export const StartFinishLineSchema = z
  .object({
    a: GeoPointSchema,
    b: GeoPointSchema,
  })
  .strict()

export type StartFinishLine = z.infer<typeof StartFinishLineSchema>

export const TrackSampleSchema = z
  .object({
    t: z.number().int().nonnegative(),
    lat: LatSchema,
    lng: LngSchema,
    speedMs: z.number().nonnegative().optional(),
    headingDeg: z.number().min(0).max(360).optional(),
  })
  .strict()

export type TrackSample = z.infer<typeof TrackSampleSchema>

export const TrackSessionSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().max(TRACK_SESSION_NAME_MAX_LEN).optional(),
    startedAt: z.number().int().nonnegative(),
    startFinish: StartFinishLineSchema.optional(),
    samples: z.array(TrackSampleSchema),
  })
  .strict()

export type TrackSession = z.infer<typeof TrackSessionSchema>
