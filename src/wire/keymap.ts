import { isForbiddenKey } from './plain-object.js'

type RenameKey = (key: string) => string

const SNAKE_SEGMENT_RE = /_([a-z0-9])/g
const UPPERCASE_RE = /[A-Z]/g

export const snakeToCamelKey = (key: string): string =>
  key.replace(SNAKE_SEGMENT_RE, (_match, char: string) => char.toUpperCase())

export const camelToSnakeKey = (key: string): string =>
  key.replace(UPPERCASE_RE, (char) => `_${char.toLowerCase()}`)

const mapEntryKeys = (
  source: Record<string, unknown>,
  rename: RenameKey,
  mapValue: (value: unknown) => unknown
): Record<string, unknown> => {
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(source)) {
    if (value === undefined || isForbiddenKey(key)) continue
    const target = rename(key)
    if (isForbiddenKey(target)) continue
    out[target] = mapValue(value)
  }
  return out
}

const keepValue = (value: unknown): unknown => value

const mapValueKeysDeep = (value: unknown, rename: RenameKey): unknown => {
  if (Array.isArray(value)) return value.map((entry) => mapValueKeysDeep(entry, rename))
  if (typeof value !== 'object' || value === null) return value
  return mapEntryKeys(value as Record<string, unknown>, rename, (entry) =>
    mapValueKeysDeep(entry, rename)
  )
}

export const snakeToCamelKeys = (source: object): Record<string, unknown> =>
  mapEntryKeys(source as Record<string, unknown>, snakeToCamelKey, keepValue)

export const camelToSnakeKeys = (source: object): Record<string, unknown> =>
  mapEntryKeys(source as Record<string, unknown>, camelToSnakeKey, keepValue)

export const snakeToCamelDeep = (source: object): Record<string, unknown> =>
  mapValueKeysDeep(source, snakeToCamelKey) as Record<string, unknown>

export const camelToSnakeDeep = (source: object): Record<string, unknown> =>
  mapValueKeysDeep(source, camelToSnakeKey) as Record<string, unknown>
