import {
  CanFrameSchema,
  HeapStatsFrameWireSchema,
  LogFrameSchema,
  TeleFrameSchema,
  heapStatsFromWire,
} from '../schemas/ws-frames.js'

describe('LogFrameSchema', () => {
  it('accepts a well-formed log frame', () => {
    const frame = { log: 1, lvl: 'I', tag: 'CAN', msg: 'hello' }
    expect(LogFrameSchema.parse(frame)).toEqual(frame)
  })

  it('accepts every known level', () => {
    for (const lvl of ['E', 'W', 'I', 'D', 'V']) {
      expect(LogFrameSchema.parse({ log: 1, lvl, tag: 't', msg: 'm' })).toBeDefined()
    }
  })

  it('rejects an unknown level', () => {
    expect(() => LogFrameSchema.parse({ log: 1, lvl: 'X', tag: 't', msg: 'm' })).toThrow()
  })

  it('rejects a non-string tag/msg', () => {
    expect(() => LogFrameSchema.parse({ log: 1, lvl: 'I', tag: 42, msg: 'm' })).toThrow()
    expect(() => LogFrameSchema.parse({ log: 1, lvl: 'I', tag: 't', msg: 42 })).toThrow()
  })

  it('tolerates but strips unknown firmware fields', () => {
    const out = LogFrameSchema.parse({ log: 1, lvl: 'I', tag: 't', msg: 'm', seq: 99 })
    expect(out).toEqual({ log: 1, lvl: 'I', tag: 't', msg: 'm' })
    expect(out).not.toHaveProperty('seq')
  })
})

describe('ws frame strictness policy — unknown keys are stripped', () => {
  it('strips unknown keys from CanFrame while keeping known fields', () => {
    const out = CanFrameSchema.parse({ can: 1, id: 0x1, len: 1, d: [7], rssi: -40 })
    expect(out).toEqual({ can: 1, id: 0x1, len: 1, d: [7] })
  })

  it('strips unknown keys from TeleFrame', () => {
    const out = TeleFrameSchema.parse({ tele: 1, v: { rpm: 900 }, extra: 'x' })
    expect(out).toEqual({ tele: 1, v: { rpm: 900 } })
  })

  it('strips unknown keys from HeapStatsFrameWire', () => {
    const out = HeapStatsFrameWireSchema.parse({
      heap_stats: 1,
      ts: 10,
      free_int: 100,
      largest_int: 90,
      free_psram: null,
      largest_psram: null,
      mystery: true,
    })
    expect(out).not.toHaveProperty('mystery')
  })
})

describe('CanFrameSchema', () => {
  it('accepts a well-formed CAN frame', () => {
    const frame = { can: 1, id: 0x123, len: 8, d: [0, 1, 2, 3, 4, 5, 6, 7] }
    expect(CanFrameSchema.parse(frame)).toEqual(frame)
  })

  it('rejects a len > 8 or a payload longer than 8 bytes', () => {
    expect(() => CanFrameSchema.parse({ can: 1, id: 1, len: 9, d: [] })).toThrow()
    expect(() =>
      CanFrameSchema.parse({ can: 1, id: 1, len: 8, d: [0, 0, 0, 0, 0, 0, 0, 0, 0] })
    ).toThrow()
  })

  it('rejects bytes outside 0..255', () => {
    expect(() => CanFrameSchema.parse({ can: 1, id: 1, len: 1, d: [256] })).toThrow()
    expect(() => CanFrameSchema.parse({ can: 1, id: 1, len: 1, d: [-1] })).toThrow()
  })

  it('rejects a negative or non-integer id', () => {
    expect(() => CanFrameSchema.parse({ can: 1, id: -1, len: 0, d: [] })).toThrow()
    expect(() => CanFrameSchema.parse({ can: 1, id: 1.5, len: 0, d: [] })).toThrow()
  })

  it('rejects a frame where len disagrees with d.length', () => {
    expect(() => CanFrameSchema.parse({ can: 1, id: 1, len: 4, d: [1, 2, 3] })).toThrow(
      /len must equal d.length/
    )
    expect(() => CanFrameSchema.parse({ can: 1, id: 1, len: 0, d: [1, 2] })).toThrow(
      /len must equal d.length/
    )
  })
})

describe('TeleFrameSchema', () => {
  it('accepts a well-formed tele frame with finite signal values', () => {
    const frame = { tele: 1, v: { rpm: 1234, coolant: 89.5 } }
    expect(TeleFrameSchema.parse(frame)).toEqual(frame)
  })

  it('accepts an empty signal map', () => {
    expect(TeleFrameSchema.parse({ tele: 1, v: {} })).toEqual({ tele: 1, v: {} })
  })

  it('rejects non-finite values', () => {
    expect(() => TeleFrameSchema.parse({ tele: 1, v: { rpm: Number.NaN } })).toThrow()
    expect(() => TeleFrameSchema.parse({ tele: 1, v: { rpm: Number.POSITIVE_INFINITY } })).toThrow()
  })

  it('rejects non-numeric values', () => {
    expect(() => TeleFrameSchema.parse({ tele: 1, v: { rpm: 'fast' } })).toThrow()
  })
})

describe('HeapStatsFrameWireSchema + heapStatsFromWire', () => {
  const wire = {
    heap_stats: 1,
    ts: 12345,
    free_int: 200_000,
    largest_int: 90_000,
    free_psram: 1_500_000,
    largest_psram: 800_000,
  }

  it('parses a well-formed wire frame', () => {
    expect(HeapStatsFrameWireSchema.parse(wire)).toEqual(wire)
  })

  it('accepts null PSRAM counters when the device lacks PSRAM', () => {
    const parsed = HeapStatsFrameWireSchema.parse({
      ...wire,
      free_psram: null,
      largest_psram: null,
    })
    expect(parsed.free_psram).toBeNull()
    expect(parsed.largest_psram).toBeNull()
  })

  it('heapStatsFromWire maps snake_case wire keys to camelCase domain shape', () => {
    expect(heapStatsFromWire(wire)).toEqual({
      tsMs: 12345,
      freeInternal: 200_000,
      largestInternal: 90_000,
      freePsram: 1_500_000,
      largestPsram: 800_000,
    })
  })

  it('heapStatsFromWire preserves null PSRAM counters', () => {
    const mapped = heapStatsFromWire({ ...wire, free_psram: null, largest_psram: null })
    expect(mapped.freePsram).toBeNull()
    expect(mapped.largestPsram).toBeNull()
  })
})
