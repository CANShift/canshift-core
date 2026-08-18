import { CANVAS, FIRMWARE_CAPS } from './constants/firmware-caps.js'
import { LAYOUT_GRID } from './layout-grid.js'

export const DISPLAY_TIER_IDS = ['base', 'medium', 'large'] as const

export type DisplayTierId = (typeof DISPLAY_TIER_IDS)[number]

export interface DisplayTier {
  id: DisplayTierId
  designWidth: number
  designHeight: number
  columns: number
  rows: number
  maxWidgetsPerPage: number
  valueFaces: readonly number[]
  labelFaces: readonly number[]
}

export const DISPLAY_TIERS: Readonly<Record<DisplayTierId, DisplayTier>> = {
  base: {
    id: 'base',
    designWidth: CANVAS.WIDTH,
    designHeight: CANVAS.HEIGHT,
    columns: LAYOUT_GRID.COLUMNS,
    rows: LAYOUT_GRID.ROWS,
    maxWidgetsPerPage: FIRMWARE_CAPS.MAX_WIDGETS_PER_PAGE,
    valueFaces: [13, 15, 17, 22, 32, 44, 48, 64, 84],
    labelFaces: [10, 12, 13, 14, 15, 16],
  },
  medium: {
    id: 'medium',
    designWidth: 480,
    designHeight: 320,
    columns: 16,
    rows: 14,
    maxWidgetsPerPage: 18,
    valueFaces: [17, 22, 28, 36, 48, 64, 72, 96, 120],
    labelFaces: [13, 15, 17, 19, 21, 23],
  },
  large: {
    id: 'large',
    designWidth: 800,
    designHeight: 480,
    columns: 24,
    rows: 20,
    maxWidgetsPerPage: 28,
    valueFaces: [22, 28, 36, 48, 64, 88, 104, 128, 168],
    labelFaces: [17, 20, 23, 26, 29, 32],
  },
}

export const DISPLAY_TIER_LIST: readonly DisplayTier[] = DISPLAY_TIER_IDS.map(
  (id) => DISPLAY_TIERS[id]
)

export const BASE_DISPLAY_TIER = DISPLAY_TIERS.base

const fits = (tier: DisplayTier, width: number, height: number): boolean =>
  tier.designWidth <= width && tier.designHeight <= height

const areaOf = (tier: DisplayTier): number => tier.designWidth * tier.designHeight

export const tierForPanel = (width: number, height: number): DisplayTier =>
  DISPLAY_TIER_LIST.filter((tier) => fits(tier, width, height)).reduce(
    (best, tier) => (areaOf(tier) > areaOf(best) ? tier : best),
    BASE_DISPLAY_TIER
  )

export const displayTier = (id: DisplayTierId): DisplayTier => DISPLAY_TIERS[id]
