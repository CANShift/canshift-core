import * as z from 'zod'

import { FIRMWARE_CAPS, STRING_CAPS } from '../constants/firmware-caps.js'

export const CRITICAL_ALERT_DIRECTIONS = ['above', 'below'] as const
export const CriticalAlertDirectionSchema = z.enum(CRITICAL_ALERT_DIRECTIONS)

export const ACKNOWLEDGE_TARGETS = ['dash'] as const
export const AcknowledgeTargetSchema = z.enum(ACKNOWLEDGE_TARGETS)

export const CriticalAlertSchema = z
  .object({
    signal: z.string().min(1, 'signal must be a non-empty string').max(STRING_CAPS.SIGNAL_NAME),
    firesAt: z.number(),
    direction: CriticalAlertDirectionSchema,
    acknowledgeOn: AcknowledgeTargetSchema,
  })
  .strict()

export const CriticalAlertsSchema = z
  .array(CriticalAlertSchema)
  .max(
    FIRMWARE_CAPS.MAX_CRITICAL_ALERTS,
    `criticalAlerts cannot exceed ${String(FIRMWARE_CAPS.MAX_CRITICAL_ALERTS)} entries (firmware cap)`
  )

export type CriticalAlertDirection = z.infer<typeof CriticalAlertDirectionSchema>
export type AcknowledgeTarget = z.infer<typeof AcknowledgeTargetSchema>
export type CriticalAlert = z.infer<typeof CriticalAlertSchema>
