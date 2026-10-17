import { STRING_CAPS, Z_ORDER } from '../constants/firmware-caps.js'
import { migrateConfig } from '../migrations/index.js'
import { DashboardConfigSchema } from '../schemas/dashboard.js'

const LONG_ID = 'p'.repeat(40)
const LONG_TEXT = 'T'.repeat(24)

const style = {
  primaryColor: '#FFFFFF',
  secondaryColor: '#000000',
  warningColor: '#FF8800',
  criticalColor: '#FF4444',
  textColor: '#FFFFFF',
  fontSize: 14,
}

const navigateButton = (zOrder: number): Record<string, unknown> => ({
  id: 'w'.repeat(40),
  type: 'button',
  signal: '',
  layout: { col: 0, colSpan: 4, row: 0, rowSpan: 4, zOrder },
  style,
  config: {
    type: 'button',
    mode: 'single',
    label: 'GO',
    actions: [{ category: 'dashboard', type: 'navigate', pageId: LONG_ID }],
  },
})

const dashboardAt = (version: string): Record<string, unknown> => ({
  version,
  name: 'Caps',
  defaultPageId: LONG_ID,
  revLimitRpm: 7000,
  topBar: {
    height: 30,
    bgColor: '#000000',
    textColor: '#FFFFFF',
    layout: [
      { type: 'label', text: LONG_TEXT, position: 'left' },
      { type: 'signal', signal: 'rpm', format: '%.0f rpm and more', position: 'right' },
    ],
  },
  pages: [
    {
      id: LONG_ID,
      backgroundImage: null,
      backgroundColor: '#000000',
      showTopBar: true,
      statusRow: { center: { type: 'label', text: LONG_TEXT, position: 'center' } },
      widgets: [navigateButton(300), navigateButton(-4)],
    },
  ],
})

interface Page {
  id: string
  statusRow: { center: { text: string } }
  widgets: Widget[]
}
interface Widget {
  id: string
  layout: { zOrder: number }
  config: { actions: { pageId: string }[] }
}

const migrated = (): Record<string, unknown> =>
  migrateConfig(dashboardAt('1.43.0'), '1.44.0').config

describe('migrateConfig — 1.43.0 → 1.44.0 (strings the firmware cuts)', () => {
  it('rejects the long strings and the out-of-range zOrder before migrating', () => {
    expect(DashboardConfigSchema.safeParse(dashboardAt('1.44.0')).success).toBe(false)
  })

  it('cuts the strings where the firmware cuts them, so the result validates', () => {
    const config = migrated()
    expect(config.version).toBe('1.44.0')
    expect(DashboardConfigSchema.safeParse(config).success).toBe(true)
  })

  it('keeps every page reference pointing at the cut page id', () => {
    const config = migrated()
    const page = (config.pages as Page[])[0]
    const id = LONG_ID.slice(0, STRING_CAPS.ID)
    expect(page?.id).toBe(id)
    expect(config.defaultPageId).toBe(id)
    expect(page?.widgets.map((w) => w.config.actions[0]?.pageId)).toEqual([id, id])
  })

  it('cuts top bar and status row text to the firmware buffer', () => {
    const config = migrated()
    const layout = (config.topBar as { layout: { text?: string; format?: string }[] }).layout
    expect(layout[0]?.text).toHaveLength(STRING_CAPS.TOPBAR_TEXT)
    expect(layout[1]?.format).toHaveLength(STRING_CAPS.TOPBAR_FORMAT)
    const page = (config.pages as Page[])[0]
    expect(page?.statusRow.center.text).toHaveLength(STRING_CAPS.TOPBAR_TEXT)
  })

  it('clamps zOrder into the firmware byte', () => {
    const page = (migrated().pages as Page[])[0]
    expect(page?.widgets.map((w) => w.layout.zOrder)).toEqual([Z_ORDER.MAX, Z_ORDER.MIN])
  })
})
