const FORBIDDEN_KEYS = new Set<string>(['__proto__', 'constructor', 'prototype'])

export const isForbiddenKey = (key: string): boolean => FORBIDDEN_KEYS.has(key)

export const hasForbiddenKey = (value: object): boolean => Object.keys(value).some(isForbiddenKey)

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
