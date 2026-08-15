import { asPlainObject } from '../config-traverse.js'
import type { MigrationFn } from '../types.js'

const NIGHT_FACE_AT_1_37 = { bgColor: '#121212' }
const DAY_FACE_AT_1_37 = { bgColor: '#DDDDDD' }

const withoutThemeKeys = (config: Record<string, unknown>): Record<string, unknown> =>
  Object.fromEntries(
    Object.entries(config).filter(([key]) => key !== 'dayTheme' && key !== 'nightTheme')
  )

export const pairThemeFaces: MigrationFn = (config) => {
  const day = asPlainObject(config.dayTheme)
  const night = asPlainObject(config.nightTheme)
  const rest = { ...withoutThemeKeys(config), version: '1.37.0' }
  if (day === null && night === null) return rest

  return {
    ...rest,
    theme: {
      day: day ?? DAY_FACE_AT_1_37,
      night: night ?? NIGHT_FACE_AT_1_37,
    },
  }
}
