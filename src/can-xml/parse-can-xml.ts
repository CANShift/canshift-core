import type { SignalDef } from '../schemas/signal.js'
import { escapeAttribGT } from './xml-lex.js'
import { scanFrames } from './frame-scan.js'
import { valueToSignal } from './value-to-signal.js'

export interface ParseCanXmlResult {
  signals: SignalDef[]
  warnings: string[]
}

export const parseCanXml = (xml: string): ParseCanXmlResult => {
  if (!xml.includes('<RealDashCAN')) {
    return { signals: [], warnings: ['Not a supported CAN XML file (missing root tag)'] }
  }

  const { frames, warnings: scanWarnings } = scanFrames(escapeAttribGT(xml))
  const signals: SignalDef[] = []
  const warnings = [...scanWarnings]

  for (const frame of frames) {
    frame.values.forEach((valueAttrs, valueIndex) => {
      const outcome = valueToSignal(valueAttrs, valueIndex, frame)
      if (outcome.kind === 'signal') signals.push(outcome.signal)
      if (outcome.kind === 'warning') warnings.push(outcome.message)
    })
  }

  return { signals, warnings }
}
