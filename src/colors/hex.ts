import type { HexColor } from '../schemas/common.js'

export const HEX_REGEX = /^#([0-9a-fA-F]{6})$/

export const isHexColor = (value: string): value is HexColor => HEX_REGEX.test(value)

export const hex = (value: string): HexColor => {
  if (!isHexColor(value)) throw new Error(`Invalid hex color: ${value} (expected #RRGGBB)`)
  return value
}

export interface RgbChannels {
  r: number
  g: number
  b: number
}

export const hexToRgb255 = (value: string): RgbChannels | null => {
  const match = HEX_REGEX.exec(value)
  const digits = match?.[1]
  if (digits === undefined) return null
  const packed = Number.parseInt(digits, 16)
  return { r: (packed >> 16) & 0xff, g: (packed >> 8) & 0xff, b: packed & 0xff }
}

const clampByte = (value: number): number => (value < 0 ? 0 : value > 255 ? 255 : Math.round(value))

const byteToHex = (value: number): string =>
  clampByte(value).toString(16).padStart(2, '0').toUpperCase()

export const rgb255ToHex = (channels: RgbChannels): HexColor =>
  hex(`#${byteToHex(channels.r)}${byteToHex(channels.g)}${byteToHex(channels.b)}`)
