import { mapObjectKeys } from '../wire/keymap.js'
import { deepClone } from '../migrations/helpers.js'

describe('mapObjectKeys — prototype-pollution hardening', () => {
  it('renames mapped keys and passes through the rest', () => {
    const out = mapObjectKeys({ a_b: 1, keep: 2 }, { a_b: 'aB' })
    expect(out).toEqual({ aB: 1, keep: 2 })
  })

  it('drops undefined values', () => {
    const out = mapObjectKeys({ present: 1, absent: undefined }, {})
    expect(out).toEqual({ present: 1 })
  })

  it('does not pollute Object.prototype from a __proto__ source key', () => {
    const malicious = JSON.parse('{"safe":1,"__proto__":{"polluted":true}}') as Record<
      string,
      unknown
    >
    const out = mapObjectKeys(malicious, {})
    expect(out).toEqual({ safe: 1 })
    expect(({} as Record<string, unknown>).polluted).toBeUndefined()
    expect(Object.getPrototypeOf(out)).toBe(Object.prototype)
  })

  it('skips constructor and prototype source keys', () => {
    const malicious = JSON.parse('{"constructor":{"x":1},"prototype":{"y":2},"ok":3}') as Record<
      string,
      unknown
    >
    const out = mapObjectKeys(malicious, {})
    expect(out).toEqual({ ok: 3 })
  })

  it('skips a key remapped onto a forbidden target', () => {
    const out = mapObjectKeys({ evil: 1, ok: 2 }, { evil: '__proto__' })
    expect(out).toEqual({ ok: 2 })
    expect(({} as Record<string, unknown>).polluted).toBeUndefined()
  })
})

describe('deepClone — prototype-pollution hardening', () => {
  it('clones nested data structurally', () => {
    const source = { a: 1, nested: { b: [2, 3] } }
    const clone = deepClone(source)
    expect(clone).toEqual(source)
    expect(clone.nested).not.toBe(source.nested)
  })

  it('strips a __proto__ key and does not pollute Object.prototype', () => {
    const malicious = JSON.parse('{"keep":1,"__proto__":{"polluted":true}}') as Record<
      string,
      unknown
    >
    const clone = deepClone(malicious)
    expect(clone).toEqual({ keep: 1 })
    expect(({} as Record<string, unknown>).polluted).toBeUndefined()
    expect(Object.getPrototypeOf(clone)).toBe(Object.prototype)
  })
})
