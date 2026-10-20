import { existsSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { SECONDARY_BAR } from '../widget-metrics/shift-light.js'
import { firmwareConstant, firmwarePath, readFirmwareSource } from './firmware-source.js'

const LABEL_WIDGET = firmwarePath('src/ui/widgets/label_widget.cpp')

const describeIfFirmware = existsSync(LABEL_WIDGET) ? describe : describe.skip

describeIfFirmware('secondary bar firmware parity', () => {
  it('draws the bar as tall as the firmware does', () => {
    const source = readFirmwareSource(LABEL_WIDGET)
    expect(SECONDARY_BAR.heightPx).toBe(firmwareConstant(source, 'kBarHeightPx'))
  })
})
