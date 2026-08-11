import { hexToRgb255, rgb255ToHex } from '../colors/hex.js'

type Config = Record<string, unknown>

export const PALETTE_1_3 = {
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
  const channels = hexToRgb255(hex)
  if (channels === null) return hex
  return rgb255ToHex({
    r: channels.r + delta,
    g: channels.g + delta,
    b: channels.b + delta,
  })
}
