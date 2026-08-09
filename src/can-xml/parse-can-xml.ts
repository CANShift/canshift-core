import { DEFAULT_FRAME_TIMEOUT_MS, MAX_SIGNAL_TIMEOUT_MS } from '../constants/validation.js'
import { SignalDefSchema, type SignalDef } from '../schemas/signal.js'
import { escapeAttribGT, getAttrs, toSnakeCase, parseHexOrDec, resolveEndian } from './xml-lex.js'
import { parseConversion, computeRange } from './conversion-parse.js'

export interface ParseCanXmlResult {
  signals: SignalDef[]
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

export const parseCanXml = (xml: string): ParseCanXmlResult => {
  const signals: SignalDef[] = []
  const warnings: string[] = []

  if (!xml.includes('<RealDashCAN')) {
    return { signals, warnings: ['Not a supported CAN XML file (missing root tag)'] }
  }

  const safe = escapeAttribGT(xml)

  const framesTagMatch = /<frames\b([^>]*)>/.exec(safe)
  const baseId = framesTagMatch ? resolveBaseId(getAttrs(framesTagMatch[1] ?? ''), warnings) : 0

  const frameRe = /<frame\b([^>]*)>([\s\S]*?)<\/frame>/g
  let frameMatch: RegExpExecArray | null

  while ((frameMatch = frameRe.exec(safe)) !== null) {
    const frameAttrs = getAttrs(frameMatch[1] ?? '')
    const frameBody = frameMatch[2] ?? ''

    const rawId = (frameAttrs.id ?? '').split(':')[0] ?? ''
    const frameIdNum = parseHexOrDec(rawId) + baseId
    if (!Number.isFinite(frameIdNum)) {
      if (rawId !== '') warnings.push(`Skipped frame with unparseable id "${rawId}"`)
      continue
    }
    const canFrameId = `0x${frameIdNum.toString(16)}`

    const frameBigEndian = resolveEndian(frameAttrs.endianess ?? frameAttrs.endianness) ?? false
    const frameSignedDefault = frameAttrs.signed === 'true'
    const parsedTimeout = parseInt(frameAttrs.timeout ?? '', 10)
    const timeoutMs =
      Number.isFinite(parsedTimeout) && parsedTimeout >= 0 && parsedTimeout <= MAX_SIGNAL_TIMEOUT_MS
        ? parsedTimeout
        : DEFAULT_FRAME_TIMEOUT_MS

    const valueRe = /<value\b([^>]*?)(?:\s*\/>|>\s*<\/value>)/g
    let valueMatch: RegExpExecArray | null
    let valueIndex = 0

    while ((valueMatch = valueRe.exec(frameBody)) !== null) {
      const va = getAttrs(valueMatch[1] ?? '')

      if (va.targetId === 'placeholder' || va.conversion === 'placeholder') {
        valueIndex++
        continue
      }

      const name = va.name
        ? toSnakeCase(va.name)
        : va.targetId
          ? `channel_${va.targetId}`
          : `signal_${rawId.replace(/^0x/i, '')}_${String(valueIndex)}`

      const startByte = parseInt(va.offset ?? '0', 10)
      const byteLength = parseInt(va.length ?? '1', 10)

      const signed = va.signed !== undefined ? va.signed === 'true' : frameSignedDefault
      const valueEndian = resolveEndian(va.endianess ?? va.endianness)
      const bigEndian = valueEndian ?? frameBigEndian

      const unit = va.units ?? ''

      const conv = parseConversion(va.conversion)
      if (conv.kind === 'cross-signal') {
        warnings.push(
          `Cross-signal expression "${va.conversion ?? ''}" on "${name}" (frame ${canFrameId}) — deferred to v2`
        )
        valueIndex++
        continue
      }
      if (conv.kind === 'invalid') {
        warnings.push(
          `Skipped unsupported conversion "${va.conversion ?? ''}" on "${name}" (frame ${canFrameId})`
        )
        valueIndex++
        continue
      }

      const scale = conv.kind === 'linear' ? conv.scale : 1
      const offset = conv.kind === 'linear' ? conv.offset : 0
      const bitShift = conv.kind === 'linear' ? conv.bitShift : null
      const exprText = conv.kind === 'expr' ? conv.expr : undefined

      const bitField =
        bitShift === null ? null : resolveBitField(bitShift, startByte, byteLength, bigEndian)

      if (bitShift !== null && bitField === null) {
        warnings.push(
          `Rejected signal "${name}" (frame ${canFrameId}): bit index ${String(bitShift)} falls ` +
            `outside the ${String(byteLength)}-byte value`
        )
        valueIndex++
        continue
      }

      const bitMask = bitField?.bitMask ?? (unit === 'bit' && !va.conversion ? '0x01' : undefined)

      const isBit = bitMask !== undefined

      const explicitRange =
        va.rangeMin !== undefined && va.rangeMax !== undefined
          ? { min: parseFloat(va.rangeMin), max: parseFloat(va.rangeMax) }
          : null
      const { min, max } = isBit
        ? { min: 0, max: 1 }
        : (explicitRange ?? computeRange(byteLength, signed, scale, offset))

      const candidate = {
        name,
        canFrameId,
        startByte: bitField?.startByte ?? startByte,
        byteLength: bitField ? 1 : byteLength,
        bigEndian,
        signed,
        scale,
        offset,
        unit: isBit ? '' : unit,
        min,
        max,
        timeoutMs,
        ...(bitMask !== undefined ? { bitMask } : {}),
        ...(exprText !== undefined ? { expr: exprText } : {}),
      }

      const parsed = SignalDefSchema.safeParse(candidate)
      if (parsed.success) {
        signals.push(parsed.data)
      } else {
        const reasons = parsed.error.issues
          .map((iss) => {
            const dotPath = iss.path.join('.')
            return dotPath ? `${dotPath}: ${iss.message}` : iss.message
          })
          .join('; ')
        warnings.push(`Rejected signal "${name}" (frame ${canFrameId}): ${reasons}`)
      }
      valueIndex++
    }
  }

  return { signals, warnings }
}
