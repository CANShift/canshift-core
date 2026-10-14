const FORBIDDEN_KEYS = new Set<string>(['__proto__', 'constructor', 'prototype'])

export const isForbiddenKey = (key: string): boolean => FORBIDDEN_KEYS.has(key)

export const findForbiddenKey = (value: unknown): string | null => {
  if (Array.isArray(value)) {
    for (const entry of value) {
      const found = findForbiddenKey(entry)
      if (found !== null) return found
    }
    return null
  }
  if (typeof value !== 'object' || value === null) return null
  for (const [key, entry] of Object.entries(value)) {
    if (isForbiddenKey(key)) return key
    const found = findForbiddenKey(entry)
    if (found !== null) return found
  }
  return null
}

export const stripForbiddenKeys = (key: string, value: unknown): unknown =>
  isForbiddenKey(key) ? undefined : value

export const asPlainObject = (value: unknown): Record<string, unknown> | null =>
  typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null

const OMITTED = Symbol('omitted')

type ScalarKind = 'string' | 'number' | 'bigint' | 'boolean' | 'symbol' | 'undefined' | 'function'

const SCALAR_CLONERS: Record<ScalarKind, (value: unknown) => unknown> = {
  string: (value) => value,
  boolean: (value) => value,
  number: (value) => (Number.isFinite(value) ? value : null),
  bigint: () => {
    throw new TypeError('BigInt value')
  },
  undefined: () => OMITTED,
  function: () => OMITTED,
  symbol: () => OMITTED,
}

const hasToJson = (value: object): value is { toJSON: (key: string) => unknown } =>
  typeof (value as { toJSON?: unknown }).toJSON === 'function'

const cloneArray = (items: readonly unknown[], ancestors: Set<object>): unknown[] =>
  Array.from(items, (item, index) => {
    const cloned = cloneValue(item, String(index), ancestors)
    return cloned === OMITTED ? null : cloned
  })

const cloneRecord = (
  record: Record<string, unknown>,
  ancestors: Set<object>
): Record<string, unknown> => {
  const cloned: Record<string, unknown> = {}
  for (const [key, entry] of Object.entries(record)) {
    if (isForbiddenKey(key)) continue
    const value = cloneValue(entry, key, ancestors)
    if (value !== OMITTED) cloned[key] = value
  }
  return cloned
}

const cloneObject = (value: object, key: string, ancestors: Set<object>): unknown => {
  if (hasToJson(value)) return cloneValue(value.toJSON(key), key, ancestors)
  if (ancestors.has(value)) throw new TypeError('cyclic structure')
  ancestors.add(value)
  const cloned = Array.isArray(value)
    ? cloneArray(value, ancestors)
    : cloneRecord(value as Record<string, unknown>, ancestors)
  ancestors.delete(value)
  return cloned
}

const cloneValue = (value: unknown, key: string, ancestors: Set<object>): unknown => {
  if (value === null) return null
  if (typeof value === 'object') return cloneObject(value, key, ancestors)
  return SCALAR_CLONERS[typeof value as ScalarKind](value)
}

export const cloneJsonWithoutForbiddenKeys = (
  value: Record<string, unknown>
): Record<string, unknown> => cloneRecord(value, new Set([value]))
