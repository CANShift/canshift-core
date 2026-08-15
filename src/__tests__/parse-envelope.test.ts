import {
  describeWireParseFailure,
  parseJsonObject,
  parseUntrustedJsonObject,
  type WireParseFailure,
} from '../wire/parse-envelope.js'
import { parseCanshiftFile } from '../schemas/canshift-file.js'
import { parseBoardProfile } from '../board-profile/serializer.js'
import { parseSettings } from '../schemas/screen-settings.js'
import { parseUsbStatus } from '../schemas/usb-status.js'
import { parseBleStatus } from '../schemas/ble-status.js'
import { parseTimerState } from '../schemas/ble-timer.js'
import { parseDeviceConfig } from '../schemas/device.js'

describe('parseJsonObject', () => {
  it('rejects malformed JSON without throwing', () => {
    expect(parseJsonObject('{oops')).toEqual({ kind: 'invalid_json', raw: '{oops' })
  })

  it('rejects non-objects, including arrays and null', () => {
    expect(parseJsonObject('42').kind).toBe('not_an_object')
    expect(parseJsonObject('null').kind).toBe('not_an_object')
    expect(parseJsonObject('[1,2]').kind).toBe('not_an_object')
  })

  it('applies a reviver when one is given', () => {
    const result = parseJsonObject('{"a":1,"b":2}', (key, value) =>
      key === 'b' ? undefined : value
    )
    expect(result).toEqual({ kind: 'ok', value: { a: 1 } })
  })
})

describe('parseUntrustedJsonObject', () => {
  it('rejects a forbidden key rather than stripping it', () => {
    expect(parseUntrustedJsonObject('{"__proto__":{"x":1}}')).toEqual({
      kind: 'forbidden_key',
      key: '__proto__',
    })
  })

  it('rejects one nested below the top level', () => {
    expect(parseUntrustedJsonObject('{"a":{"b":{"prototype":1}}}')).toEqual({
      kind: 'forbidden_key',
      key: 'prototype',
    })
  })
})

describe('every wire parser shares one envelope', () => {
  const parsers = [
    parseSettings,
    parseUsbStatus,
    parseBleStatus,
    parseTimerState,
    parseDeviceConfig,
  ]

  it('rejects malformed JSON identically', () => {
    for (const parse of parsers) {
      expect(parse('{oops').kind).toBe('invalid_json')
    }
  })

  it('rejects arrays and null identically', () => {
    for (const parse of parsers) {
      expect(parse('[1,2]').kind).toBe('not_an_object')
      expect(parse('null').kind).toBe('not_an_object')
    }
  })
})

describe('formatVersion is validated identically in both envelope parsers', () => {
  it('a fractional formatVersion is not treated as a newer version by either', () => {
    const file = parseCanshiftFile(
      JSON.stringify({ format: 'canshift', formatVersion: 1.5, project: {} })
    )
    const blob = parseBoardProfile(
      JSON.stringify({ magic: 'CANSHIFT_BOARD', formatVersion: 1.5, profile: {} })
    )
    expect(file.kind).not.toBe('unsupported_format_version')
    expect(blob.kind).not.toBe('unsupported_blob_version')
  })

  it('an integer formatVersion above the supported one still trips both', () => {
    const file = parseCanshiftFile(
      JSON.stringify({ format: 'canshift', formatVersion: 99, project: {} })
    )
    const blob = parseBoardProfile(
      JSON.stringify({ magic: 'CANSHIFT_BOARD', formatVersion: 99, profile: {} })
    )
    expect(file.kind).toBe('unsupported_format_version')
    expect(blob.kind).toBe('unsupported_blob_version')
  })
})

describe('describeWireParseFailure', () => {
  it('produces a non-empty message for every failure kind', () => {
    const failures: WireParseFailure[] = [
      { kind: 'invalid_json', raw: '' },
      { kind: 'not_an_object', payload: 42 },
      { kind: 'forbidden_key', key: '__proto__' },
      { kind: 'wrong_shape', issues: [] },
    ]
    for (const failure of failures) {
      expect(describeWireParseFailure(failure).length).toBeGreaterThan(0)
    }
  })

  it('does not leak a raw wire payload into the message', () => {
    const message = describeWireParseFailure({ kind: 'invalid_json', raw: 'secret-token' })
    expect(message).not.toContain('secret-token')
  })
})
