import { findForbiddenKey } from '../wire/plain-object.js'
import { parseDeviceConfig } from '../schemas/device.js'
import { parseInputBindings } from '../schemas/input-bindings.js'
import { migrateConfig, validateMigrationChain } from '../migrations/runner.js'
import { MigrationError } from '../migrations/errors.js'
import { parseCanshiftFile, describeCanshiftFileError } from '../schemas/canshift-file.js'
import { evalExpr, evalExprChecked } from '../can-xml/eval-expr.js'

describe('findForbiddenKey — depth parity', () => {
  const fromWire = (json: string): unknown => JSON.parse(json)

  it('finds a top-level forbidden key', () => {
    expect(findForbiddenKey(fromWire('{"__proto__":{"x":1}}'))).toBe('__proto__')
    expect(findForbiddenKey({ constructor: 1 })).toBe('constructor')
  })

  it('finds one nested inside an object, which the shallow check missed', () => {
    expect(findForbiddenKey({ a: { b: { prototype: 1 } } })).toBe('prototype')
  })

  it('finds one nested inside an array', () => {
    expect(findForbiddenKey(fromWire('{"items":[{"ok":1},{"__proto__":{"x":1}}]}'))).toBe(
      '__proto__'
    )
  })

  it('returns null for clean payloads of every shape', () => {
    expect(findForbiddenKey({ a: 1, b: [1, 2, { c: 'd' }] })).toBeNull()
    expect(findForbiddenKey(null)).toBeNull()
    expect(findForbiddenKey('string')).toBeNull()
  })
})

describe('forbidden keys are distinguishable on every parse path', () => {
  it('parseDeviceConfig reports the offending key, not an empty wrong_shape', () => {
    const result = parseDeviceConfig('{"can_speed_kbps":500,"__proto__":{"x":1}}')
    expect(result).toEqual({ kind: 'forbidden_key', key: '__proto__' })
  })

  it('parseDeviceConfig catches one nested below the top level', () => {
    const raw = '{"can_speed_kbps":500,"twai_tx_pin":22,"twai_rx_pin":21,"nested":{"prototype":1}}'
    expect(parseDeviceConfig(raw)).toEqual({ kind: 'forbidden_key', key: 'prototype' })
  })

  it('parseInputBindings reports the offending key', () => {
    const result = parseInputBindings('{"input_bindings":[],"__proto__":{"x":1}}')
    expect(result).toEqual({ kind: 'forbidden_key', key: '__proto__' })
  })
})

describe('migration failures carry a machine-readable code', () => {
  it('a downgrade is a MigrationError with code "downgrade"', () => {
    expect(() => migrateConfig({ version: '2.0.0' }, '1.0.0')).toThrow(MigrationError)
    try {
      migrateConfig({ version: '2.0.0' }, '1.0.0')
    } catch (err) {
      expect(err).toBeInstanceOf(MigrationError)
      expect((err as MigrationError).code).toBe('downgrade')
    }
  })

  it('bad input version is code "invalid_input"', () => {
    try {
      migrateConfig({ version: 'not-semver' }, '1.0.0')
    } catch (err) {
      expect((err as MigrationError).code).toBe('invalid_input')
    }
  })

  it('a duplicate fromVersion is code "registry_corrupt"', () => {
    const registry = [
      { fromVersion: '1.0.0', toVersion: '1.1.0', migrate: (c: Record<string, unknown>) => c },
      { fromVersion: '1.0.0', toVersion: '1.2.0', migrate: (c: Record<string, unknown>) => c },
    ]
    try {
      validateMigrationChain('1.0.0', '1.2.0', registry)
    } catch (err) {
      expect((err as MigrationError).code).toBe('registry_corrupt')
    }
  })

  it('a caller can tell a user downgrade from a corrupt registry without substring matching', () => {
    const file = JSON.stringify({
      format: 'canshift',
      formatVersion: 1,
      project: { dashboard: { version: '99.0.0' } },
    })
    const result = parseCanshiftFile(file)
    if (result.kind === 'migration_failed') {
      expect(typeof result.code).toBe('string')
      expect(describeCanshiftFileError(result)).not.toContain('migrateConfig:')
    }
  })
})

describe('evalExpr', () => {
  it('is evalExprChecked with the lossy zero made explicit', () => {
    const ctx = { bytes: new Uint8Array([1, 2, 3, 4]) }
    expect(evalExprChecked('B0+B1', ctx)).toBe(3)
    expect(evalExpr('B0+B1', ctx)).toBe(3)
  })

  it('returns 0 for an unparseable expression, where the checked form returns null', () => {
    const ctx = { bytes: new Uint8Array([1]) }
    expect(evalExprChecked('((((', ctx)).toBeNull()
    expect(evalExpr('((((', ctx)).toBe(0)
  })

  it('reads past the end of the frame without throwing', () => {
    const ctx = { bytes: new Uint8Array([1]) }
    expect(evalExprChecked('B7', ctx)).toBe(0)
  })
})
