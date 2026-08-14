import { STRING_CAPS } from '../constants/firmware-caps.js'
import type { SignalDef } from '../schemas/signal.js'

export interface DedupeResult {
  signals: SignalDef[]
  warnings: string[]
}

const withSuffix = (name: string, suffix: string): string => {
  const room = Math.max(STRING_CAPS.SIGNAL_NAME - suffix.length - 1, 1)
  return `${name.slice(0, room)}_${suffix}`
}

const claimName = (
  name: string,
  canFrameId: string,
  firstFrame: string,
  claimed: Set<string>
): string => {
  const base = canFrameId === firstFrame ? name : withSuffix(name, canFrameId.replace(/^0x/i, ''))
  if (!claimed.has(base)) return base
  let ordinal = 2
  while (claimed.has(withSuffix(base, String(ordinal)))) ordinal += 1
  return withSuffix(base, String(ordinal))
}

export const dedupeSignalNames = (signals: SignalDef[]): DedupeResult => {
  const claimed = new Set(signals.map((signal) => signal.name))
  const firstFrameOf = new Map<string, string>()
  const warnings: string[] = []

  const deduped = signals.map((signal) => {
    const firstFrame = firstFrameOf.get(signal.name)
    if (firstFrame === undefined) {
      firstFrameOf.set(signal.name, signal.canFrameId)
      return signal
    }
    const name = claimName(signal.name, signal.canFrameId, firstFrame, claimed)
    claimed.add(name)
    warnings.push(
      `Renamed duplicate signal "${signal.name}" (frame ${signal.canFrameId}) to "${name}" — ` +
        `frame ${firstFrame} already claims that name`
    )
    return { ...signal, name }
  })

  return { signals: deduped, warnings }
}
