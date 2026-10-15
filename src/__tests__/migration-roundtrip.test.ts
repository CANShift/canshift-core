import { CURRENT_SCHEMA_VERSION, DashboardConfigSchema } from '../index.js'
import { migrateConfig } from '../migrations/index.js'

const fullStyle = {
  primaryColor: '#FF4444',
  secondaryColor: '#333333',
  warningColor: '#FF8800',
  criticalColor: '#FF0000',
  textColor: '#FFFFFF',
  fontSize: 14,
}

const fullPalette = {
  surface: '#1E1E1E',
  primary: '#FF4444',
  accent: '#FF8800',
  text: '#FFFFFF',
  textDim: '#888888',
  warning: '#FF8800',
  danger: '#FF4444',
  success: '#00CC44',
}

const floorDashboard1240: Record<string, unknown> = {
  version: '1.24.0',
  name: 'Floor Dash',
  defaultPageId: 'p1',
  revLimitRpm: 7500,
  topBar: { height: 30, bgColor: '#0D0D0D', textColor: '#AAAAAA' },
  pages: [
    {
      id: 'p1',
      backgroundImage: null,
      backgroundColor: '#000000',
      palette: fullPalette,
      showTopBar: true,
      widgets: [
        {
          id: 'boost_arc',
          type: 'gauge',
          signal: 'boost',
          layout: { x: 0, y: 0, w: 160, h: 56, zOrder: 0 },
          style: fullStyle,
          config: {
            type: 'gauge',
            displayStyle: 'arc',
            minValue: 0,
            maxValue: 2,
            dangerLevel: 1.8,
            decimalPlaces: 1,
            prefix: 'BOOST ',
            suffix: ' bar',
          },
        },
        {
          id: 'gear1',
          type: 'gear',
          signal: 'gear',
          layout: { x: 160, y: 0, w: 80, h: 112, zOrder: 0 },
          style: fullStyle,
          config: {
            type: 'gear',
            decimalPlaces: 0,
            prefix: 'G',
            suffix: '',
          },
        },
        {
          id: 'btn_long',
          type: 'button',
          signal: '',
          layout: { x: 0, y: 56, w: 160, h: 56, zOrder: 0 },
          style: fullStyle,
          config: {
            type: 'button',
            mode: 'single',
            label: 'Map',
            iconPath: '/icons/map.png',
            colors: { normal: '#FF4444', active: '#FF7777' },
            actions: [{ category: 'dashboard', type: 'navigate', pageId: 'p1' }],
          },
        },
        {
          id: 'img_long',
          type: 'image',
          signal: '',
          layout: { x: 160, y: 112, w: 160, h: 56, zOrder: 0 },
          style: fullStyle,
          config: { type: 'image', imagePath: '/images/logo.png' },
        },
      ],
    },
  ],
}

const migrateToCurrent = (fixture: Record<string, unknown>): Record<string, unknown> => {
  const { config: migrated } = migrateConfig(fixture, CURRENT_SCHEMA_VERSION)
  return migrated
}

const expectValid = (migrated: Record<string, unknown>): void => {
  const result = DashboardConfigSchema.safeParse(migrated)
  expect(result.success ? [] : result.error.issues).toEqual([])
  expect(result.success).toBe(true)
}

const widgetIds = (migrated: Record<string, unknown>, pageIndex: number): string[] => {
  const pages = migrated.pages as { widgets: { id: string }[] }[]
  return pages[pageIndex]!.widgets.map((w) => w.id)
}

describe('migration round-trip — a floor fixture validates against the current schema (#1709)', () => {
  it('migrates a representative 1.24.0 config into a valid current config', () => {
    const migrated = migrateToCurrent(floorDashboard1240)
    expect(migrated.version).toBe(CURRENT_SCHEMA_VERSION)
    expectValid(migrated)
  })

  it('converts its pixel layout to grid spans and strips the button icon', () => {
    const migrated = migrateToCurrent(floorDashboard1240)
    expect(widgetIds(migrated, 0)).toEqual(['boost_arc', 'gear1', 'btn_long', 'img_long'])
    const pages = migrated.pages as { widgets: Record<string, unknown>[] }[]
    const [gauge, , button] = pages[0]!.widgets
    expect(gauge!.layout).toEqual({ col: 0, colSpan: 6, row: 0, rowSpan: 3, zOrder: 0 })
    expect('iconPath' in (button!.config as Record<string, unknown>)).toBe(false)
  })

  it('a config already at the current version passes validation unchanged', () => {
    const migrated = migrateToCurrent(floorDashboard1240)
    const again = migrateToCurrent(migrated)
    expect(again).toEqual(migrated)
    expectValid(again)
  })

  it('refuses a config one release below the floor', () => {
    expect(() => migrateToCurrent({ ...floorDashboard1240, version: '1.23.0' })).toThrow(
      /older than 1\.24\.0/
    )
  })
})

describe('1.26.0 → 1.27.0 widget type ↔ config.type realignment (#20)', () => {
  const layout = { col: 0, colSpan: 4, row: 0, rowSpan: 4, zOrder: 0 }
  const imageConfig = { type: 'image', imagePath: '/images/logo.png' }

  const dashboardWith = (widgetType: string): Record<string, unknown> => ({
    version: '1.26.0',
    name: 'Divergent',
    defaultPageId: 'p1',
    revLimitRpm: 7000,
    topBar: { height: 30, bgColor: '#111111', textColor: '#FFFFFF' },
    pages: [
      {
        id: 'p1',
        backgroundImage: null,
        backgroundColor: '#000000',
        showTopBar: true,
        widgets: [
          {
            id: 'w1',
            type: widgetType,
            signal: '',
            layout,
            style: fullStyle,
            config: imageConfig,
          },
        ],
      },
    ],
  })

  const firstWidget = (config: Record<string, unknown>): Record<string, unknown> => {
    const pages = config.pages as { widgets: Record<string, unknown>[] }[]
    return pages[0]!.widgets[0]!
  }

  it('realigns a divergent top-level type to config.type and validates', () => {
    const migrated = migrateToCurrent(dashboardWith('gauge'))
    expect(migrated.version).toBe(CURRENT_SCHEMA_VERSION)
    expect(firstWidget(migrated).type).toBe('image')
    expectValid(migrated)
  })

  it('leaves an already-aligned widget untouched', () => {
    const migrated = migrateToCurrent(dashboardWith('image'))
    expect(firstWidget(migrated).type).toBe('image')
    expectValid(migrated)
  })
})

describe('1.28.0 → 1.29.0 track top bar', () => {
  const LEGACY_LAYOUT = [
    { type: 'label', text: 'CAN', position: 'left' },
    { type: 'statusDot', signal: 'any', position: 'left' },
    { type: 'modeFlag', signal: 'flag_anti_lag', text: 'ALS', position: 'center' },
    { type: 'separator', position: 'center' },
    { type: 'modeFlag', signal: 'flag_launch_ctrl', text: 'LC', position: 'center' },
    { type: 'separator', position: 'center' },
    { type: 'modeFlag', signal: 'flag_flat_shift', text: 'FS', position: 'center' },
    { type: 'separator', position: 'center' },
    { type: 'modeFlag', signal: 'flag_traction_cut', text: 'TC', position: 'center' },
    { type: 'signal', signal: 'map_number', format: 'MAP%.0f', position: 'right' },
    { type: 'separator', position: 'right' },
    { type: 'bleIcon', position: 'right' },
    { type: 'themeToggle', position: 'right' },
  ]

  const dashboardWithLayout = (layout: unknown): Record<string, unknown> => ({
    version: '1.28.0',
    name: 'Top bar',
    defaultPageId: 'p1',
    revLimitRpm: 7000,
    topBar: { height: 16, bgColor: '#0D0D0D', textColor: '#AAAAAA', layout },
    pages: [
      {
        id: 'p1',
        backgroundImage: null,
        backgroundColor: '#000000',
        palette: fullPalette,
        showTopBar: true,
        widgets: [],
      },
    ],
  })

  const layoutOf = (config: Record<string, unknown>): unknown =>
    (config.topBar as Record<string, unknown>).layout

  it('replaces the untouched legacy flag bar with the track bar', () => {
    const migrated = migrateToCurrent(dashboardWithLayout(LEGACY_LAYOUT))

    expect(layoutOf(migrated)).toEqual([
      { type: 'label', text: 'CAN', position: 'left' },
      { type: 'canRate', position: 'left' },
      { type: 'label', text: 'MAP', position: 'center' },
      { type: 'signal', signal: 'map_number', format: '%.0f', position: 'center' },
      { type: 'trackBadge', position: 'right' },
    ])
    expectValid(migrated)
  })

  it('leaves a customised bar alone', () => {
    const customised = LEGACY_LAYOUT.filter((item) => item.text !== 'TC')
    const migrated = migrateToCurrent(dashboardWithLayout(customised))

    expect(layoutOf(migrated)).toEqual(customised)
    expectValid(migrated)
  })

  it('leaves a bar that is already on the track layout alone', () => {
    const trackBar = [
      { type: 'label', text: 'CAN', position: 'left' },
      { type: 'canRate', position: 'left' },
      { type: 'label', text: 'MAP', position: 'center' },
      { type: 'signal', signal: 'map_number', format: '%.0f', position: 'center' },
      { type: 'trackBadge', position: 'right' },
    ]
    const migrated = migrateToCurrent(dashboardWithLayout(trackBar))

    expect(layoutOf(migrated)).toEqual(trackBar)
    expectValid(migrated)
  })

  it('tolerates a top bar with no layout at all', () => {
    const bare = dashboardWithLayout(undefined)
    delete (bare.topBar as Record<string, unknown>).layout
    const migrated = migrateToCurrent(bare)

    expect(layoutOf(migrated)).toBeUndefined()
    expectValid(migrated)
  })
})
