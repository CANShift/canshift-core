import { asPlainObject } from '../wire/plain-object.js'

export const DEPRECATED_SIGNAL_KEYS = ['colorRamp'] as const

const isDeprecated = (key: string): boolean =>
  DEPRECATED_SIGNAL_KEYS.some((deprecated) => deprecated === key)

export const dropDeprecatedSignalKeys = (value: unknown): unknown => {
  const record = asPlainObject(value)
  if (record === null) return value
  if (!Object.keys(record).some(isDeprecated)) return value

  return Object.fromEntries(Object.entries(record).filter(([key]) => !isDeprecated(key)))
}
