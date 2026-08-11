import { hexToHslChannels } from '../colors/hsl.js'

export const BRAND_NEUTRAL_STEPS = [100, 200, 300, 400, 500, 600, 700, 800, 900] as const

export type BrandNeutralStep = (typeof BRAND_NEUTRAL_STEPS)[number]

export interface BrandTokens {
  colors: {
    accent: string
    accent600: string
    ink: string
    ground: string
    surface: string
    rule: string
    chromeBg: string
    chromeSurface: string
  }
  darkNeutrals: Record<BrandNeutralStep, string>
  darkText: string
  darkDivider: string
  lightNeutrals: Record<BrandNeutralStep, string>
  lightDivider: string
}

export const BRAND_TOKENS = {
  colors: {
    accent: '#EC3013',
    accent600: '#DD2B0F',
    ink: '#201E1D',
    ground: '#F3F2F2',
    surface: '#EAE9E9',
    rule: '#D7D3D3',
    chromeBg: '#151313',
    chromeSurface: '#1F1D1D',
  },
  darkNeutrals: {
    100: '#1C1A1A',
    200: '#262323',
    300: '#383434',
    400: '#4D4949',
    500: '#7D7979',
    600: '#9B9797',
    700: '#C2BFBF',
    800: '#E2DFDF',
    900: '#F5F4F4',
  },
  darkText: '#F3F2F2',
  darkDivider: 'color-mix(in srgb, #F3F2F2 24%, transparent)',
  lightNeutrals: {
    100: '#F8F4F4',
    200: '#EAE7E7',
    300: '#D7D3D3',
    400: '#BAB6B6',
    500: '#9B9797',
    600: '#7D7979',
    700: '#605D5D',
    800: '#444141',
    900: '#2D2B2B',
  },
  lightDivider: 'color-mix(in srgb, #201E1D 40%, transparent)',
} as const satisfies BrandTokens

export const BRAND_COLOR_KEY_TO_CSS_VAR: Record<keyof BrandTokens['colors'], string> = {
  accent: '--brand-accent',
  accent600: '--brand-accent-600',
  ink: '--brand-ink',
  ground: '--brand-ground',
  surface: '--brand-surface',
  rule: '--brand-rule',
  chromeBg: '--brand-chrome-bg',
  chromeSurface: '--brand-chrome-surface',
}

export const BRAND_TEXT_CSS_VAR = '--brand-text'

export const BRAND_DIVIDER_CSS_VAR = '--brand-divider'

export const brandNeutralCssVar = (step: BrandNeutralStep): string =>
  `--brand-neutral-${String(step)}`

export const brandTokensToCssVars = (tokens: BrandTokens): Record<string, string> => {
  const out: Record<string, string> = {}
  for (const key of Object.keys(BRAND_COLOR_KEY_TO_CSS_VAR) as (keyof BrandTokens['colors'])[]) {
    out[BRAND_COLOR_KEY_TO_CSS_VAR[key]] = hexToHslChannels(tokens.colors[key])
  }
  for (const step of BRAND_NEUTRAL_STEPS) {
    out[brandNeutralCssVar(step)] = hexToHslChannels(tokens.darkNeutrals[step])
  }
  out[BRAND_TEXT_CSS_VAR] = hexToHslChannels(tokens.darkText)
  out[BRAND_DIVIDER_CSS_VAR] = tokens.darkDivider
  return out
}

export const brandLightThemeCssVars = (tokens: BrandTokens): Record<string, string> => {
  const out: Record<string, string> = {}
  for (const step of BRAND_NEUTRAL_STEPS) {
    out[brandNeutralCssVar(step)] = hexToHslChannels(tokens.lightNeutrals[step])
  }
  out[BRAND_TEXT_CSS_VAR] = hexToHslChannels(tokens.colors.ink)
  out[BRAND_DIVIDER_CSS_VAR] = tokens.lightDivider
  out[BRAND_COLOR_KEY_TO_CSS_VAR.chromeBg] = hexToHslChannels(tokens.colors.ground)
  out[BRAND_COLOR_KEY_TO_CSS_VAR.chromeSurface] = hexToHslChannels(tokens.colors.surface)
  return out
}
