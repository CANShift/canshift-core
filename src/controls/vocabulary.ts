export const CONTROL_STATES = ['off', 'armed', 'active', 'unavailable'] as const

export type ControlState = (typeof CONTROL_STATES)[number]

export const CONTROL_KINDS = ['toggle', 'stepper'] as const

export type ControlKind = (typeof CONTROL_KINDS)[number]

export type ControlParam = 'none' | 'level' | 'rpm' | 'speedKph' | 'gear'

export type ControlTone = 'ink' | 'dim' | 'white' | 'engaged' | 'lockLine' | 'lockInk'

export interface ControlPhrase {
  kickerSuffix: string
  stateWord: string
  param: ControlParam
}

export interface ControlDefinition {
  id: string
  kicker: string
  kind: ControlKind
  armed: boolean
  stepFloor: number
  phrases: Record<ControlState, ControlPhrase>
}

const phrase = (
  kickerSuffix: string,
  stateWord: string,
  param: ControlParam = 'none'
): ControlPhrase => ({ kickerSuffix, stateWord, param })

export const CONTROLS: readonly ControlDefinition[] = [
  {
    id: 'anti_lag',
    kicker: 'ANTI-LAG',
    kind: 'toggle',
    armed: false,
    stepFloor: 0,
    phrases: {
      off: phrase('', 'OFF'),
      armed: phrase('', ''),
      active: phrase('', 'ON'),
      unavailable: phrase('EGT HIGH', 'LOCKED'),
    },
  },
  {
    id: 'traction',
    kicker: 'TRACTION',
    kind: 'stepper',
    armed: true,
    stepFloor: 0,
    phrases: {
      off: phrase('', 'OFF'),
      armed: phrase('', 'LEVEL %d', 'level'),
      active: phrase('CUTTING', 'LEVEL %d', 'level'),
      unavailable: phrase('NO WHEEL SPEED', 'N/A'),
    },
  },
  {
    id: 'launch',
    kicker: 'LAUNCH',
    kind: 'toggle',
    armed: true,
    stepFloor: 0,
    phrases: {
      off: phrase('', 'OFF'),
      armed: phrase('%d rpm', 'ARMED', 'rpm'),
      active: phrase('HOLDING', '%d', 'rpm'),
      unavailable: phrase('MOVING', 'LOCKED'),
    },
  },
  {
    id: 'pit_limit',
    kicker: 'PIT LIMIT',
    kind: 'toggle',
    armed: false,
    stepFloor: 0,
    phrases: {
      off: phrase('', 'OFF'),
      armed: phrase('', ''),
      active: phrase('HOLDING', '%d', 'speedKph'),
      unavailable: phrase('GEAR %d', 'LOCKED', 'gear'),
    },
  },
  {
    id: 'cruise',
    kicker: 'CRUISE',
    kind: 'toggle',
    armed: true,
    stepFloor: 0,
    phrases: {
      off: phrase('', 'OFF'),
      armed: phrase('SET %d', 'ARMED', 'speedKph'),
      active: phrase('HOLDING', '%d', 'speedKph'),
      unavailable: phrase('BRAKE CUT', 'CANCELLED'),
    },
  },
  {
    id: 'ecu_map',
    kicker: 'ECU MAP',
    kind: 'stepper',
    armed: false,
    stepFloor: 1,
    phrases: {
      off: phrase('', 'MAP %d', 'level'),
      armed: phrase('', ''),
      active: phrase('', 'MAP %d', 'level'),
      unavailable: phrase('NO ECU', 'N/A'),
    },
  },
]

export interface ControlPaint {
  border: ControlTone
  ground: ControlTone | null
  kicker: ControlTone
  word: ControlTone
  pulses: boolean
}

export const CONTROL_PAINT: Record<ControlState, ControlPaint> = {
  off: { border: 'ink', ground: null, kicker: 'dim', word: 'ink', pulses: false },
  armed: { border: 'ink', ground: null, kicker: 'dim', word: 'ink', pulses: true },
  active: { border: 'engaged', ground: 'engaged', kicker: 'white', word: 'white', pulses: false },
  unavailable: {
    border: 'lockLine',
    ground: null,
    kicker: 'lockInk',
    word: 'lockInk',
    pulses: false,
  },
}

export const CONTROL_KICKER_ENGAGED_OPACITY = 0.75

export const CONTROL_STEP_MAX = 6

export const controlByKicker = (kicker: string): ControlDefinition | null =>
  CONTROLS.find((control) => control.kicker === kicker.trim().toUpperCase()) ?? null

export const supportsArmed = (control: ControlDefinition): boolean => control.armed

const PARAM_TOKEN = '%d'

export const fillParam = (template: string, param: number | null): string => {
  if (!template.includes(PARAM_TOKEN)) return template
  return param === null ? '' : template.replace(PARAM_TOKEN, String(param))
}
