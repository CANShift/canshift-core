import {
  BUILTIN_MIGRATIONS,
  MIGRATION_FLOOR_VERSION,
  MigrationError,
  migrateConfig,
} from '../migrations/index.js'
import { assertVersionBump } from '../migrations/runner.js'
import { isSemverGreater } from '../migrations/semver.js'
import { CURRENT_SCHEMA_VERSION } from '../index.js'
import { GaugeWidgetConfigSchema } from '../schemas/widgets/gauge.js'

describe('migrateConfig — no migration needed', () => {
  it('returns config unchanged when already at target version', () => {
    const config = { version: '1.30.0', name: 'Test', pages: [] }
    const result = migrateConfig(config, '1.30.0')
    expect(result.applied).toHaveLength(0)
    expect(result.config).toEqual(config)
  })

  it('throws a typed boundary error on a circular config (audit C-LO-6)', () => {
    interface Cyclic extends Record<string, unknown> {
      self?: Cyclic
    }
    const config: Cyclic = { version: '1.24.0' }
    config.self = config
    expect(() => migrateConfig(config, '1.25.0')).toThrow(/not serializable to JSON/i)
  })
})

describe('migrateConfig — 1.24.0 → 1.25.0 (pixel layout → 12-column spans, #1820)', () => {
  const wrap = (
    widgets: Record<string, unknown>[],
    pageOverrides: Record<string, unknown> = {},
    configOverrides: Record<string, unknown> = {}
  ): Record<string, unknown> => ({
    version: '1.24.0',
    topBar: { height: 16, bgColor: '#0D0D0D', textColor: '#AAAAAA' },
    pages: [{ id: 'p1', showTopBar: true, widgets, ...pageOverrides }],
    ...configOverrides,
  })

  const layoutOf = (config: Record<string, unknown>, index = 0): Record<string, unknown> => {
    const { config: out } = migrateConfig(config, '1.25.0')
    const page = (out.pages as Record<string, unknown>[])[0]!
    const widgets = page.widgets as Record<string, unknown>[]
    return widgets[index]!.layout as Record<string, unknown>
  }

  const pixelWidget = (layout: Record<string, unknown>): Record<string, unknown> => ({
    id: 'w1',
    type: 'gauge',
    signal: 'rpm',
    layout,
  })

  it('bumps the version and reports the step', () => {
    const { config: out, applied } = migrateConfig(wrap([]), '1.25.0')
    expect(out.version).toBe('1.25.0')
    expect(applied).toEqual(['1.24.0 → 1.25.0'])
  })

  it('converts a half-width top-left widget on the 224 px area below a 16 px top bar', () => {
    expect(layoutOf(wrap([pixelWidget({ x: 0, y: 0, w: 160, h: 112, zOrder: 0 })]))).toEqual({
      col: 0,
      colSpan: 6,
      row: 0,
      rowSpan: 6,
      zOrder: 0,
    })
  })

  it('converts the right half; a legacy 56 px quarter spans 4 tracks (renders 56 px again)', () => {
    expect(layoutOf(wrap([pixelWidget({ x: 160, y: 112, w: 160, h: 56, zOrder: 2 })]))).toEqual({
      col: 6,
      colSpan: 6,
      row: 6,
      rowSpan: 3,
      zOrder: 2,
    })
  })

  it('maps a widget starting at the frame padding to column 0', () => {
    expect(layoutOf(wrap([pixelWidget({ x: 16, y: 16, w: 138, h: 39, zOrder: 0 })]))).toEqual({
      col: 0,
      colSpan: 6,
      row: 0,
      rowSpan: 3,
      zOrder: 0,
    })
  })

  it('converts a full-width strip to a 12-column span', () => {
    expect(layoutOf(wrap([pixelWidget({ x: 0, y: 168, w: 320, h: 56, zOrder: 0 })]))).toEqual({
      col: 0,
      colSpan: 12,
      row: 9,
      rowSpan: 3,
      zOrder: 0,
    })
  })

  it('uses the full 240 px area when the page hides the top bar', () => {
    expect(
      layoutOf(
        wrap([pixelWidget({ x: 0, y: 120, w: 320, h: 120, zOrder: 0 })], { showTopBar: false })
      )
    ).toEqual({ col: 0, colSpan: 12, row: 6, rowSpan: 6, zOrder: 0 })
  })

  it('rounds edges to the nearest track and ties round up', () => {
    expect(layoutOf(wrap([pixelWidget({ x: 0, y: 196, w: 320, h: 28, zOrder: 0 })]))).toEqual({
      col: 0,
      colSpan: 12,
      row: 11,
      rowSpan: 1,
      zOrder: 0,
    })
  })

  it('keeps at least a 1-track span for tiny widgets', () => {
    expect(layoutOf(wrap([pixelWidget({ x: 0, y: 0, w: 10, h: 10, zOrder: 0 })]))).toEqual({
      col: 0,
      colSpan: 1,
      row: 0,
      rowSpan: 1,
      zOrder: 0,
    })
  })

  it('clamps widgets that overflowed the legacy canvas back into the grid', () => {
    expect(layoutOf(wrap([pixelWidget({ x: 300, y: 230, w: 100, h: 100, zOrder: 0 })]))).toEqual({
      col: 11,
      colSpan: 1,
      row: 11,
      rowSpan: 1,
      zOrder: 0,
    })
  })

  it('defaults a missing zOrder to 0', () => {
    expect(layoutOf(wrap([pixelWidget({ x: 0, y: 0, w: 160, h: 56 })]))).toEqual({
      col: 0,
      colSpan: 6,
      row: 0,
      rowSpan: 3,
      zOrder: 0,
    })
  })

  it('leaves widgets with a malformed layout untouched', () => {
    const widget = pixelWidget({ x: 'oops', y: 0, w: 160, h: 56, zOrder: 0 })
    const { config: out } = migrateConfig(wrap([widget]), '1.25.0')
    const page = (out.pages as Record<string, unknown>[])[0]!
    expect((page.widgets as Record<string, unknown>[])[0]).toEqual(widget)
  })

  it('leaves widgets without a layout object untouched', () => {
    const widget = { id: 'w1', type: 'gauge', signal: 'rpm' }
    const { config: out } = migrateConfig(wrap([widget]), '1.25.0')
    const page = (out.pages as Record<string, unknown>[])[0]!
    expect((page.widgets as Record<string, unknown>[])[0]).toEqual(widget)
  })

  it('treats a missing top bar height as 0', () => {
    expect(
      layoutOf(wrap([pixelWidget({ x: 0, y: 120, w: 320, h: 120, zOrder: 0 })], {}, { topBar: {} }))
    ).toEqual({ col: 0, colSpan: 12, row: 6, rowSpan: 6, zOrder: 0 })
  })
})

describe('migrateConfig — 1.29.0 → 1.30.0 (drop gauge arcFillStyle, spec-strict fills)', () => {
  const wrap = (widgetConfig: Record<string, unknown>): Record<string, unknown> => ({
    version: '1.29.0',
    pages: [
      {
        id: 'p1',
        widgets: [{ id: 'g1', type: 'gauge', signal: 'rpm', config: widgetConfig }],
      },
    ],
  })

  const configOf = (config: Record<string, unknown>): Record<string, unknown> => {
    const { config: out } = migrateConfig(config, '1.30.0')
    const page = (out.pages as Record<string, unknown>[])[0]!
    const widgets = page.widgets as Record<string, unknown>[]
    return widgets[0]!.config as Record<string, unknown>
  }

  it('bumps the version and reports the step', () => {
    const { config: out, applied } = migrateConfig({ version: '1.29.0', pages: [] }, '1.30.0')
    expect(out.version).toBe('1.30.0')
    expect(applied).toEqual(['1.29.0 → 1.30.0'])
  })

  it.each(['ink', 'zones', 'gradient'])('strips arcFillStyle "%s"', (style) => {
    const cfg = configOf(wrap({ type: 'gauge', displayStyle: 'arc', arcFillStyle: style }))
    expect('arcFillStyle' in cfg).toBe(false)
    expect(cfg.displayStyle).toBe('arc')
  })

  it('leaves gauges without arcFillStyle untouched', () => {
    const cfg = configOf(wrap({ type: 'gauge', displayStyle: 'numeric', minValue: 0 }))
    expect(cfg).toEqual({ type: 'gauge', displayStyle: 'numeric', minValue: 0 })
  })
})

describe('migrateConfig — 1.30.0 → 1.31.0 (no icons on the dash: strip button icon fields)', () => {
  const wrap = (widgetConfig: Record<string, unknown>): Record<string, unknown> => ({
    version: '1.30.0',
    pages: [
      {
        id: 'p1',
        widgets: [{ id: 'b1', type: 'button', config: widgetConfig }],
      },
    ],
  })

  const configOf = (config: Record<string, unknown>): Record<string, unknown> => {
    const { config: out } = migrateConfig(config, '1.31.0')
    const page = (out.pages as Record<string, unknown>[])[0]!
    const widgets = page.widgets as Record<string, unknown>[]
    return widgets[0]!.config as Record<string, unknown>
  }

  it('strips iconName / iconPath / showIcon from button configs', () => {
    const cfg = configOf(
      wrap({
        type: 'button',
        mode: 'single',
        label: 'ALS',
        iconName: 'flame',
        iconPath: '/icons/als.bin',
        showIcon: true,
        actions: [],
      })
    )
    expect('iconName' in cfg).toBe(false)
    expect('iconPath' in cfg).toBe(false)
    expect('showIcon' in cfg).toBe(false)
    expect(cfg.label).toBe('ALS')
  })

  it('strips iconName from cycle states and leaves other state fields', () => {
    const cfg = configOf(
      wrap({
        type: 'button',
        mode: 'cycle',
        label: 'MAP',
        states: [
          { label: 'MAP 1', iconName: 'map_icon', action: { category: 'can', type: 'noop' } },
          { label: 'MAP 2', action: { category: 'can', type: 'noop' } },
        ],
        initialActiveIndex: 0,
      })
    )
    const states = cfg.states as Record<string, unknown>[]
    expect('iconName' in states[0]!).toBe(false)
    expect(states[0]!.label).toBe('MAP 1')
    expect(states[1]!.label).toBe('MAP 2')
  })

  it('leaves non-button widgets untouched', () => {
    const config = {
      version: '1.30.0',
      pages: [
        {
          id: 'p1',
          widgets: [{ id: 'g1', type: 'gauge', config: { type: 'gauge', iconName: 'coolant' } }],
        },
      ],
    }
    const { config: out } = migrateConfig(config, '1.31.0')
    const page = (out.pages as Record<string, unknown>[])[0]!
    const widgets = page.widgets as Record<string, unknown>[]
    expect((widgets[0]!.config as Record<string, unknown>).iconName).toBe('coolant')
  })
})

describe('migrateConfig — the 1.24.0 floor', () => {
  const codeOf = (version: string): string | undefined => {
    try {
      migrateConfig({ version, pages: [] }, CURRENT_SCHEMA_VERSION)
      return undefined
    } catch (err) {
      return err instanceof MigrationError ? err.code : 'untyped'
    }
  }

  it('sits at 1.24.0', () => {
    expect(MIGRATION_FLOOR_VERSION).toBe('1.24.0')
  })

  it('refuses every config older than the floor with a typed below_floor error', () => {
    for (const version of ['0.5.0', '1.0.0', '1.15.0', '1.23.0', '1.23.9']) {
      expect(codeOf(version)).toBe('below_floor')
    }
  })

  it('names both versions in the message', () => {
    expect(() => migrateConfig({ version: '1.23.0' }, CURRENT_SCHEMA_VERSION)).toThrow(
      /1\.23\.0 is older than 1\.24\.0/
    )
  })

  it('still upgrades a config sitting exactly on the floor', () => {
    expect(codeOf('1.24.0')).toBeUndefined()
  })
})

describe('migrateConfig — version-only releases need no registry entry', () => {
  it('jumps a version-only gap straight to the next shape change', () => {
    const { config: out, applied } = migrateConfig({ version: '1.33.0', pages: [] }, '1.40.0')
    expect(out.version).toBe('1.40.0')
    expect(applied).toEqual(['1.33.0 → 1.37.0', '1.37.0 → 1.40.0'])
  })

  it('bumps the version alone when no shape change lies between', () => {
    const { applied } = migrateConfig({ version: '1.37.0', pages: [] }, '1.39.0')
    expect(applied).toEqual(['1.37.0 → 1.39.0'])
  })

  it('walks a floor config to current through every shape change, in order', () => {
    const { config: out, applied } = migrateConfig(
      { version: '1.24.0', pages: [] },
      CURRENT_SCHEMA_VERSION
    )
    expect(out.version).toBe(CURRENT_SCHEMA_VERSION)
    expect(applied).toEqual([
      '1.24.0 → 1.25.0',
      '1.25.0 → 1.27.0',
      '1.27.0 → 1.29.0',
      '1.29.0 → 1.30.0',
      '1.30.0 → 1.31.0',
      '1.31.0 → 1.37.0',
      '1.37.0 → 1.40.0',
      `1.40.0 → ${CURRENT_SCHEMA_VERSION}`,
    ])
  })

  it('stops at an intermediate target without running later steps', () => {
    const { applied } = migrateConfig({ version: '1.28.0', pages: [] }, '1.30.0')
    expect(applied).toEqual(['1.28.0 → 1.29.0', '1.29.0 → 1.30.0'])
  })
})

describe('BUILTIN_MIGRATIONS', () => {
  it('moves the version forward on every step', () => {
    for (const step of BUILTIN_MIGRATIONS) {
      expect(isSemverGreater(step.toVersion, step.fromVersion)).toBe(true)
    }
  })

  it('is ordered oldest first with no overlapping steps', () => {
    for (let i = 1; i < BUILTIN_MIGRATIONS.length; i += 1) {
      const previous = BUILTIN_MIGRATIONS[i - 1]!
      const step = BUILTIN_MIGRATIONS[i]!
      expect(isSemverGreater(previous.toVersion, step.fromVersion)).toBe(false)
    }
  })

  it('starts at the floor and never passes CURRENT_SCHEMA_VERSION', () => {
    expect(BUILTIN_MIGRATIONS[0]!.fromVersion).toBe(MIGRATION_FLOOR_VERSION)
    const last = BUILTIN_MIGRATIONS[BUILTIN_MIGRATIONS.length - 1]!
    expect(isSemverGreater(last.toVersion, CURRENT_SCHEMA_VERSION)).toBe(false)
  })
})

describe('migrateConfig — downgrade detection', () => {
  it('throws "downgrade not supported" when currentVersion > targetVersion', () => {
    const config = { version: '1.22.0' }
    expect(() => migrateConfig(config, '1.18.0')).toThrow(/downgrade not supported/)
    expect(() => migrateConfig(config, '1.18.0')).toThrow(/1\.22\.0 → 1\.18\.0/)
  })

  it('downgrade error is NOT a floor error', () => {
    expect(() => migrateConfig({ version: '1.22.0' }, '1.18.0')).not.toThrow(/older than/)
  })

  it('detects minor-version downgrade (1.20.0 → 1.18.0)', () => {
    expect(() => migrateConfig({ version: '1.20.0' }, '1.18.0')).toThrow(/downgrade not supported/)
  })

  it('detects patch-version downgrade (1.18.1 → 1.18.0)', () => {
    expect(() => migrateConfig({ version: '1.18.1' }, '1.18.0')).toThrow(/downgrade not supported/)
  })

  it('detects major-version downgrade (2.0.0 → 1.18.0)', () => {
    expect(() => migrateConfig({ version: '2.0.0' }, '1.18.0')).toThrow(/downgrade not supported/)
  })

  it('does not flag same-version as a downgrade', () => {
    expect(() => migrateConfig({ version: '1.18.0' }, '1.18.0')).not.toThrow()
  })
})

describe('migrateConfig — input isolation', () => {
  it('does not mutate nested objects on the caller', () => {
    const page = { id: 'p1', widgets: [] as Record<string, unknown>[] }
    const config = { version: '1.24.0', pages: [page] }
    const snapshot = JSON.parse(JSON.stringify(config)) as typeof config

    migrateConfig(config, '1.25.0')

    expect(config).toEqual(snapshot)
    expect(config.pages[0]).toBe(page)
    expect(page.widgets).toEqual([])
  })

  it('returned config is independent of the input', () => {
    const config = { version: '1.24.0', pages: [{ id: 'p1', widgets: [] }] }
    const { config: out } = migrateConfig(config, '1.25.0')
    expect(out).not.toBe(config)
    expect((out as { pages: unknown[] }).pages).not.toBe(config.pages)
  })
})

describe('migrateConfig — 1.39.0 → 1.40.0 (drop the gauge alertThreshold that armed nothing)', () => {
  const wrap = (widgetConfig: Record<string, unknown>): Record<string, unknown> => ({
    version: '1.39.0',
    pages: [
      {
        id: 'p1',
        widgets: [{ id: 'g1', type: 'gauge', signal: 'coolant_temp_c', config: widgetConfig }],
      },
    ],
  })

  const configOf = (config: Record<string, unknown>): Record<string, unknown> => {
    const { config: out } = migrateConfig(config, '1.40.0')
    const page = (out.pages as Record<string, unknown>[])[0]!
    const widgets = page.widgets as Record<string, unknown>[]
    return widgets[0]!.config as Record<string, unknown>
  }

  it('bumps the version and reports the step', () => {
    const { config: out, applied } = migrateConfig({ version: '1.39.0', pages: [] }, '1.40.0')
    expect(out.version).toBe('1.40.0')
    expect(applied).toEqual(['1.39.0 → 1.40.0'])
  })

  it('strips alertThreshold and keeps every sibling field', () => {
    const cfg = configOf(
      wrap({
        type: 'gauge',
        displayStyle: 'arc',
        minValue: 0,
        maxValue: 140,
        dangerLevel: 105,
        alertThreshold: 98,
      })
    )
    expect('alertThreshold' in cfg).toBe(false)
    expect(cfg).toEqual({
      type: 'gauge',
      displayStyle: 'arc',
      minValue: 0,
      maxValue: 140,
      dangerLevel: 105,
    })
  })

  it('leaves dangerLevel alone — the widget colour threshold is not the one being dropped', () => {
    const cfg = configOf(
      wrap({ type: 'gauge', displayStyle: 'numeric', dangerLevel: 1.0, dangerBelow: true })
    )
    expect(cfg.dangerLevel).toBe(1.0)
    expect(cfg.dangerBelow).toBe(true)
  })

  it('leaves a gauge without alertThreshold untouched', () => {
    const cfg = configOf(wrap({ type: 'gauge', displayStyle: 'numeric', minValue: 0 }))
    expect(cfg).toEqual({ type: 'gauge', displayStyle: 'numeric', minValue: 0 })
  })

  it('strips it from every gauge on every page, not just the first', () => {
    const config = {
      version: '1.39.0',
      pages: [
        {
          id: 'p1',
          widgets: [
            { id: 'g1', type: 'gauge', config: { type: 'gauge', alertThreshold: 1 } },
            { id: 'g2', type: 'gauge', config: { type: 'gauge', alertThreshold: 2 } },
          ],
        },
        {
          id: 'p2',
          widgets: [{ id: 'g3', type: 'gauge', config: { type: 'gauge', alertThreshold: 3 } }],
        },
      ],
    }
    const { config: out } = migrateConfig(config, '1.40.0')
    const every = (out.pages as Record<string, unknown>[]).flatMap(
      (page) => page.widgets as Record<string, unknown>[]
    )
    expect(every).toHaveLength(3)
    for (const widget of every) {
      expect('alertThreshold' in (widget.config as Record<string, unknown>)).toBe(false)
    }
  })

  it('a migrated config validates against the strict gauge schema', () => {
    const cfg = configOf(
      wrap({
        type: 'gauge',
        displayStyle: 'arc',
        minValue: 0,
        maxValue: 8000,
        dangerLevel: 7200,
        decimalPlaces: 0,
        alertThreshold: 7000,
      })
    )
    expect(GaugeWidgetConfigSchema.safeParse(cfg).success).toBe(true)
  })

  it('the strict gauge schema now rejects alertThreshold outright', () => {
    const withField = {
      type: 'gauge',
      displayStyle: 'arc',
      minValue: 0,
      maxValue: 8000,
      dangerLevel: 7200,
      decimalPlaces: 0,
      alertThreshold: 7000,
    }
    expect(GaugeWidgetConfigSchema.safeParse(withField).success).toBe(false)
  })
})

describe('migrateConfig — 1.40.0 → 1.41.0 (per-widget kicker and warn tier, the critical alert)', () => {
  it('bumps the version and leaves every field as it was — the new fields are optional', () => {
    const config = {
      version: '1.40.0',
      pages: [
        {
          id: 'p1',
          widgets: [
            {
              id: 'g1',
              type: 'gauge',
              config: { type: 'gauge', dangerLevel: 1.0, dangerBelow: true },
            },
          ],
        },
      ],
    }
    const { config: out, applied } = migrateConfig(config, '1.41.0')
    expect(applied).toEqual(['1.40.0 → 1.41.0'])
    expect(out).toEqual({ ...config, version: '1.41.0' })
  })
})

describe('migrateConfig — 1.41.0 → 1.42.0 (CAN page buttons)', () => {
  it('bumps the version and leaves every field as it was — pageButtons is optional', () => {
    const config = { version: '1.41.0', pages: [{ id: 'p1', widgets: [] }] }
    const { config: out, applied } = migrateConfig(config, '1.42.0')
    expect(applied).toEqual(['1.41.0 → 1.42.0'])
    expect(out).toEqual({ ...config, version: '1.42.0' })
  })
})

describe('assertVersionBump (#1647)', () => {
  it('throws when a migration forgets to bump version', () => {
    expect(() => {
      assertVersionBump('1.0.0', '1.0.0', '1.1.0')
    }).toThrow(/did not set version/)
  })

  it('reports a non-string produced version', () => {
    expect(() => {
      assertVersionBump(undefined, '1.0.0', '1.1.0')
    }).toThrow(/got undefined/)
  })

  it('passes when the produced version matches toVersion', () => {
    expect(() => {
      assertVersionBump('1.1.0', '1.0.0', '1.1.0')
    }).not.toThrow()
  })
})
