import {
  BASE_DISPLAY_TIER,
  CANVAS,
  DISPLAY_TIERS,
  DISPLAY_TIER_IDS,
  DISPLAY_TIER_LIST,
  FIRMWARE_CAPS,
  LAYOUT_GRID,
  displayTier,
  tierForPanel,
} from '../index.js'

describe('display tiers', () => {
  it('keeps the base tier equal to the canvas the dash is authored against', () => {
    expect(BASE_DISPLAY_TIER.designWidth).toBe(CANVAS.WIDTH)
    expect(BASE_DISPLAY_TIER.designHeight).toBe(CANVAS.HEIGHT)
    expect(BASE_DISPLAY_TIER.columns).toBe(LAYOUT_GRID.COLUMNS)
    expect(BASE_DISPLAY_TIER.rows).toBe(LAYOUT_GRID.ROWS)
    expect(BASE_DISPLAY_TIER.maxWidgetsPerPage).toBe(FIRMWARE_CAPS.MAX_WIDGETS_PER_PAGE)
  })

  it('grows both the grid and the widget budget with the panel', () => {
    const [base, medium, large] = DISPLAY_TIER_LIST
    for (const [smaller, bigger] of [
      [base, medium],
      [medium, large],
    ] as const) {
      expect(bigger?.designWidth).toBeGreaterThan(smaller?.designWidth ?? 0)
      expect(bigger?.columns).toBeGreaterThan(smaller?.columns ?? 0)
      expect(bigger?.rows).toBeGreaterThan(smaller?.rows ?? 0)
      expect(bigger?.maxWidgetsPerPage).toBeGreaterThan(smaller?.maxWidgetsPerPage ?? 0)
    }
  })

  it('gives every tier a strictly ascending font ladder', () => {
    for (const tier of DISPLAY_TIER_LIST) {
      for (const faces of [tier.valueFaces, tier.labelFaces]) {
        const ascending = [...faces].sort((a, b) => a - b)
        expect(faces).toEqual(ascending)
        expect(new Set(faces).size).toBe(faces.length)
      }
    }
  })

  it('scales the font ladder up with the tier', () => {
    const topOf = (faces: readonly number[]) => faces[faces.length - 1] ?? 0
    expect(topOf(DISPLAY_TIERS.medium.valueFaces)).toBeGreaterThan(
      topOf(DISPLAY_TIERS.base.valueFaces)
    )
    expect(topOf(DISPLAY_TIERS.large.valueFaces)).toBeGreaterThan(
      topOf(DISPLAY_TIERS.medium.valueFaces)
    )
  })

  it('resolves a panel to the largest tier that fits inside it', () => {
    expect(tierForPanel(320, 240).id).toBe('base')
    expect(tierForPanel(480, 320).id).toBe('medium')
    expect(tierForPanel(800, 480).id).toBe('large')
  })

  it('never picks a tier larger than the panel', () => {
    expect(tierForPanel(479, 319).id).toBe('base')
    expect(tierForPanel(799, 479).id).toBe('medium')
    expect(tierForPanel(240, 320).id).toBe('base')
  })

  it('falls back to base for a panel smaller than any tier', () => {
    expect(tierForPanel(128, 64).id).toBe('base')
    expect(tierForPanel(0, 0).id).toBe('base')
  })

  it('looks a tier up by id, and the list matches the record', () => {
    for (const id of DISPLAY_TIER_IDS) {
      expect(displayTier(id).id).toBe(id)
    }
    expect(DISPLAY_TIER_LIST.map((t) => t.id)).toEqual([...DISPLAY_TIER_IDS])
  })
})
