import type { SignalDef } from '../schemas/signal.js'

export interface EcuProfile {
  id: string
  name: string
  description: string
  protocol: string
  signals: SignalDef[]
}
