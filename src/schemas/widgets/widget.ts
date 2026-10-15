import * as z from 'zod'

import { STRING_CAPS } from '../../constants/firmware-caps.js'
import { WidgetLayoutSchema, WidgetStyleSchema } from '../common.js'
import type { ExactOptional } from '../exact-optional.js'
import { warnSitsBeforeDanger } from '../../widget-metrics/gauge-severity.js'

import {
  ButtonWidgetConfigSchema,
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

export const WidgetConfigSchema = z.discriminatedUnion('type', [
  GaugeWidgetConfigSchema,
  WarningWidgetConfigSchema,
  ButtonWidgetConfigSchema,
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

type GaugeConfig = z.infer<typeof GaugeWidgetConfigSchema>
type CycleConfig = z.infer<typeof CycleButtonConfigSchema>

const addConfigIssue = (ctx: z.RefinementCtx, field: string, message: string): void => {
  ctx.addIssue({ code: 'custom' as const, message, path: ['config', field] })
}

const refineGaugeWarnLevel = (cfg: GaugeConfig, ctx: z.RefinementCtx): void => {
  if (cfg.warnLevel === undefined) return
  if (cfg.warnLevel < cfg.minValue || cfg.warnLevel > cfg.maxValue) {
    addConfigIssue(ctx, 'warnLevel', 'gauge: warnLevel must be in [minValue, maxValue]')
  }
  if (!warnSitsBeforeDanger(cfg.warnLevel, cfg.dangerLevel, cfg.dangerBelow)) {
    addConfigIssue(ctx, 'warnLevel', 'gauge: warnLevel must be reached before dangerLevel')
  }
}

const refineGauge = (cfg: GaugeConfig, ctx: z.RefinementCtx): void => {
  if (cfg.minValue >= cfg.maxValue) {
    addConfigIssue(ctx, 'maxValue', 'gauge: minValue must be less than maxValue')
  }
  if (cfg.dangerLevel < cfg.minValue || cfg.dangerLevel > cfg.maxValue) {
    addConfigIssue(ctx, 'dangerLevel', 'gauge: dangerLevel must be in [minValue, maxValue]')
  }
  refineGaugeWarnLevel(cfg, ctx)
}

const refineCycleButton = (cfg: CycleConfig, ctx: z.RefinementCtx): void => {
  if (cfg.initialActiveIndex < cfg.states.length) return
  addConfigIssue(
    ctx,
    'initialActiveIndex',
    `initialActiveIndex (${String(cfg.initialActiveIndex)}) must be less than states.length (${String(cfg.states.length)})`
  )
}

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
      addConfigIssue(
        ctx,
        'type',
        `widget type '${w.type}' does not match config type '${w.config.type}'`
      )
    }
    if (SIGNAL_CONSUMING_WIDGET_TYPES.has(w.type) && w.signal.length === 0) {
      ctx.addIssue({
        code: 'custom' as const,
        message: `signal must be a non-empty string for ${w.type} widgets`,
        path: ['signal'],
      })
    }
    if (w.config.type === 'gauge') refineGauge(w.config, ctx)
    if (w.config.type === 'button' && w.config.mode === 'cycle') refineCycleButton(w.config, ctx)
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
