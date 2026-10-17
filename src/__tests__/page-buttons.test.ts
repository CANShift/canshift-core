import { describe, expect, it } from 'vitest'

import { DashboardConfigSchema } from '../schemas/dashboard.js'
import { PageButtonsSchema } from '../schemas/page-buttons.js'
import { STRING_CAPS } from '../constants/firmware-caps.js'

const dashboard = (extra: Record<string, unknown>): Record<string, unknown> => ({
  version: '1.42.0',
  name: 'Test',
  defaultPageId: 'p1',
  revLimitRpm: 7000,
  topBar: { height: 30, bgColor: '#000000', textColor: '#FFFFFF' },
  pages: [
    {
      id: 'p1',
      backgroundImage: null,
      backgroundColor: '#000000',
      showTopBar: true,
      widgets: [],
    },
  ],
  ...extra,
})

describe('PageButtonsSchema', () => {
  it('accepts both buttons, either one alone, or none', () => {
    expect(PageButtonsSchema.safeParse({ next: 'flag_cruise', previous: 'gear' }).success).toBe(
      true
    )
    expect(PageButtonsSchema.safeParse({ next: 'flag_cruise' }).success).toBe(true)
    expect(PageButtonsSchema.safeParse({ previous: 'gear' }).success).toBe(true)
    expect(PageButtonsSchema.safeParse({}).success).toBe(true)
  })

  it('rejects an empty or over-long signal name', () => {
    expect(PageButtonsSchema.safeParse({ next: '' }).success).toBe(false)
    const tooLong = 's'.repeat(STRING_CAPS.SIGNAL_NAME + 1)
    expect(PageButtonsSchema.safeParse({ previous: tooLong }).success).toBe(false)
    const atCap = 's'.repeat(STRING_CAPS.SIGNAL_NAME)
    expect(PageButtonsSchema.safeParse({ previous: atCap }).success).toBe(true)
  })

  it('rejects unknown keys', () => {
    expect(PageButtonsSchema.safeParse({ next: 'gear', select: 'rpm' }).success).toBe(false)
  })
})

describe('DashboardConfigSchema pageButtons', () => {
  it('is optional on the dashboard', () => {
    expect(DashboardConfigSchema.safeParse(dashboard({})).success).toBe(true)
  })

  it('round-trips the configured signals', () => {
    const pageButtons = { next: 'flag_cruise', previous: 'flag_pit_limit' }
    const parsed = DashboardConfigSchema.parse(dashboard({ pageButtons }))
    expect(parsed.pageButtons).toEqual(pageButtons)
  })

  it('rejects a malformed pageButtons block', () => {
    expect(DashboardConfigSchema.safeParse(dashboard({ pageButtons: 'flag_cruise' })).success).toBe(
      false
    )
  })
})
