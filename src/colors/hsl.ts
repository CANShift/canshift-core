import { hexToRgb255 } from './hex.js'

export const hexToHslChannels = (hexValue: string): string => {
  const channels = hexToRgb255(hexValue)
  if (channels === null) {
    throw new Error(`Invalid hex color: ${hexValue} (expected #RRGGBB)`)
  }
  const r = channels.r / 255
  const g = channels.g / 255
  const b = channels.b / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const delta = max - min
  const l = (max + min) / 2

  let h = 0
  let s = 0
  if (delta !== 0) {
    s = delta / (1 - Math.abs(2 * l - 1))
    if (max === r) {
      h = ((g - b) / delta) % 6
    } else if (max === g) {
      h = (b - r) / delta + 2
    } else {
      h = (r - g) / delta + 4
    }
    h *= 60
    if (h < 0) h += 360
  }

  const hRounded = (Math.round(h) % 360).toString()
  const sRounded = Math.round(s * 100).toString()
  const lRounded = Math.round(l * 100).toString()
  return `${hRounded} ${sRounded}% ${lRounded}%`
}
