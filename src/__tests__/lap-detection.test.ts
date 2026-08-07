import {
  DEFAULT_MIN_LAP_MS,
  computeLaps,
  detectLapCrossings,
  lapTimesFromCrossings,
  type LapCrossing,
  type StartFinishLine,
  type TrackSample,
} from '../index.js'

const LINE: StartFinishLine = { a: { lat: 0, lng: 0 }, b: { lat: 0.001, lng: 0 } }

const s = (t: number, lat: number, lng: number): TrackSample => ({ t, lat, lng })

describe('detectLapCrossings', () => {
  it('returns nothing for fewer than two samples', () => {
    expect(detectLapCrossings([], LINE)).toEqual([])
    expect(detectLapCrossings([s(0, 0.0005, -0.0002)], LINE)).toEqual([])
  })

  it('detects a west-to-east crossing and interpolates the crossing time', () => {
    const crossings = detectLapCrossings([s(0, 0.0005, -0.0002), s(1000, 0.0005, 0.0002)], LINE)
    expect(crossings).toHaveLength(1)
    expect(crossings[0]?.t).toBe(500)
    expect(crossings[0]?.dir).toBe(1)
  })

  it('flags the opposite direction for an east-to-west crossing', () => {
    const crossings = detectLapCrossings([s(0, 0.0005, 0.0002), s(1000, 0.0005, -0.0002)], LINE)
    expect(crossings).toHaveLength(1)
    expect(crossings[0]?.dir).toBe(-1)
  })

  it('ignores a pass beyond the line segment extent', () => {
    const crossings = detectLapCrossings([s(0, 0.002, -0.0002), s(1000, 0.002, 0.0002)], LINE)
    expect(crossings).toEqual([])
  })

  it('ignores movement that never reaches the line', () => {
    const crossings = detectLapCrossings([s(0, 0.0005, 0.0002), s(1000, 0.0005, 0.0004)], LINE)
    expect(crossings).toEqual([])
  })
})

describe('lapTimesFromCrossings', () => {
  const east = (t: number): LapCrossing => ({ t, dir: 1 })
  const west = (t: number): LapCrossing => ({ t, dir: -1 })

  it('returns no laps for an empty list', () => {
    expect(lapTimesFromCrossings([])).toEqual({ laps: [] })
  })

  it('returns no laps for a single crossing', () => {
    expect(lapTimesFromCrossings([east(500)])).toEqual({ laps: [] })
  })

  it('turns consecutive same-direction crossings into laps with best/last', () => {
    const result = lapTimesFromCrossings([east(500), east(90_500), east(178_500)])
    expect(result.laps.map((l) => l.lapMs)).toEqual([90_000, 88_000])
    expect(result.bestLapMs).toBe(88_000)
    expect(result.lastLapMs).toBe(88_000)
    expect(result.laps[0]).toEqual({ index: 1, startT: 500, endT: 90_500, lapMs: 90_000 })
  })

  it('ignores wrong-direction crossings (out-lap / reverse pass)', () => {
    const result = lapTimesFromCrossings([east(500), west(45_000), east(90_500)])
    expect(result.laps.map((l) => l.lapMs)).toEqual([90_000])
  })

  it('debounces jitter crossings within minLapMs', () => {
    const result = lapTimesFromCrossings([east(500), east(1_500), east(90_500)], 5_000)
    expect(result.laps.map((l) => l.lapMs)).toEqual([90_000])
  })

  it('honours a custom minLapMs', () => {
    const result = lapTimesFromCrossings([east(0), east(2_000), east(4_000)], 1_500)
    expect(result.laps.map((l) => l.lapMs)).toEqual([2_000, 2_000])
  })

  it('defaults minLapMs to DEFAULT_MIN_LAP_MS', () => {
    const withinDefault = lapTimesFromCrossings([east(0), east(DEFAULT_MIN_LAP_MS - 1)])
    expect(withinDefault.laps).toEqual([])
  })
})

describe('computeLaps', () => {
  it('detects a full lap from a GPS trace that loops around the line ends', () => {
    const trace: TrackSample[] = [
      s(0, 0.0005, -0.0002),
      s(1_000, 0.0005, 0.0002),
      s(2_000, 0.002, 0.0002),
      s(3_000, 0.002, -0.0002),
      s(4_000, 0.0005, -0.0002),
      s(5_000, 0.0005, 0.0002),
    ]
    const result = computeLaps(trace, LINE, 1_000)
    expect(result.laps).toHaveLength(1)
    expect(result.laps[0]?.lapMs).toBe(4_000)
    expect(result.bestLapMs).toBe(4_000)
  })

  it('returns no laps when the trace never completes a second crossing', () => {
    const trace: TrackSample[] = [s(0, 0.0005, -0.0002), s(1_000, 0.0005, 0.0002)]
    expect(computeLaps(trace, LINE)).toEqual({ laps: [] })
  })
})
