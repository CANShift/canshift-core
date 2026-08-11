import type { EcuProfile } from './types.js'
import { MAXXECU_STREET_PROFILE } from './maxxecu-street.js'
import { OBD2_J1979_PROFILE } from './obd2-j1979.js'

const GENERIC_BLANK_PROFILE: EcuProfile = {
  id: 'generic-blank',
  name: 'Generic (blank)',
  description: "Empty template — fill in from your ECU's CAN documentation.",
  protocol: 'generic',
  signals: [],
}

export const ECU_PROFILES: EcuProfile[] = [
  GENERIC_BLANK_PROFILE,
  MAXXECU_STREET_PROFILE,
  OBD2_J1979_PROFILE,
]

export const DEFAULT_PROFILE_ID = 'generic-blank' as const
