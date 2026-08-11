import { z } from 'zod'

import { STRING_CAPS } from '../../constants/firmware-caps.js'
import { WidgetLayoutSchema, WidgetStyleSchema } from '../common.js'
import type { ExactOptional } from '../exact-optional.js'

import {
  CycleButtonConfigSchema,
  CycleButtonStateSchema,
  SingleActionButtonConfigSchema,
} from './button.js'
import { GaugeWidgetConfigSchema } from './gauge.js'
import { GearWidgetConfigSchema } from './gear.js'
import { ImageWidgetConfigSchema } from './image.js'
import { ShiftLightWidgetConfigSchema } from './shift-light.js'
import { TimerWidgetConfigSchema } from './timer.js'
import { WarningWidgetConfigSchema } from './warning.js'

export const WidgetConfigSchema = z.union([
  GaugeWidgetConfigSchema,
  WarningWidgetConfigSchema,
  SingleActionButtonConfigSchema,
  CycleButtonConfigSchema,
  TimerWidgetConfigSchema,
  GearWidgetConfigSchema,
  ImageWidgetConfigSchema,
  ShiftLightWidgetConfigSchema,
])

export const WIDGET_TYPES = [
  'gauge',
  'warning',
  'button',
  'timer',
  'gear',
  'image',
  'shift_light',
] as const
export const WidgetTypeSchema = z.enum(WIDGET_TYPES)

const SIGNAL_CONSUMING_WIDGET_TYPES = new Set(['gauge', 'warning', 'gear', 'shift_light'])

export const WidgetSchema = z
  .object({
    id: z.string().min(1, 'widget id must be a non-empty string'),
    type: WidgetTypeSchema,
    signal: z.string().max(STRING_CAPS.SIGNAL_NAME),
    layout: WidgetLayoutSchema,
    style: WidgetStyleSchema,
    config: WidgetConfigSchema,
  })
  .strict()
  .superRefine((w, ctx) => {
    if (w.type !== w.config.type) {
      ctx.addIssue({
        code: 'custom' as const,
        message: `widget type '${w.type}' does not match config type '${w.config.type}'`,
        path: ['config', 'type'],
      })
    }
    if (SIGNAL_CONSUMING_WIDGET_TYPES.has(w.type) && w.signal.length === 0) {
      ctx.addIssue({
        code: 'custom' as const,
        message: `signal must be a non-empty string for ${w.type} widgets`,
        path: ['signal'],
      })
    }
    const cfg = w.config
    if (cfg.type === 'gauge') {
      if (cfg.minValue >= cfg.maxValue) {
        ctx.addIssue({
          code: 'custom' as const,
          message: 'gauge: minValue must be less than maxValue',
          path: ['config', 'maxValue'],
        })
      }
      if (cfg.dangerLevel < cfg.minValue || cfg.dangerLevel > cfg.maxValue) {
        ctx.addIssue({
          code: 'custom' as const,
          message: 'gauge: dangerLevel must be in [minValue, maxValue]',
          path: ['config', 'dangerLevel'],
        })
      }
    }
    if (cfg.type === 'button' && cfg.mode === 'cycle') {
      if (cfg.initialActiveIndex >= cfg.states.length) {
        ctx.addIssue({
          code: 'custom' as const,
          message: `initialActiveIndex (${String(cfg.initialActiveIndex)}) must be less than states.length (${String(cfg.states.length)})`,
          path: ['config', 'initialActiveIndex'],
        })
      }
    }
  })

export type WidgetType = z.infer<typeof WidgetTypeSchema>

export type GaugeWidgetConfig = ExactOptional<z.infer<typeof GaugeWidgetConfigSchema>>
export type WarningWidgetConfig = ExactOptional<z.infer<typeof WarningWidgetConfigSchema>>
export type SingleActionButtonConfig = ExactOptional<z.infer<typeof SingleActionButtonConfigSchema>>
export type CycleButtonConfig = ExactOptional<z.infer<typeof CycleButtonConfigSchema>>
export type ButtonWidgetConfig = SingleActionButtonConfig | CycleButtonConfig
export type CycleButtonState = ExactOptional<z.infer<typeof CycleButtonStateSchema>>
export type TimerWidgetConfig = ExactOptional<z.infer<typeof TimerWidgetConfigSchema>>
export type GearWidgetConfig = ExactOptional<z.infer<typeof GearWidgetConfigSchema>>
export type ImageWidgetConfig = ExactOptional<z.infer<typeof ImageWidgetConfigSchema>>
export type ShiftLightWidgetConfig = ExactOptional<z.infer<typeof ShiftLightWidgetConfigSchema>>

export type WidgetConfig =
  | GaugeWidgetConfig
  | WarningWidgetConfig
  | ButtonWidgetConfig
  | TimerWidgetConfig
  | GearWidgetConfig
  | ImageWidgetConfig
  | ShiftLightWidgetConfig

export type Widget = Omit<ExactOptional<z.infer<typeof WidgetSchema>>, 'config'> & {
  config: WidgetConfig
}
