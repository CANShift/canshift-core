import { z } from 'zod'

import { DECIMAL_PLACES, STRING_CAPS } from '../../constants/firmware-caps.js'

import { SensorIconNameSchema } from './sensor-icon.js'

export const GaugeDisplayStyleSchema = z.enum(['numeric', 'arc'])

export const GaugeWidgetConfigSchema = z
  .object({
    type: z.literal('gauge'),
    big: z.number().int().min(10).max(127).optional(),
    displayStyle: GaugeDisplayStyleSchema,
    minValue: z.number(),
    maxValue: z.number(),
    dangerLevel: z.number(),
    decimalPlaces: z.number().int().min(DECIMAL_PLACES.MIN).max(DECIMAL_PLACES.MAX),
    prefix: z.string().max(STRING_CAPS.GAUGE_PREFIX).optional(),
    suffix: z.string().max(STRING_CAPS.WIDGET_PREFIX_SUFFIX).optional(),
    showBar: z.boolean().optional(),
    revFlash: z.boolean().optional(),
    alertThreshold: z.number().optional(),
    iconName: SensorIconNameSchema.optional(),
  })
  .strict()

export type GaugeDisplayStyle = z.infer<typeof GaugeDisplayStyleSchema>
