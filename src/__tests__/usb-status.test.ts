import { UsbStatusWireSchema, usbStatusFromWire, parseUsbStatus } from '../schemas/usb-status.js'

const validWire = { status: 'ok', version: '2.5.0', protocol: 3, is_day: 1 }

describe('UsbStatusWireSchema', () => {
  it('accepts a status frame without board_id (older firmware)', () => {
    expect(UsbStatusWireSchema.safeParse(validWire).success).toBe(true)
  })

  it('accepts an optional board_id slug', () => {
    const parsed = UsbStatusWireSchema.parse({ ...validWire, board_id: 'crowpanel_28' })
    expect(parsed.board_id).toBe('crowpanel_28')
  })

  it('tolerates unknown wire fields (passthrough)', () => {
    expect(UsbStatusWireSchema.safeParse({ ...validWire, unexpected: 'x' }).success).toBe(true)
  })

  it('rejects a missing required field and a wrong type', () => {
    const missingVersion: Record<string, unknown> = { ...validWire }
    delete missingVersion.version
    expect(UsbStatusWireSchema.safeParse(missingVersion).success).toBe(false)
    expect(UsbStatusWireSchema.safeParse({ ...validWire, protocol: 'x' }).success).toBe(false)
    expect(UsbStatusWireSchema.safeParse({ ...validWire, is_day: 2 }).success).toBe(false)
  })
})

describe('usbStatusFromWire', () => {
  it('renames wire keys to the camelCase domain and translates is_day', () => {
    expect(usbStatusFromWire({ ...validWire, board_id: 'crowpanel_28' })).toEqual({
      firmwareVersion: '2.5.0',
      protocolVersion: 3,
      isDay: true,
      boardId: 'crowpanel_28',
    })
  })

  it('omits boardId when board_id is absent', () => {
    expect(usbStatusFromWire(validWire)).not.toHaveProperty('boardId')
  })
})

describe('parseUsbStatus', () => {
  it('exposes boardId from a CMD_GET_STATUS payload carrying board_id', () => {
    const result = parseUsbStatus(
      '{"status":"ok","version":"2.5.0","protocol":3,"is_day":1,"board_id":"crowpanel_28"}'
    )
    expect(result).toEqual({
      kind: 'ok',
      status: {
        firmwareVersion: '2.5.0',
        protocolVersion: 3,
        isDay: true,
        boardId: 'crowpanel_28',
      },
    })
  })

  it('stays valid for a payload without board_id', () => {
    const result = parseUsbStatus('{"status":"ok","version":"2.4.0","protocol":3,"is_day":0}')
    expect(result.kind).toBe('ok')
    if (result.kind === 'ok') {
      expect(result.status.boardId).toBeUndefined()
    }
  })

  it('flags invalid JSON', () => {
    expect(parseUsbStatus('not json').kind).toBe('invalid_json')
    expect(parseUsbStatus('{').kind).toBe('invalid_json')
  })

  it('flags non-object payloads', () => {
    expect(parseUsbStatus('42').kind).toBe('not_an_object')
    expect(parseUsbStatus('[1,2]').kind).toBe('not_an_object')
    expect(parseUsbStatus('null').kind).toBe('not_an_object')
  })

  it('flags a wrong shape with Zod issues', () => {
    const result = parseUsbStatus('{"status":"ok","version":"2.5.0","protocol":"x","is_day":1}')
    expect(result.kind).toBe('wrong_shape')
    if (result.kind === 'wrong_shape') {
      expect(result.issues.length).toBeGreaterThan(0)
    }
  })
})
