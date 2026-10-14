import { cloneAndStripForbiddenKeys } from '../migrations/config-traverse.js'
import { MigrationError } from '../migrations/errors.js'
import { cloneJsonWithoutForbiddenKeys, stripForbiddenKeys } from '../wire/plain-object.js'

const jsonRoundTrip = (value: Record<string, unknown>): unknown =>
  JSON.parse(JSON.stringify(value), stripForbiddenKeys)

const dashboardLike = (): Record<string, unknown> => ({
  version: '1.40.0',
  name: 'Track',
  pages: [
    {
      id: 'main',
      visible: true,
      widgets: [
        {
          id: 'rpm',
          type: 'gauge',
          signal: 'RPM',
          layout: { x: 0, y: 0, w: 4, h: 2 },
          config: { type: 'gauge', minValue: 0, maxValue: 8000, dangerBelow: false },
        },
      ],
    },
  ],
  signals: [{ name: 'RPM', scale: 0.25, offset: null }],
})

describe('cloneJsonWithoutForbiddenKeys — matches a JSON round-trip', () => {
  const shared = { id: 'shared' }
  const cases: Record<string, Record<string, unknown>> = {
    'a dashboard-shaped config': dashboardLike(),
    'undefined, functions and symbols in an object': {
      a: undefined,
      b: () => 1,
      c: Symbol('c'),
      d: 1,
    },
    'undefined, functions and holes in an array': {
      list: Object.assign(new Array<unknown>(5), {
        0: undefined,
        1: () => 1,
        2: Symbol('s'),
        4: 2,
      }),
    },
    'non-finite numbers': { nan: NaN, inf: Infinity, ninf: -Infinity, list: [NaN] },
    'a Date and a custom toJSON': {
      at: new Date(0),
      custom: { toJSON: (key: string) => ({ key, kept: true }) },
    },
    'forbidden keys at every depth': JSON.parse(
      '{"__proto__":{"x":1},"pages":[{"constructor":1,"prototype":2,"widgets":[{"__proto__":3,"id":"w"}]}]}'
    ) as Record<string, unknown>,
    'a reference shared by two siblings': { left: shared, right: shared },
  }

  for (const [name, input] of Object.entries(cases)) {
    it(`clones ${name}`, () => {
      expect(cloneJsonWithoutForbiddenKeys(input)).toStrictEqual(jsonRoundTrip(input))
    })
  }

  it('returns a copy that shares no object with its input', () => {
    const input = { pages: [{ widgets: [{ id: 'w' }] }] }
    const cloned = cloneJsonWithoutForbiddenKeys(input) as typeof input
    cloned.pages[0]!.widgets[0]!.id = 'changed'
    expect(input.pages[0]!.widgets[0]!.id).toBe('w')
  })

  it('never writes through to Object.prototype', () => {
    cloneJsonWithoutForbiddenKeys(
      JSON.parse('{"__proto__":{"polluted":true}}') as Record<string, unknown>
    )
    expect(({} as Record<string, unknown>).polluted).toBeUndefined()
  })
})

describe('cloneAndStripForbiddenKeys — values JSON cannot carry', () => {
  it('rejects a cycle with a typed not_serializable error', () => {
    const config: Record<string, unknown> = { version: '1.0.0', pages: [] }
    ;(config.pages as unknown[]).push({ parent: config })
    expect(() => cloneAndStripForbiddenKeys(config)).toThrow(
      new MigrationError(
        'not_serializable',
        'Invalid config: not serializable to JSON (cyclic structure)'
      )
    )
  })

  it('rejects a BigInt with a typed not_serializable error', () => {
    expect(() => cloneAndStripForbiddenKeys({ version: '1.0.0', id: 1n })).toThrow(MigrationError)
  })
})
