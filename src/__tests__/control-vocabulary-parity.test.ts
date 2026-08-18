import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  CONTROLS,
  CONTROL_STATES,
  controlByKicker,
  fillParam,
  supportsArmed,
  type ControlState,
} from '../controls/vocabulary.js'

const here = dirname(fileURLToPath(import.meta.url))
const VOCABULARY = resolve(here, '../../../canshift-firmware/src/ui/control_vocabulary.cpp')

interface FirmwareControl {
  kicker: string
  kind: string
  armed: string
  stepFloor: number
  phrases: { kickerSuffix: string; stateWord: string }[]
}

const QUOTED = /"((?:[^"\\]|\\.)*)"/g

const unquote = (raw: string): string[] => [...raw.matchAll(QUOTED)].map((m) => m[1] ?? '')

const parseFirmware = (source: string): FirmwareControl[] => {
  const table = /constexpr Control kControls\[\] = \{([\s\S]*?)\n\};/.exec(source)
  if (!table) return []
  const rows = (table[1] ?? '').split(/\{ControlId::/).slice(1)
  return rows.map((row) => {
    const strings = unquote(row)
    const kindMatch = /ControlKind::(\w+)/.exec(row)
    const armedMatch = /ArmedState::(\w+)/.exec(row)
    const floorMatch = /ArmedState::\w+,\s*(\d+)/.exec(row)
    const phrases: FirmwareControl['phrases'] = []
    for (let i = 1; i + 1 < strings.length; i += 2) {
      phrases.push({ kickerSuffix: strings[i] ?? '', stateWord: strings[i + 1] ?? '' })
    }
    return {
      kicker: strings[0] ?? '',
      kind: (kindMatch?.[1] ?? '').toLowerCase(),
      armed: armedMatch?.[1] ?? '',
      stepFloor: Number(floorMatch?.[1] ?? '0'),
      phrases,
    }
  })
}

const describeIfFirmware = existsSync(VOCABULARY) ? describe : describe.skip

describeIfFirmware('control vocabulary firmware parity', () => {
  const firmware = parseFirmware(existsSync(VOCABULARY) ? readFileSync(VOCABULARY, 'utf8') : '')

  it('declares the same controls, in the same order', () => {
    expect(firmware.map((c) => c.kicker)).toEqual(CONTROLS.map((c) => c.kicker))
  })

  it.each(CONTROLS.map((control, index) => [control.kicker, index] as const))(
    '%s matches the firmware row',
    (kicker, index) => {
      const theirs = firmware[index]
      const ours = CONTROLS[index]
      expect(theirs).toBeDefined()
      expect(ours).toBeDefined()
      if (!theirs || !ours) return
      expect(ours.kicker).toBe(kicker)
      expect(ours.kind).toBe(theirs.kind)
      expect(ours.armed).toBe(theirs.armed === 'PHYSICAL')
      expect(ours.stepFloor).toBe(theirs.stepFloor)
      CONTROL_STATES.forEach((state: ControlState, i) => {
        expect(ours.phrases[state].kickerSuffix).toBe(theirs.phrases[i]?.kickerSuffix)
        expect(ours.phrases[state].stateWord).toBe(theirs.phrases[i]?.stateWord)
      })
    }
  )
})

describe('control vocabulary', () => {
  it('finds a control by the kicker the config carries, whatever its case', () => {
    expect(controlByKicker('traction')?.id).toBe('traction')
    expect(controlByKicker(' PIT LIMIT ')?.id).toBe('pit_limit')
    expect(controlByKicker('BOOST')).toBeNull()
  })

  it('declares armed only where the car holds that state', () => {
    const armed = CONTROLS.filter(supportsArmed).map((c) => c.id)
    expect(armed).toEqual(['traction', 'launch', 'cruise'])
  })

  it('gives every stepper a floor and every toggle none but ECU MAP', () => {
    expect(CONTROLS.filter((c) => c.kind === 'stepper').map((c) => c.id)).toEqual([
      'traction',
      'ecu_map',
    ])
    expect(controlByKicker('ECU MAP')?.stepFloor).toBe(1)
  })

  it('fills a parameter only when the phrase asks for one', () => {
    expect(fillParam('LEVEL %d', 3)).toBe('LEVEL 3')
    expect(fillParam('OFF', 3)).toBe('OFF')
    expect(fillParam('LEVEL %d', null)).toBe('')
  })
})
