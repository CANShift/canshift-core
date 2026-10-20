import type { GaugeWidgetConfig } from '../schemas/widgets/widget.js'
import { displayDecimals, displayValue, type UnitSystem } from '../units/convert.js'

import {
  gaugeDeviceValuePx,
  measureValueFit,
  widestConfiguredValue,
  type ValueFit,
} from './value-fit.js'

export interface GaugeFitInput {
  config: GaugeWidgetConfig
  width: number
  height: number
  convertibleUnit: string
  unitSymbol: string
  system: UnitSystem
}

export const measureGaugeFit = ({ config, ...input }: GaugeFitInput): ValueFit => {
  const widest = widestConfiguredValue(config.minValue, config.maxValue)
  return measureValueFit({
    widestValue: displayValue(widest, input.convertibleUnit, input.system),
    decimalPlaces: displayDecimals(config.decimalPlaces, input.convertibleUnit, input.system),
    prefix: config.prefix ?? '',
    unit: input.unitSymbol,
    valueFontPx: gaugeDeviceValuePx(config, input.width, input.height),
    columnWidth: input.width,
  })
}
