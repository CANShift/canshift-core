import type { GeoPoint, StartFinishLine, TrackSample } from '../schemas/track-session.js'

export const DEFAULT_MIN_LAP_MS = 5000

const METERS_PER_DEG_LAT = 111_320
const DEG_TO_RAD = Math.PI / 180

interface LocalXY {
  x: number
  y: number
}

const toLocal = (p: GeoPoint, ref: GeoPoint): LocalXY => {
  const metersPerDegLng = METERS_PER_DEG_LAT * Math.cos(ref.lat * DEG_TO_RAD)
  return {
    x: (p.lng - ref.lng) * metersPerDegLng,
    y: (p.lat - ref.lat) * METERS_PER_DEG_LAT,
  }
}

interface SegmentHit {
  t: number
  dir: 1 | -1
}

const segmentHit = (a: LocalXY, b: LocalXY, c: LocalXY, d: LocalXY): SegmentHit | null => {
  const rX = b.x - a.x
  const rY = b.y - a.y
  const sX = d.x - c.x
  const sY = d.y - c.y
  const denom = rX * sY - rY * sX
  if (denom === 0) return null
  const qpX = c.x - a.x
  const qpY = c.y - a.y
  const t = (qpX * sY - qpY * sX) / denom
  const u = (qpX * rY - qpY * rX) / denom
  if (t < 0 || t > 1 || u < 0 || u > 1) return null
  return { t, dir: denom > 0 ? 1 : -1 }
}

export interface LapCrossing {
  t: number
  dir: 1 | -1
}

export const detectLapCrossings = (
  samples: readonly TrackSample[],
  line: StartFinishLine
): LapCrossing[] => {
  if (samples.length < 2) return []
  const ref = line.a
  const lineC = toLocal(line.a, ref)
  const lineD = toLocal(line.b, ref)

  const crossings: LapCrossing[] = []
  for (let i = 1; i < samples.length; i += 1) {
    const prev = samples[i - 1]
    const cur = samples[i]
    if (prev === undefined || cur === undefined) continue
    const hit = segmentHit(toLocal(prev, ref), toLocal(cur, ref), lineC, lineD)
    if (hit === null) continue
    crossings.push({ t: Math.round(prev.t + hit.t * (cur.t - prev.t)), dir: hit.dir })
  }
  return crossings
}

export interface Lap {
  index: number
  startT: number
  endT: number
  lapMs: number
}

export interface LapSummary {
  laps: Lap[]
  bestLapMs?: number
  lastLapMs?: number
}

export const lapTimesFromCrossings = (
  crossings: readonly LapCrossing[],
  minLapMs: number = DEFAULT_MIN_LAP_MS
): LapSummary => {
  const first = crossings[0]
  if (first === undefined) return { laps: [] }
  const referenceDir = first.dir

  const kept: number[] = []
  for (const crossing of crossings) {
    if (crossing.dir !== referenceDir) continue
    const last = kept[kept.length - 1]
    if (last !== undefined && crossing.t - last < minLapMs) continue
    kept.push(crossing.t)
  }

  const laps: Lap[] = []
  for (let i = 1; i < kept.length; i += 1) {
    const startT = kept[i - 1]
    const endT = kept[i]
    if (startT === undefined || endT === undefined) continue
    laps.push({ index: i, startT, endT, lapMs: endT - startT })
  }

  if (laps.length === 0) return { laps }
  const bestLapMs = laps.reduce((best, lap) => (lap.lapMs < best ? lap.lapMs : best), Infinity)
  const lastLap = laps[laps.length - 1]
  return {
    laps,
    bestLapMs,
    ...(lastLap !== undefined ? { lastLapMs: lastLap.lapMs } : {}),
  }
}

export const computeLaps = (
  samples: readonly TrackSample[],
  line: StartFinishLine,
  minLapMs: number = DEFAULT_MIN_LAP_MS
): LapSummary => lapTimesFromCrossings(detectLapCrossings(samples, line), minLapMs)
