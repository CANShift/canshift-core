import { TOP_BAR_TIMER_SOURCES, TopBarItemSchema } from '../schemas/dashboard.js'
import { TIMER_SOURCES } from '../schemas/widgets/timer.js'

const parses = (item: Record<string, unknown>): boolean => TopBarItemSchema.safeParse(item).success

describe('TopBarItemSchema — value units', () => {
  it('accepts a signal item with a unit and showUnit', () => {
    expect(
      parses({
        type: 'signal',
        signal: 'trip_km',
        format: 'TRIP %.0f',
        unit: 'km',
        showUnit: true,
        position: 'right',
      })
    ).toBe(true)
  })

  it('accepts a signalMax item with a unit and no symbol', () => {
    expect(
      parses({
        type: 'signalMax',
        signal: 'oil_temp_c',
        text: 'MAX OIL',
        format: '%.0f',
        unit: '°C',
        position: 'right',
      })
    ).toBe(true)
  })

  it('keeps items without a unit valid', () => {
    expect(parses({ type: 'signal', signal: 'map_number', position: 'center' })).toBe(true)
  })
})

describe('TopBarItemSchema — unit bounds', () => {
  it('rejects an empty unit', () => {
    expect(parses({ type: 'signal', signal: 'trip_km', unit: '', position: 'right' })).toBe(false)
  })

  it('rejects a unit longer than the firmware buffer', () => {
    expect(
      parses({ type: 'signal', signal: 'trip_km', unit: 'x'.repeat(16), position: 'right' })
    ).toBe(false)
  })

  it('rejects a unit on an item that prints no value', () => {
    expect(
      parses({ type: 'modeFlag', signal: 'flag_x', text: 'X', unit: 'km', position: 'right' })
    ).toBe(false)
  })
})

describe('TopBarItemSchema — timer', () => {
  it.each(TOP_BAR_TIMER_SOURCES)('accepts source %s', (source) => {
    expect(parses({ type: 'timer', source, text: 'LAP', position: 'center' })).toBe(true)
  })

  it('allows the prefix to be omitted', () => {
    expect(parses({ type: 'timer', source: 'best', position: 'right' })).toBe(true)
  })

  it('requires a source', () => {
    expect(parses({ type: 'timer', text: 'LAP', position: 'center' })).toBe(false)
  })

  it.each(
    TIMER_SOURCES.filter((source) => !(TOP_BAR_TIMER_SOURCES as readonly string[]).includes(source))
  )('rejects the launch source %s', (source) => {
    expect(parses({ type: 'timer', source, position: 'right' })).toBe(false)
  })
})

describe('TopBarItemSchema — flagWord', () => {
  const flagWord = {
    type: 'flagWord',
    signal: 'flag_launch_ctrl',
    text: 'ARMED',
    offText: 'LAUNCH OFF',
    position: 'right',
  }

  it('accepts on and off words', () => {
    expect(parses(flagWord)).toBe(true)
  })

  it('requires the off word', () => {
    expect(parses({ ...flagWord, offText: undefined })).toBe(false)
  })

  it('rejects an off word longer than the firmware buffer', () => {
    expect(parses({ ...flagWord, offText: 'x'.repeat(16) })).toBe(false)
  })
})
