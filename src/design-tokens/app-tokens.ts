import { hexToHslChannels } from '../colors/hsl.js'

export interface DesignTokens {
  colors: {
    bg: string
    bgInset: string
    surface: string
    surface2: string
    border: string
    ruleHair: string
    track: string
    primary: string
    primaryForeground: string
    secondary: string
    secondaryForeground: string
    accent: string
    accentForeground: string
    accentDim: string
    selectedBg: string
    destructive: string
    destructiveForeground: string
    text: string
    textDim: string
    textMuted: string
    success: string
    successBg: string
    successBorder: string
    warning: string
    danger: string
    statusDanger: string
    statusDangerDim: string
    scrim: string
    ring: string
    selection: string
    selectionBg: string
  }
  radii: { sm: number; md: number; lg: number; full: number }
  spacing: { xs: number; sm: number; md: number; lg: number; xl: number; xxl: number }
  typography: {
    xxs: number
    xs: number
    sm: number
    md: number
    lg: number
    xl: number
    xxl: number
    display: number
  }
}

export const DARK_TOKENS = {
  colors: {
    bg: '#121212',
    bgInset: '#080808',
    surface: '#1F1F1F',
    surface2: '#292929',
    border: '#333333',
    ruleHair: '#262323',
    track: '#222222',
    primary: '#FF4747',
    primaryForeground: '#FFFFFF',
    secondary: '#292929',
    secondaryForeground: '#FFFFFF',
    accent: '#FF4747',
    accentForeground: '#FFFFFF',
    accentDim: '#1A0808',
    selectedBg: '#1A1717',
    destructive: '#FF4747',
    destructiveForeground: '#FFFFFF',
    text: '#FFFFFF',
    textDim: '#BABABA',
    textMuted: '#8F8F8F',
    success: '#00CC2A',
    successBg: '#1A3A1A',
    successBorder: '#336633',
    warning: '#FF8800',
    danger: '#FF4444',
    statusDanger: '#E03030',
    statusDangerDim: '#3A1A1A',
    scrim: '#000000',
    ring: '#FF4747',
    selection: '#6CB6FF',
    selectionBg: '#1B2030',
  },
  radii: { sm: 0, md: 0, lg: 0, full: 0 },
  spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 },
  typography: { xxs: 9, xs: 11, sm: 13, md: 15, lg: 18, xl: 22, xxl: 28, display: 36 },
} as const satisfies DesignTokens

export const COLOR_KEY_TO_CSS_VAR: Record<keyof DesignTokens['colors'], string> = {
  bg: '--bg',
  bgInset: '--bg-inset',
  surface: '--surface',
  surface2: '--surface-2',
  border: '--border',
  ruleHair: '--rule-hair',
  track: '--track',
  primary: '--primary',
  primaryForeground: '--primary-foreground',
  secondary: '--secondary',
  secondaryForeground: '--secondary-foreground',
  accent: '--accent',
  accentForeground: '--accent-foreground',
  accentDim: '--accent-dim',
  selectedBg: '--selected-bg',
  destructive: '--destructive',
  destructiveForeground: '--destructive-foreground',
  text: '--text',
  textDim: '--text-dim',
  textMuted: '--text-muted',
  success: '--success',
  successBg: '--success-bg',
  successBorder: '--success-border',
  warning: '--warning',
  danger: '--danger',
  statusDanger: '--status-danger',
  statusDangerDim: '--status-danger-dim',
  scrim: '--scrim',
  ring: '--ring',
  selection: '--selection',
  selectionBg: '--selection-bg',
}

export const tokensToCssVars = (tokens: DesignTokens): Record<string, string> => {
  const out: Record<string, string> = {}
  for (const key of Object.keys(COLOR_KEY_TO_CSS_VAR) as (keyof DesignTokens['colors'])[]) {
    const cssVar = COLOR_KEY_TO_CSS_VAR[key]
    out[cssVar] = hexToHslChannels(tokens.colors[key])
  }
  return out
}
