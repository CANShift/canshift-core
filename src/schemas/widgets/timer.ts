import { z } from 'zod'

export const TimerWidgetConfigSchema = z
  .object({
    type: z.literal('timer'),
    big: z.number().int().min(10).max(127).optional(),
    autoStart: z.boolean().optional(),
    format: z.enum(['mm:ss', 'ss.mmm']).optional(),
  })
  .strict()
