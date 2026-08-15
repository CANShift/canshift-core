import { HexColorSchema } from './schemas/common.js'
import { DEFAULT_PAGE_PALETTE, PagePaletteSchema } from './schemas/dashboard.js'
import type { ThemeFace, ThemePreset } from './schemas/dashboard.js'
import { DAY_BG_DEFAULT, DAY_PALETTE_DEFAULT } from './day-theme-defaults.js'

export interface ThemePresetEntry {
  id: string
  label: string
  note: string
  preset: ThemePreset
}

interface PaletteInput {
  surface: string
  primary: string
  accent: string
  text: string
  textDim: string
  warning: string
  danger: string
  success: string
}

const face = (bgColor: string, palette: PaletteInput): ThemeFace => ({
  bgColor: HexColorSchema.parse(bgColor),
  palette: PagePaletteSchema.parse(palette),
})

const entry = (id: string, label: string, note: string, preset: ThemePreset): ThemePresetEntry => ({
  id,
  label,
  note,
  preset,
})

export const THEME_PRESETS: readonly ThemePresetEntry[] = [
  entry('default', 'Default', 'CANShift stock', {
    night: { bgColor: HexColorSchema.parse('#121212'), palette: DEFAULT_PAGE_PALETTE },
    day: { bgColor: DAY_BG_DEFAULT, palette: DAY_PALETTE_DEFAULT },
  }),
  entry('endurance', 'Endurance', 'dim — night stints', {
    night: face('#080808', {
      surface: '#141414',
      primary: '#CC3333',
      accent: '#7A4A00',
      text: '#8F8F8F',
      textDim: '#5A5A5A',
      warning: '#7A4A00',
      danger: '#CC3333',
      success: '#2E7D32',
    }),
    day: face('#E4E2DE', {
      surface: '#F2F0EC',
      primary: '#B22222',
      accent: '#8A5200',
      text: '#1A1A1A',
      textDim: '#5F5C57',
      warning: '#8A5200',
      danger: '#B22222',
      success: '#1B5E20',
    }),
  }),
  entry('rally', 'Rally', 'amber, high glare', {
    night: face('#101010', {
      surface: '#1C1A16',
      primary: '#FF4444',
      accent: '#FF8800',
      text: '#FFC24D',
      textDim: '#8A7A55',
      warning: '#FF8800',
      danger: '#FF4444',
      success: '#00CC44',
    }),
    day: face('#EDE7DA', {
      surface: '#F7F3E9',
      primary: '#C62828',
      accent: '#A85C00',
      text: '#241C0A',
      textDim: '#6B5C3B',
      warning: '#A85C00',
      danger: '#C62828',
      success: '#1B6B2F',
    }),
  }),
  entry('drag', 'Drag', 'mono, max contrast', {
    night: face('#000000', {
      surface: '#0D0D0D',
      primary: '#FF0000',
      accent: '#FFFFFF',
      text: '#FFFFFF',
      textDim: '#7A7A7A',
      warning: '#FF8800',
      danger: '#FF0000',
      success: '#00CC44',
    }),
    day: face('#FFFFFF', {
      surface: '#EFEFEF',
      primary: '#D50000',
      accent: '#000000',
      text: '#000000',
      textDim: '#5A5A5A',
      warning: '#B35C00',
      danger: '#D50000',
      success: '#006622',
    }),
  }),
  entry('circuit', 'Circuit', 'CANShift red', {
    night: face('#121212', {
      surface: '#1F1616',
      primary: '#FF4747',
      accent: '#FF4747',
      text: '#FFFFFF',
      textDim: '#B08A8A',
      warning: '#FF8800',
      danger: '#FF4747',
      success: '#00CC44',
    }),
    day: face('#EDE6E6', {
      surface: '#F7F1F1',
      primary: '#C41E1E',
      accent: '#C41E1E',
      text: '#141414',
      textDim: '#6B5555',
      warning: '#B35C00',
      danger: '#C41E1E',
      success: '#006622',
    }),
  }),
  entry('ice', 'Ice', 'cold, low fatigue', {
    night: face('#0B0F12', {
      surface: '#141A1F',
      primary: '#FF5A5A',
      accent: '#4FC3F7',
      text: '#DCEAF2',
      textDim: '#7C939F',
      warning: '#FF8800',
      danger: '#FF5A5A',
      success: '#00CC44',
    }),
    day: face('#E3ECF2', {
      surface: '#F2F7FA',
      primary: '#C62828',
      accent: '#0277BD',
      text: '#10202B',
      textDim: '#4F6B7A',
      warning: '#B35C00',
      danger: '#C62828',
      success: '#006622',
    }),
  }),
  entry('paper', 'Paper', 'daylight, reflective', {
    night: face('#16130F', {
      surface: '#201C16',
      primary: '#E5533D',
      accent: '#D08A2C',
      text: '#EFE7DA',
      textDim: '#9A9083',
      warning: '#D08A2C',
      danger: '#E5533D',
      success: '#4CAF50',
    }),
    day: face('#E8E6E1', {
      surface: '#F5F3EF',
      primary: '#C41200',
      accent: '#B35C00',
      text: '#141414',
      textDim: '#6A665F',
      warning: '#B35C00',
      danger: '#C41200',
      success: '#006622',
    }),
  }),
]

export const DEFAULT_THEME_ID = 'default'

export const themePresetById = (id: string): ThemePresetEntry | undefined =>
  THEME_PRESETS.find((t) => t.id === id)

export const defaultThemePreset = (): ThemePreset => {
  const fallback = themePresetById(DEFAULT_THEME_ID)
  if (!fallback) throw new Error(`THEME_PRESETS is missing "${DEFAULT_THEME_ID}"`)
  return fallback.preset
}
