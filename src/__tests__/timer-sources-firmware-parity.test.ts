import { existsSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

import { TIMER_SOURCES } from '../schemas/widgets/timer.js'
import { TIMER_SOURCE_KICKERS } from '../widget-metrics/timer.js'

import { firmwarePath, readFirmwareSource } from './firmware-source.js'

const VALIDATORS = firmwarePath('src/config/config_validators.inc')
const SOURCES = firmwarePath('src/ui/widgets/timer_sources.cpp')

const firmwarePresent = [VALIDATORS, SOURCES].every((path) => existsSync(path))
const describeIfFirmware = firmwarePresent ? describe : describe.skip

const SLUG = /\{"(\w+)", CfgTimerSource::(\w+)\}/g
const RENDERER = /\{CfgTimerSource::(\w+), &\w+, "([^"]*)", "([^"]*)", "[^"]*"\}/g

const enumBySlug = (source: string): Map<string, string> =>
  new Map([...source.matchAll(SLUG)].map((match) => [match[1] ?? '', match[2] ?? '']))

const kickersByEnum = (source: string): Map<string, [string, string]> =>
  new Map(
    [...source.matchAll(RENDERER)].map((match) => [
      match[1] ?? '',
      [match[2] ?? '', match[3] ?? ''],
    ])
  )

describeIfFirmware('timer sources firmware parity', () => {
  const slugs = enumBySlug(readFirmwareSource(VALIDATORS))
  const kickers = kickersByEnum(readFirmwareSource(SOURCES))

  it('parses exactly the sources the schema accepts', () => {
    expect([...slugs.keys()].sort()).toEqual([...TIMER_SOURCES].sort())
  })

  it.each([...TIMER_SOURCES])('labels %s with the firmware kickers', (source) => {
    const firmware = kickers.get(slugs.get(source) ?? '')
    const { metric, imperial } = TIMER_SOURCE_KICKERS[source]
    expect([metric, imperial]).toEqual(firmware)
  })
})
