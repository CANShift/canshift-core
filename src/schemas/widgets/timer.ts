import { z } from 'zod'

export const TIMER_SOURCES = ['elapsed', 'lap', 'best', 'last', 'lapCount', 'delta'] as const

export const TimerSourceSchema = z.enum(TIMER_SOURCES)

export type TimerSource = z.infer<typeof TimerSourceSchema>

export const TimerWidgetConfigSchema = z
  .object({
    type: z.literal('timer'),
    big: z.number().int().min(10).max(127).optional(),
    autoStart: z.boolean().optional(),
    format: z.enum(['mm:ss', 'ss.mmm']).optional(),
    source: TimerSourceSchema.optional(),
  })
  .strict()
