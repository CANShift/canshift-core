import { describe, expect, it } from 'vitest'
import { parseBlePages } from '../schemas/ble-pages.js'

describe('parseBlePages', () => {
  it('returns the page ids in dash order', () => {
    expect(parseBlePages('{"pages":["street","track","engine"]}')).toEqual({
      kind: 'ok',
      pages: ['street', 'track', 'engine'],
    })
  })

  it('accepts a dash with no visible page', () => {
    expect(parseBlePages('{"pages":[]}')).toEqual({ kind: 'ok', pages: [] })
  })

  it('tolerates unknown fields', () => {
    expect(parseBlePages('{"pages":["street"],"extra":1}')).toEqual({
      kind: 'ok',
      pages: ['street'],
    })
  })
})

describe('parseBlePages rejections', () => {
  it('rejects the firmware truncation canary', () => {
    expect(parseBlePages('{"err":"too_long"}').kind).toBe('wrong_shape')
  })

  it('rejects more pages than the firmware can hold', () => {
    const pages = Array.from({ length: 9 }, (_, i) => `p${String(i)}`)
    expect(parseBlePages(JSON.stringify({ pages })).kind).toBe('wrong_shape')
  })

  it('rejects empty and over-long page ids', () => {
    expect(parseBlePages('{"pages":[""]}').kind).toBe('wrong_shape')
    expect(parseBlePages(JSON.stringify({ pages: ['x'.repeat(32)] })).kind).toBe('wrong_shape')
  })

  it('reports malformed JSON', () => {
    expect(parseBlePages('{').kind).toBe('invalid_json')
  })
})
