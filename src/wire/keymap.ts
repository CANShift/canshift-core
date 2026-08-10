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

export const mapObjectKeys = <Source extends Record<string, unknown>>(
  source: Source,
  keyMap: Partial<Record<keyof Source, string>>
): Record<string, unknown> => {
  const out: Record<string, unknown> = {}
  for (const key of Object.keys(source)) {
    if (isForbiddenKey(key)) continue
    const value = source[key]
    if (value === undefined) continue
    const renamed = (keyMap as Record<string, string | undefined>)[key]
    const target = renamed ?? key
    if (isForbiddenKey(target)) continue
    out[target] = value
  }
  return out
}
