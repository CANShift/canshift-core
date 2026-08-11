export interface FontTokens {
  ui: string
  mono: string
}

export const FONT_TOKENS = {
  ui: "'Archivo', system-ui, -apple-system, 'Segoe UI', sans-serif",
  mono: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
} as const satisfies FontTokens

export const FONT_UI_CSS_VAR = '--font-ui'

export const FONT_MONO_CSS_VAR = '--font-mono'

export const fontTokensToCssVars = (tokens: FontTokens): Record<string, string> => ({
  [FONT_UI_CSS_VAR]: tokens.ui,
  [FONT_MONO_CSS_VAR]: tokens.mono,
})
