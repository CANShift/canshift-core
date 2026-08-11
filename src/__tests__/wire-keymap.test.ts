import {
  camelToSnakeDeep,
  camelToSnakeKeys,
  snakeToCamelDeep,
  snakeToCamelKeys,
} from '../wire/keymap.js'
import { cloneAndStripForbiddenKeys } from '../migrations/config-traverse.js'

describe('snakeToCamelKeys / camelToSnakeKeys', () => {
  it('renames snake_case keys to camelCase and passes through the rest', () => {
    expect(snakeToCamelKeys({ a_b: 1, keep: 2 })).toEqual({ aB: 1, keep: 2 })
  })

  it('renames camelCase keys to snake_case and passes through the rest', () => {
    expect(camelToSnakeKeys({ aB: 1, keep: 2 })).toEqual({ a_b: 1, keep: 2 })
  })

  it('round-trips multi-segment keys', () => {
    const domain = { freqWriteHz: 1, busSharedWithTouch: true, readable: false }
    expect(snakeToCamelKeys(camelToSnakeKeys(domain))).toEqual(domain)
  })

  it('maps digit-leading segments the same way in both directions', () => {
    expect(camelToSnakeKeys({ accent600: '#DD2B0F' })).toEqual({ accent600: '#DD2B0F' })
    expect(snakeToCamelKeys({ pin_5v: 1 })).toEqual({ pin5v: 1 })
  })

  it('drops undefined values', () => {
    expect(snakeToCamelKeys({ present: 1, absent: undefined })).toEqual({ present: 1 })
  })
})

describe('key mappers — prototype-pollution hardening', () => {
  it('does not pollute Object.prototype from a __proto__ source key', () => {
    const malicious = JSON.parse('{"safe":1,"__proto__":{"polluted":true}}') as Record<
      string,
      unknown
    >
    const out = snakeToCamelKeys(malicious)
    expect(out).toEqual({ safe: 1 })
    expect(({} as Record<string, unknown>).polluted).toBeUndefined()
    expect(Object.getPrototypeOf(out)).toBe(Object.prototype)
  })

  it('skips constructor and prototype source keys', () => {
    const malicious = JSON.parse('{"constructor":{"x":1},"prototype":{"y":2},"ok":3}') as Record<
      string,
      unknown
    >
    expect(camelToSnakeKeys(malicious)).toEqual({ ok: 3 })
  })

  it('skips forbidden keys nested inside a deep mapping', () => {
    const malicious = JSON.parse('{"lcd":{"pin_cs":5,"__proto__":{"polluted":true}}}') as Record<
      string,
      unknown
    >
    const out = snakeToCamelDeep(malicious)
    expect(out).toEqual({ lcd: { pinCs: 5 } })
    expect(({} as Record<string, unknown>).polluted).toBeUndefined()
  })
})

describe('snakeToCamelDeep / camelToSnakeDeep', () => {
  it('renames keys through nested objects and arrays', () => {
    const wire = {
      board_id: 'crowpanel',
      lcd: { pin_mosi: 13, bus_shared_with_touch: true },
      pins: [{ pin_tx: 22 }, { pin_rx: 21 }],
    }
    expect(snakeToCamelDeep(wire)).toEqual({
      boardId: 'crowpanel',
      lcd: { pinMosi: 13, busSharedWithTouch: true },
      pins: [{ pinTx: 22 }, { pinRx: 21 }],
    })
  })

  it('round-trips a nested structure', () => {
    const domain = {
      boardId: 'crowpanel',
      lcd: { pinMosi: 13, freqWriteHz: 40_000_000 },
      conn: { wifiSupported: true, bleSupported: false },
    }
    expect(snakeToCamelDeep(camelToSnakeDeep(domain))).toEqual(domain)
  })

  it('leaves primitive leaves untouched', () => {
    expect(snakeToCamelDeep({ a_b: 'keep_me', c_d: null })).toEqual({ aB: 'keep_me', cD: null })
  })
})

describe('cloneAndStripForbiddenKeys — prototype-pollution hardening', () => {
  it('clones nested data structurally', () => {
    const source = { a: 1, nested: { b: [2, 3] } }
    const clone = cloneAndStripForbiddenKeys(source)
    expect(clone).toEqual(source)
    expect(clone.nested).not.toBe(source.nested)
  })

  it('strips a __proto__ key and does not pollute Object.prototype', () => {
    const malicious = JSON.parse('{"keep":1,"__proto__":{"polluted":true}}') as Record<
      string,
      unknown
    >
    const clone = cloneAndStripForbiddenKeys(malicious)
    expect(clone).toEqual({ keep: 1 })
    expect(({} as Record<string, unknown>).polluted).toBeUndefined()
    expect(Object.getPrototypeOf(clone)).toBe(Object.prototype)
  })
})
