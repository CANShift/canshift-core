import { HEX_REGEX } from '../colors/hex.js'

type Config = Record<string, unknown>

export const DEFAULT_PALETTE = {
  surface: '#1E1E1E',
  primary: '#FF4444',
  accent: '#FF8800',
  text: '#FFFFFF',
  textDim: '#888888',
  warning: '#FF8800',
  danger: '#FF4444',
  success: '#00CC44',
} as const

export const clipField = (obj: Config, key: string, max: number): Config => {
  const value = obj[key]
  return typeof value === 'string' && value.length > max
    ? { ...obj, [key]: value.slice(0, max) }
    : obj
}

export const brightenHex = (hex: string, delta = 0x33): string => {
  const m = HEX_REGEX.exec(hex)
  if (!m) return hex
  const value = m[1]
  if (!value) return hex
  const channels = [0, 2, 4].map((i) => {
    const c = parseInt(value.substring(i, i + 2), 16)
    return Math.min(0xff, c + delta)
      .toString(16)
      .padStart(2, '0')
  })
  return `#${channels.join('').toUpperCase()}`
}
