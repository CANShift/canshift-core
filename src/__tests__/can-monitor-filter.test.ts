import { describe, expect, it } from 'vitest'
import {
  CAN_MONITOR_MAX_FILTERS,
  encodeCanMonitorFilter,
  type CanIdFilter,
} from '../wire/can-monitor-filter.js'
import {
  EXTENDED_EXACT_FILTER,
  EXTENDED_EXACT_FILTER_VECTOR,
  STANDARD_PREFIX_FILTER,
  STANDARD_PREFIX_FILTER_VECTOR,
} from './__fixtures__/can-monitor-vectors.js'

const exact = (id: number): CanIdFilter => ({ id, extended: false, mask: 0x7ff })

describe('can monitor filter', () => {
  it.each([
    ['an exact extended id', EXTENDED_EXACT_FILTER, EXTENDED_EXACT_FILTER_VECTOR],
    ['a standard id prefix', STANDARD_PREFIX_FILTER, STANDARD_PREFIX_FILTER_VECTOR],
  ])('encodes %s against the pinned vector', (_name, filters, vector) => {
    expect(Array.from(encodeCanMonitorFilter(filters) ?? [])).toEqual(vector)
  })

  it('encodes no filter as accept-all', () => {
    expect(Array.from(encodeCanMonitorFilter([]) ?? [])).toEqual([0x01, 0x00])
  })

  it.each([
    ['too many filters', Array.from({ length: CAN_MONITOR_MAX_FILTERS + 1 }, (_, i) => exact(i))],
    ['a standard id past 11 bits', [exact(0x800)]],
    ['a mask past 29 bits', [{ ...exact(1), mask: 0x2000_0000 }]],
    ['a fractional id', [exact(1.5)]],
  ])('refuses %s', (_name, filters) => {
    expect(encodeCanMonitorFilter(filters)).toBeNull()
  })
})
