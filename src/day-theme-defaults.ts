import { HexColorSchema } from './schemas/common.js'
import { PagePaletteSchema } from './schemas/dashboard.js'
import type { PagePalette, ThemeFace } from './schemas/dashboard.js'

export const DAY_PALETTE_DEFAULT: PagePalette = PagePaletteSchema.parse({
  surface: '#F0F0F0',
  primary: '#CC0000',
  accent: '#A85C00',
  text: '#000000',
  textDim: '#444444',
  warning: '#A85C00',
  danger: '#CC0000',
  success: '#006622',
})

export const DAY_BG_DEFAULT = HexColorSchema.parse('#DDDDDD')

export const DAY_THEME_FACE: ThemeFace = {
  bgColor: DAY_BG_DEFAULT,
  palette: DAY_PALETTE_DEFAULT,
}
