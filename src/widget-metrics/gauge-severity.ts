import type { GaugeWidgetConfig } from '../schemas/widgets/widget.js'
import type { SignalDef } from '../schemas/signal.js'

import { isValueInDanger } from './gauge.js'

export type GaugeSeverity = 'normal' | 'warn' | 'danger'

export type GaugeThresholds = Pick<GaugeWidgetConfig, 'warnLevel' | 'dangerLevel' | 'dangerBelow'>
export type SignalLimits = Pick<
  SignalDef,
  'warningLevel' | 'dangerLevel' | 'highWarningLevel' | 'highDangerLevel'
>

const SEVERITY_RANK: Record<GaugeSeverity, number> = { normal: 0, warn: 1, danger: 2 }

const strongerOf = (a: GaugeSeverity, b: GaugeSeverity): GaugeSeverity =>
  SEVERITY_RANK[a] >= SEVERITY_RANK[b] ? a : b

export const warnSitsBeforeDanger = (
  warnLevel: number,
  dangerLevel: number,
  dangerBelow = false
): boolean => (dangerBelow ? warnLevel > dangerLevel : warnLevel < dangerLevel)

const readingSeverity = (
  value: number,
  warnLevel: number | undefined,
  dangerLevel: number | undefined,
  below: boolean
): GaugeSeverity => {
  if (dangerLevel !== undefined && isValueInDanger(value, dangerLevel, below)) return 'danger'
  if (warnLevel !== undefined && isValueInDanger(value, warnLevel, below)) return 'warn'
  return 'normal'
}

const primarySideIsLow = (limits: SignalLimits): boolean =>
  limits.warningLevel !== undefined &&
  limits.dangerLevel !== undefined &&
  limits.warningLevel > limits.dangerLevel

export const signalSeverity = (value: number, limits: SignalLimits): GaugeSeverity =>
  strongerOf(
    readingSeverity(value, limits.warningLevel, limits.dangerLevel, primarySideIsLow(limits)),
    readingSeverity(value, limits.highWarningLevel, limits.highDangerLevel, false)
  )

export const gaugeSeverity = (
  value: number,
  thresholds: GaugeThresholds,
  signal: SignalLimits = {}
): GaugeSeverity =>
  strongerOf(
    readingSeverity(
      value,
      thresholds.warnLevel,
      thresholds.dangerLevel,
      thresholds.dangerBelow === true
    ),
    signalSeverity(value, signal)
  )
