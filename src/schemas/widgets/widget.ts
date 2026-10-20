import * as z from 'zod'

import { STRING_CAPS } from '../../constants/firmware-caps.js'
import { WidgetLayoutSchema, WidgetStyleSchema } from '../common.js'
import type { ExactOptional } from '../exact-optional.js'
import { warnSitsBeforeDanger } from '../../widget-metrics/gauge-severity.js'

import {
  ButtonWidgetConfigSchema,
  CycleButtonConfigSchema,
  SingleActionButtonConfigSchema,
} from './button.js'
import { GaugeWidgetConfigSchema } from './gauge.js'
import { GMeterWidgetConfigSchema } from './g-meter.js'
import { GearWidgetConfigSchema } from './gear.js'
import { ImageWidgetConfigSchema } from './image.js'
import { ShiftLightWidgetConfigSchema } from './shift-light.js'
import { TimerWidgetConfigSchema } from './timer.js'
import { WarningWidgetConfigSchema } from './warning.js'

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

const WidgetBaseSchema = z.object({
  id: z.string().min(1, 'widget id must be a non-empty string').max(STRING_CAPS.ID),
  signal: z.string().max(STRING_CAPS.SIGNAL_NAME),
  layout: WidgetLayoutSchema,
  style: WidgetStyleSchema,
})

const widgetVariant = <T extends string, C extends z.ZodType>(type: T, config: C) =>
  WidgetBaseSchema.extend({ type: z.literal(type), config }).strict()

const requireSignal = (widget: { type: string; signal: string }, ctx: z.RefinementCtx): void => {
  if (widget.signal.length > 0) return
  ctx.addIssue({
    code: 'custom' as const,
    message: `signal must be a non-empty string for ${widget.type} widgets`,
    path: ['signal'],
  })
}

const GaugeWidgetSchema = widgetVariant('gauge', GaugeWidgetConfigSchema).superRefine((w, ctx) => {
  requireSignal(w, ctx)
  refineGauge(w.config, ctx)
})

const ButtonWidgetSchema = widgetVariant('button', ButtonWidgetConfigSchema).superRefine(
  (w, ctx) => {
    if (w.config.mode === 'cycle') refineCycleButton(w.config, ctx)
  }
)

export const WidgetSchema = z.discriminatedUnion('type', [
  GaugeWidgetSchema,
  widgetVariant('warning', WarningWidgetConfigSchema).superRefine(requireSignal),
  ButtonWidgetSchema,
  widgetVariant('timer', TimerWidgetConfigSchema),
  widgetVariant('gear', GearWidgetConfigSchema).superRefine(requireSignal),
  widgetVariant('image', ImageWidgetConfigSchema),
  widgetVariant('shift_light', ShiftLightWidgetConfigSchema).superRefine(requireSignal),
  widgetVariant('g_meter', GMeterWidgetConfigSchema),
])

export type GaugeWidgetConfig = ExactOptional<z.infer<typeof GaugeWidgetConfigSchema>>
type WarningWidgetConfig = ExactOptional<z.infer<typeof WarningWidgetConfigSchema>>
export type SingleActionButtonConfig = ExactOptional<z.infer<typeof SingleActionButtonConfigSchema>>
type CycleButtonConfig = ExactOptional<z.infer<typeof CycleButtonConfigSchema>>
export type ButtonWidgetConfig = SingleActionButtonConfig | CycleButtonConfig
type TimerWidgetConfig = ExactOptional<z.infer<typeof TimerWidgetConfigSchema>>
export type GearWidgetConfig = ExactOptional<z.infer<typeof GearWidgetConfigSchema>>
export type ImageWidgetConfig = ExactOptional<z.infer<typeof ImageWidgetConfigSchema>>
type ShiftLightWidgetConfig = ExactOptional<z.infer<typeof ShiftLightWidgetConfigSchema>>
export type GMeterWidgetConfig = ExactOptional<z.infer<typeof GMeterWidgetConfigSchema>>

interface WidgetConfigByType {
  gauge: GaugeWidgetConfig
  warning: WarningWidgetConfig
  button: ButtonWidgetConfig
  timer: TimerWidgetConfig
  gear: GearWidgetConfig
  image: ImageWidgetConfig
  shift_light: ShiftLightWidgetConfig
  g_meter: GMeterWidgetConfig
}

export type WidgetType = keyof WidgetConfigByType

export type WidgetConfig = WidgetConfigByType[WidgetType]

export type WidgetOfType<T extends WidgetType> = ExactOptional<z.infer<typeof WidgetBaseSchema>> & {
  type: T
  config: WidgetConfigByType[T]
}

export type Widget = { [T in WidgetType]: WidgetOfType<T> }[WidgetType]
