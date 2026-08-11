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

const legacyDashboard100: Record<string, unknown> = {
  version: '1.0.0',
  name: 'Legacy Dash',
  defaultPageId: 'p1',
  revLimitRpm: 7000,
  topBar: {
    height: 24,
    bgColor: '#0D0D0D',
    textColor: '#AAAAAA',
    showMapName: true,
    showMapProfile: false,
  },
  pages: [
    {
      id: 'p1',
      name: 'Main',
      backgroundImage: null,
      backgroundColor: '#000000',
      showTopBar: true,
      widgets: [
        {
          id: 'btn_nav',
          type: 'button',
          signal: '',
          layout: { x: 0, y: 0, w: 160, h: 56, zOrder: 0 },
          style: fullStyle,
          config: { type: 'button', label: 'Engine', targetPageId: 'p2' },
        },
        {
          id: 'btn_dead',
          type: 'button',
          signal: '',
          layout: { x: 160, y: 0, w: 160, h: 56, zOrder: 0 },
          style: fullStyle,
          config: { type: 'button', label: 'Aux' },
        },
        {
          id: 'lbl_rpm',
          type: 'label',
          signal: 'rpm',
          layout: { x: 0, y: 56, w: 160, h: 56, zOrder: 0 },
          style: fullStyle,
          config: { decimalPlaces: 0, suffix: ' rpm' },
        },
        {
          id: 'gear1',
          type: 'gear',
          signal: 'gear',
          layout: { x: 160, y: 56, w: 80, h: 112, zOrder: 1 },
          style: fullStyle,
          config: { type: 'gear', decimalPlaces: 0 },
        },
        {
          id: 'coolant_arc',
          type: 'gauge',
          signal: 'coolant',
          layout: { x: 0, y: 112, w: 160, h: 56, zOrder: 0 },
          style: fullStyle,
          config: {
            type: 'gauge',
            minValue: 0,
            maxValue: 120,
            warningLevel: 100,
            dangerLevel: 110,
            decimalPlaces: 0,
          },
        },
        {
          id: 'tps_bar',
          type: 'gauge',
          signal: 'tps',
          layout: { x: 0, y: 196, w: 320, h: 28, zOrder: 0 },
          style: fullStyle,
          config: {
            type: 'gauge',
            displayStyle: 'bar',
            barOrientation: 'horizontal',
            minValue: 0,
            maxValue: 100,
            warningLevel: 70,
            dangerLevel: 90,
            decimalPlaces: 0,
          },
        },
      ],
    },
    {
      id: 'p2',
      name: 'Aux',
      backgroundImage: null,
      backgroundColor: '#111111',
      showTopBar: false,
      widgets: [
        {
          id: 'warn_oil',
          type: 'warning',
          signal: 'oil_pressure',
          layout: { x: 240, y: 0, w: 80, h: 56, zOrder: 0 },
          style: fullStyle,
          config: { type: 'warning', threshold: 1 },
        },
      ],
    },
  ],
}

const midDashboard1160: Record<string, unknown> = {
  version: '1.16.0',
  name: 'Mid Dash',
  defaultPageId: 'p1',
  revLimitRpm: 7200,
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
          id: 'btn_dead',
          type: 'button',
          signal: '',
          layout: { x: 0, y: 0, w: 160, h: 56, zOrder: 0 },
          style: fullStyle,
          config: {
            type: 'button',
            label: 'Dead',
            colors: { normal: '#FF4444', active: '#FF7777' },
            actions: [],
          },
        },
        {
          id: 'btn_map',
          type: 'button',
          signal: '',
          layout: { x: 160, y: 0, w: 160, h: 56, zOrder: 0 },
          style: fullStyle,
          config: {
            type: 'button',
            label: 'Map 2',
            colors: { normal: '#FF4444', active: '#FF7777' },
            actions: [{ category: 'ecu', type: 'map_switch', mapIndex: 1 }],
          },
        },
        {
          id: 'boost_bar',
          type: 'bar',
          signal: 'boost',
          layout: { x: 0, y: 56, w: 160, h: 56, zOrder: 0 },
          style: fullStyle,
          config: { type: 'bar', minValue: 0, maxValue: 2, decimalPlaces: 1 },
        },
        {
          id: 'rpm_arc',
          type: 'gauge',
          signal: 'rpm',
          layout: { x: 0, y: 112, w: 160, h: 56, zOrder: 0 },
          style: fullStyle,
          config: {
            type: 'gauge',
            displayStyle: 'arc',
            minValue: 0,
            maxValue: 8000,
            warningLevel: 6500,
            dangerLevel: 7000,
            decimalPlaces: 0,
            hideWhenInvalid: true,
            label: 'RPM',
            labelPosition: 'bottom',
          },
        },
      ],
    },
  ],
}

const lateDashboard1110: Record<string, unknown> = {
  version: '1.11.0',
  name: 'Late Dash',
  defaultPageId: 'p1',
  revLimitRpm: 8000,
  topBar: { height: 24, bgColor: '#0D0D0D', textColor: '#AAAAAA' },
  pages: [
    {
      id: 'p1',
      backgroundImage: null,
      backgroundColor: '#000000',
      palette: fullPalette,
      showTopBar: true,
      widgets: [
        {
          id: 'btn_nav',
          type: 'button',
          signal: '',
          layout: { x: 0, y: 0, w: 160, h: 56, zOrder: 0 },
          style: fullStyle,
          config: {
            type: 'button',
            label: 'Home',
            colors: { normal: '#FF4444', active: '#FF7777' },
            actions: [{ category: 'dashboard', type: 'navigate', pageId: 'p1' }],
          },
        },
        {
          id: 'coolant_arc',
          type: 'gauge',
          signal: 'coolant',
          layout: { x: 160, y: 0, w: 160, h: 56, zOrder: 0 },
          style: fullStyle,
          config: {
            type: 'gauge',
            displayStyle: 'arc',
            minValue: 0,
            maxValue: 120,
            dangerLevel: 110,
            decimalPlaces: 0,
          },
        },
      ],
    },
  ],
}

const preCapsDashboard1230: Record<string, unknown> = {
  version: '1.23.0',
  name: 'Pre-caps Dash',
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
            showNeedle: true,
            prefix: 'BOOST PRESSURE ',
            suffix: ' bar (manifold, absolute)',
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
            prefix: 'currently in gear ',
            suffix: ' of six forward gears',
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
            label: 'An exceedingly verbose button label well past thirty-one chars',
            iconPath: `/icons/${'x'.repeat(80)}.png`,
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
          config: { type: 'image', imagePath: `/images/${'y'.repeat(80)}.png` },
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

describe('migration round-trip — old fixtures validate against the current schema (#1709)', () => {
  it('migrates a representative 1.0.0 config into a valid current config', () => {
    const migrated = migrateToCurrent(legacyDashboard100)
    expect(migrated.version).toBe(CURRENT_SCHEMA_VERSION)
    expectValid(migrated)
  })

  it('drops the action-less 1.0.0 button instead of emitting actions: []', () => {
    const migrated = migrateToCurrent(legacyDashboard100)
    expect(widgetIds(migrated, 0)).toEqual([
      'btn_nav',
      'lbl_rpm',
      'gear1',
      'coolant_arc',
      'tps_bar',
    ])
  })

  it('migrates a representative 1.16.0 config into a valid current config', () => {
    const migrated = migrateToCurrent(midDashboard1160)
    expect(migrated.version).toBe(CURRENT_SCHEMA_VERSION)
    expectValid(migrated)
  })

  it('drops the empty-actions 1.16.0 button and the deprecated bar widget', () => {
    const migrated = migrateToCurrent(midDashboard1160)
    expect(widgetIds(migrated, 0)).toEqual(['btn_map', 'rpm_arc'])
  })

  it('migrates a representative 1.11.0 config into a valid current config', () => {
    const migrated = migrateToCurrent(lateDashboard1110)
    expect(migrated.version).toBe(CURRENT_SCHEMA_VERSION)
    expectValid(migrated)
  })

  it('migrates a representative 1.23.0 config into a valid current config', () => {
    const migrated = migrateToCurrent(preCapsDashboard1230)
    expect(migrated.version).toBe(CURRENT_SCHEMA_VERSION)
    expectValid(migrated)
  })

  it('1.23.0 → 1.24.0 drops showNeedle and truncates strings to firmware caps', () => {
    const migrated = migrateToCurrent(preCapsDashboard1230)
    const pages = migrated.pages as { widgets: { config: Record<string, unknown> }[] }[]
    const [gauge, gear, button, image] = pages[0]!.widgets.map((w) => w.config)

    expect(gauge).not.toHaveProperty('showNeedle')
    expect(gauge!.prefix).toBe('BOOST P')
    expect(gauge!.suffix).toBe(' bar (manifold,')

    expect(gear!.prefix).toBe('currently in ge')
    expect(gear!.suffix).toBe(' of six forward')

    expect(button!.label).toBe('An exceedingly verbose button l')
    expect('iconPath' in button!).toBe(false)

    expect((image!.imagePath as string).length).toBe(63)
  })

  it('a config already at the current version passes validation unchanged', () => {
    const migrated = migrateToCurrent(lateDashboard1110)
    const again = migrateToCurrent(migrated)
    expect(again).toEqual(migrated)
    expectValid(again)
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
