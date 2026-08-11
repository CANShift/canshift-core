import { toSnakeCase } from './xml-lex.js'
import { parseConversion, computeRange } from './conversion-parse.js'
import type { FrameContext } from './frame-scan.js'
import { validateCandidate, type ValidateOutcome } from './signal-validate.js'
import { resolveEndian } from './xml-lex.js'

export type ValueOutcome = ValidateOutcome | { kind: 'skip' }

interface BitField {
  startByte: number
  bitMask: string
}

const resolveBitField = (
  bitIndex: number,
  startByte: number,
  byteLength: number,
  bigEndian: boolean
): BitField | null => {
  const byteOffset = Math.floor(bitIndex / 8)
  if (byteOffset >= byteLength) return null
  const carrier = bigEndian ? byteLength - 1 - byteOffset : byteOffset
  const mask = 1 << (bitIndex % 8)
  return {
    startByte: startByte + carrier,
    bitMask: `0x${mask.toString(16).padStart(2, '0')}`,
  }
}

const deriveName = (
  va: Record<string, string>,
  frame: FrameContext,
  valueIndex: number
): string => {
  if (va.name) return toSnakeCase(va.name)
  if (va.targetId) return `channel_${va.targetId}`
  return `signal_${frame.rawId.replace(/^0x/i, '')}_${String(valueIndex)}`
}

const resolveRange = (
  isBit: boolean,
  va: Record<string, string>,
  byteLength: number,
  signed: boolean,
  scale: number,
  offset: number
): { min: number; max: number } => {
  if (isBit) return { min: 0, max: 1 }
  if (va.rangeMin !== undefined && va.rangeMax !== undefined) {
    return { min: parseFloat(va.rangeMin), max: parseFloat(va.rangeMax) }
  }
  return computeRange(byteLength, signed, scale, offset)
}

interface ValueLayout {
  name: string
  startByte: number
  byteLength: number
  signed: boolean
  bigEndian: boolean
  unit: string
}

const resolveLayout = (
  va: Record<string, string>,
  valueIndex: number,
  frame: FrameContext
): ValueLayout => ({
  name: deriveName(va, frame, valueIndex),
  startByte: parseInt(va.offset ?? '0', 10),
  byteLength: parseInt(va.length ?? '1', 10),
  signed: va.signed !== undefined ? va.signed === 'true' : frame.signedDefault,
  bigEndian: resolveEndian(va.endianess ?? va.endianness) ?? frame.bigEndian,
  unit: va.units ?? '',
})

const buildCandidate = (
  layout: ValueLayout,
  frame: FrameContext,
  conv: ReturnType<typeof parseConversion>,
  bitField: BitField | null,
  va: Record<string, string>
): Record<string, unknown> => {
  const scale = conv.kind === 'linear' ? conv.scale : 1
  const offset = conv.kind === 'linear' ? conv.offset : 0
  const bitMask =
    bitField?.bitMask ?? (layout.unit === 'bit' && !va.conversion ? '0x01' : undefined)
  const isBit = bitMask !== undefined
  const { min, max } = resolveRange(isBit, va, layout.byteLength, layout.signed, scale, offset)
  return {
    name: layout.name,
    canFrameId: frame.canFrameId,
    startByte: bitField?.startByte ?? layout.startByte,
    byteLength: bitField ? 1 : layout.byteLength,
    bigEndian: layout.bigEndian,
    signed: layout.signed,
    scale,
    offset,
    unit: isBit ? '' : layout.unit,
    min,
    max,
    timeoutMs: frame.timeoutMs,
    ...(bitMask !== undefined ? { bitMask } : {}),
    ...(conv.kind === 'expr' ? { expr: conv.expr } : {}),
    ...(conv.kind === 'expr' && conv.refs.length > 0 ? { exprRefs: conv.refs } : {}),
  }
}

export const valueToSignal = (
  va: Record<string, string>,
  valueIndex: number,
  frame: FrameContext
): ValueOutcome => {
  if (va.targetId === 'placeholder' || va.conversion === 'placeholder') return { kind: 'skip' }

  const layout = resolveLayout(va, valueIndex, frame)

  const conv = parseConversion(va.conversion)
  if (conv.kind === 'invalid') {
    return {
      kind: 'warning',
      message: `Skipped unsupported conversion "${va.conversion ?? ''}" on "${layout.name}" (frame ${frame.canFrameId})`,
    }
  }

  const bitShift = conv.kind === 'linear' ? conv.bitShift : null
  const bitField =
    bitShift === null
      ? null
      : resolveBitField(bitShift, layout.startByte, layout.byteLength, layout.bigEndian)

  if (bitShift !== null && bitField === null) {
    return {
      kind: 'warning',
      message:
        `Rejected signal "${layout.name}" (frame ${frame.canFrameId}): bit index ${String(bitShift)} falls ` +
        `outside the ${String(layout.byteLength)}-byte value`,
    }
  }

  const candidate = buildCandidate(layout, frame, conv, bitField, va)
  return validateCandidate(candidate, layout.name, frame.canFrameId)
}
