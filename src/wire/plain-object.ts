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
