import { SignalDefSchema, type SignalDef } from '../schemas/signal.js'

export type ValidateOutcome =
  { kind: 'signal'; signal: SignalDef } | { kind: 'warning'; message: string }

export const validateCandidate = (
  candidate: Record<string, unknown>,
  name: string,
  canFrameId: string
): ValidateOutcome => {
  const parsed = SignalDefSchema.safeParse(candidate)
  if (parsed.success) {
    return { kind: 'signal', signal: parsed.data }
  }
  const reasons = parsed.error.issues
    .map((iss) => {
      const dotPath = iss.path.join('.')
      return dotPath ? `${dotPath}: ${iss.message}` : iss.message
    })
    .join('; ')
  return { kind: 'warning', message: `Rejected signal "${name}" (frame ${canFrameId}): ${reasons}` }
}
