import type { GaugeWidgetConfig } from '../schemas/widgets/widget.js'
import type { SignalDef } from '../schemas/signal.js'

import { isValueInDanger } from './gauge.js'

export const GAUGE_SEVERITIES = ['normal', 'warn', 'danger'] as const
export type GaugeSeverity = (typeof GAUGE_SEVERITIES)[number]

export type GaugeThresholds = Pick<GaugeWidgetConfig, 'warnLevel' | 'dangerLevel' | 'dangerBelow'>
export type SignalWarnLevels = Pick<SignalDef, 'warningLevel' | 'highWarningLevel'>

export const warnSitsBeforeDanger = (
  warnLevel: number,
  dangerLevel: number,
  dangerBelow = false
): boolean => (dangerBelow ? warnLevel > dangerLevel : warnLevel < dangerLevel)

const catalogueWarnCandidates = (
  signal: SignalWarnLevels | undefined,
  dangerBelow: boolean
): (number | undefined)[] =>
  dangerBelow
    ? [signal?.warningLevel, signal?.highWarningLevel]
    : [signal?.highWarningLevel, signal?.warningLevel]

export const gaugeWarnLevel = (
  thresholds: GaugeThresholds,
  signal?: SignalWarnLevels
): number | undefined => {
  if (thresholds.warnLevel !== undefined) return thresholds.warnLevel
  const below = thresholds.dangerBelow === true
  return catalogueWarnCandidates(signal, below).find(
    (level): level is number =>
      level !== undefined && warnSitsBeforeDanger(level, thresholds.dangerLevel, below)
  )
}

export const gaugeSeverity = (
  value: number,
  thresholds: GaugeThresholds,
  signal?: SignalWarnLevels
): GaugeSeverity => {
  const below = thresholds.dangerBelow === true
  if (isValueInDanger(value, thresholds.dangerLevel, below)) return 'danger'
  const warnLevel = gaugeWarnLevel(thresholds, signal)
  if (warnLevel !== undefined && isValueInDanger(value, warnLevel, below)) return 'warn'
  return 'normal'
}
