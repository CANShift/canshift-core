import { DEFAULT_FRAME_TIMEOUT_MS, MAX_SIGNAL_TIMEOUT_MS } from '../constants/validation.js'
import { getAttrs, parseHexOrDec, resolveEndian } from './xml-lex.js'

export interface FrameContext {
  canFrameId: string
  rawId: string
  bigEndian: boolean
  signedDefault: boolean
  timeoutMs: number
  values: Record<string, string>[]
}

export interface FrameScanResult {
  frames: FrameContext[]
  warnings: string[]
}

const resolveBaseId = (attrs: Record<string, string>, warnings: string[]): number => {
  const raw = attrs.baseId
  if (!raw) return 0
  const parsed = parseHexOrDec(raw)
  if (!Number.isFinite(parsed)) {
    warnings.push(`Ignored unparseable baseId "${raw}" (using 0)`)
    return 0
  }
  return parsed
}

const resolveTimeout = (attrs: Record<string, string>): number => {
  const parsed = parseInt(attrs.timeout ?? '', 10)
  return Number.isFinite(parsed) && parsed >= 0 && parsed <= MAX_SIGNAL_TIMEOUT_MS
    ? parsed
    : DEFAULT_FRAME_TIMEOUT_MS
}

const scanValues = (frameBody: string): Record<string, string>[] => {
  const values: Record<string, string>[] = []
  const valueRe = /<value\b([^>]*?)(?:\s*\/>|>\s*<\/value>)/g
  let valueMatch: RegExpExecArray | null
  while ((valueMatch = valueRe.exec(frameBody)) !== null) {
    values.push(getAttrs(valueMatch[1] ?? ''))
  }
  return values
}

const frameFromMatch = (
  frameAttrs: Record<string, string>,
  frameBody: string,
  baseId: number,
  warnings: string[]
): FrameContext | null => {
  const rawId = (frameAttrs.id ?? frameAttrs.canId ?? '').split(':')[0] ?? ''
  const frameIdNum = parseHexOrDec(rawId) + baseId
  if (!Number.isFinite(frameIdNum)) {
    warnings.push(
      rawId === ''
        ? 'Skipped frame with no id — expected an id or canId attribute'
        : `Skipped frame with unparseable id "${rawId}"`
    )
    return null
  }
  return {
    canFrameId: `0x${frameIdNum.toString(16)}`,
    rawId,
    bigEndian: resolveEndian(frameAttrs.endianess ?? frameAttrs.endianness) ?? false,
    signedDefault: frameAttrs.signed === 'true',
    timeoutMs: resolveTimeout(frameAttrs),
    values: scanValues(frameBody),
  }
}

export const scanFrames = (safeXml: string): FrameScanResult => {
  const frames: FrameContext[] = []
  const warnings: string[] = []

  const framesTagMatch = /<frames\b([^>]*)>/.exec(safeXml)
  const baseId = framesTagMatch ? resolveBaseId(getAttrs(framesTagMatch[1] ?? ''), warnings) : 0

  const frameRe = /<frame\b([^>]*)>([\s\S]*?)<\/frame>/g
  let frameMatch: RegExpExecArray | null
  while ((frameMatch = frameRe.exec(safeXml)) !== null) {
    const frame = frameFromMatch(
      getAttrs(frameMatch[1] ?? ''),
      frameMatch[2] ?? '',
      baseId,
      warnings
    )
    if (frame) frames.push(frame)
  }

  return { frames, warnings }
}
