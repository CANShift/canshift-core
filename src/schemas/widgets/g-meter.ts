import * as z from 'zod'

import { STRING_CAPS } from '../../constants/firmware-caps.js'
import { G_METER_RANGE_G } from '../../widget-metrics/g-meter.js'

export const GMeterWidgetConfigSchema = z
  .object({
    type: z.literal('g_meter'),
    rangeG: z.number().min(G_METER_RANGE_G.min).max(G_METER_RANGE_G.max),
    peakHold: z.boolean().optional(),
    kicker: z.string().max(STRING_CAPS.WIDGET_LABEL).optional(),
  })
  .strict()
