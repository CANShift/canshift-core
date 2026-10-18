import { hexToRgb255 } from './hex.js'
import type { RgbChannels } from './hex.js'

const rawHue = (channels: RgbChannels, max: number, delta: number): number => {
  const { r, g, b } = channels
  if (max === r) return ((g - b) / delta) % 6
  if (max === g) return (b - r) / delta + 2
  return (r - g) / delta + 4
}

export const hexToHslChannels = (hexValue: string): string => {
  const channels = hexToRgb255(hexValue)
  if (channels === null) {
    throw new Error(`Invalid hex color: ${hexValue} (expected #RRGGBB)`)
  }
  const unit = { r: channels.r / 255, g: channels.g / 255, b: channels.b / 255 }
  const max = Math.max(unit.r, unit.g, unit.b)
  const min = Math.min(unit.r, unit.g, unit.b)
  const delta = max - min
  const l = (max + min) / 2

  let h = 0
  let s = 0
  if (delta !== 0) {
    s = delta / (1 - Math.abs(2 * l - 1))
    h = rawHue(unit, max, delta) * 60
    if (h < 0) h += 360
  }

  const hRounded = (Math.round(h) % 360).toString()
  const sRounded = Math.round(s * 100).toString()
  const lRounded = Math.round(l * 100).toString()
  return `${hRounded} ${sRounded}% ${lRounded}%`
}
