import { asPlainObject, asObjectArray, mapWidgets } from '../config-traverse.js'
import { clipField } from '../legacy-values.js'
import type { MigrationFn } from '../types.js'

type Config = Record<string, unknown>

const CAPS_1_24 = {
  widgetLabel: 31,
  gaugePrefix: 7,
  prefixSuffix: 15,
  path: 63,
  protocol: 31,
} as const

const clipGaugeConfig = (cfg: Config): Config => {
  const rest = { ...cfg }
  delete rest.showNeedle
  return clipField(
    clipField(rest, 'prefix', CAPS_1_24.gaugePrefix),
    'suffix',
    CAPS_1_24.prefixSuffix
  )
}

const clipGearConfig = (cfg: Config): Config =>
  clipField(clipField(cfg, 'prefix', CAPS_1_24.prefixSuffix), 'suffix', CAPS_1_24.prefixSuffix)

const clipButtonConfig = (cfg: Config): Config => {
  const clipped = clipField(
    clipField(cfg, 'label', CAPS_1_24.widgetLabel),
    'iconPath',
    CAPS_1_24.path
  )
  const states = asObjectArray(clipped.states)
  if (!states) return clipped
  return {
    ...clipped,
    states: states.map((state) => clipField(state, 'label', CAPS_1_24.widgetLabel)),
  }
}

const clipImageConfig = (cfg: Config): Config => clipField(cfg, 'imagePath', CAPS_1_24.path)

const CLIP_BY_WIDGET_TYPE: Record<string, (cfg: Config) => Config> = {
  gauge: clipGaugeConfig,
  gear: clipGearConfig,
  button: clipButtonConfig,
  image: clipImageConfig,
}

export const clipToFirmwareCaps: MigrationFn = (config) => {
  const migrated = mapWidgets(config, '1.24.0', (widget) => {
    const cfg = asPlainObject(widget.config)
    if (!cfg) return widget
    const clip = CLIP_BY_WIDGET_TYPE[String(widget.type)]
    if (!clip) return widget
    return { ...widget, config: clip(cfg) }
  })
  return typeof migrated.protocol === 'string'
    ? { ...migrated, protocol: migrated.protocol.slice(0, CAPS_1_24.protocol) }
    : migrated
}
