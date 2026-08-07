import {
  OBD2_MODE_READ_DTC,
  OBD2_MODE_READ_DTC_RESPONSE,
  OBD2_MODE_CLEAR_DTC,
  OBD2_MODE_CLEAR_DTC_RESPONSE,
  decodeDtc,
  decodeDtcList,
  dtcSystem,
} from '../index.js'

describe('decodeDtc', () => {
  it('decodes each system prefix from the top two bits', () => {
    expect(decodeDtc(0x03, 0x01)).toBe('P0301')
    expect(decodeDtc(0x43, 0x01)).toBe('C0301')
    expect(decodeDtc(0x83, 0x01)).toBe('B0301')
    expect(decodeDtc(0xc3, 0x01)).toBe('U0301')
  })

  it('renders the three trailing nibbles as uppercase hex', () => {
    expect(decodeDtc(0x01, 0x33)).toBe('P0133')
    expect(decodeDtc(0x0a, 0xbc)).toBe('P0ABC')
    expect(decodeDtc(0x00, 0x00)).toBe('P0000')
  })
})

describe('decodeDtcList', () => {
  it('decodes consecutive 2-byte codes and skips 0x0000 padding', () => {
    expect(decodeDtcList([0x01, 0x33, 0x00, 0x00, 0x43, 0x01])).toEqual(['P0133', 'C0301'])
  })

  it('ignores a trailing odd byte', () => {
    expect(decodeDtcList([0x01, 0x33, 0x02])).toEqual(['P0133'])
  })

  it('returns an empty list for no codes', () => {
    expect(decodeDtcList([])).toEqual([])
    expect(decodeDtcList([0x00, 0x00])).toEqual([])
  })
})

describe('dtcSystem', () => {
  it('maps the code prefix to a system label', () => {
    expect(dtcSystem('P0301')).toBe('powertrain')
    expect(dtcSystem('C1234')).toBe('chassis')
    expect(dtcSystem('B0001')).toBe('body')
    expect(dtcSystem('U0100')).toBe('network')
  })

  it('falls back to powertrain for an unknown prefix', () => {
    expect(dtcSystem('')).toBe('powertrain')
    expect(dtcSystem('X0000')).toBe('powertrain')
  })
})

describe('mode response constants', () => {
  it('derives positive-response service ids as request + 0x40', () => {
    expect(OBD2_MODE_READ_DTC_RESPONSE).toBe(OBD2_MODE_READ_DTC + 0x40)
    expect(OBD2_MODE_CLEAR_DTC_RESPONSE).toBe(OBD2_MODE_CLEAR_DTC + 0x40)
    expect(OBD2_MODE_READ_DTC_RESPONSE).toBe(0x43)
    expect(OBD2_MODE_CLEAR_DTC_RESPONSE).toBe(0x44)
  })
})
