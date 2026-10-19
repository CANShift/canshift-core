import { TOP_BAR_METRICS } from '../topbar-metrics.js'

describe('TOP_BAR_METRICS', () => {
  it('pins the canonical proportion table', () => {
    expect(TOP_BAR_METRICS).toEqual({
      dotRatio: 0.3,
      separatorRatio: 0.55,
      gapRatio: 0.25,
      paddingRatio: 0.4,
      labelFontPx: 10,
      flagSquarePx: 7,
      flagGapPx: 3,
    })
  })

  const RATIO_KEYS = ['dotRatio', 'separatorRatio', 'gapRatio', 'paddingRatio'] as const

  const PIXEL_KEYS = ['labelFontPx', 'flagSquarePx', 'flagGapPx'] as const

  it('keeps every ratio in a sane range (0 < r <= 1)', () => {
    for (const key of RATIO_KEYS) {
      const value = TOP_BAR_METRICS[key]
      expect(value).toBeGreaterThan(0)
      expect(value).toBeLessThanOrEqual(1)
    }
  })

  it('keeps pixel constants as small positive integers', () => {
    for (const key of PIXEL_KEYS) {
      const value = TOP_BAR_METRICS[key]
      expect(Number.isInteger(value)).toBe(true)
      expect(value).toBeGreaterThan(0)
      expect(value).toBeLessThanOrEqual(16)
    }
  })
})
