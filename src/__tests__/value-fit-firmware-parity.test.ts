import { existsSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { BIG_TO_DEVICE_FONT } from '../widget-metrics/value-font.js'
import {
  FORMAT_MAX_DECIMALS,
  UNIT_FACE,
  VALUE_FACE_ADVANCE_PX,
  VALUE_RIGHT_INSET_PX,
  VALUE_TRACKING_STEPS,
} from '../widget-metrics/value-fit.js'
import { binAdvance, firmwareValueFaces, inFlashAdvances } from './firmware-fonts.js'
import { firmwareConstant, firmwarePath, readFirmwareSource } from './firmware-source.js'

const FONT_MANAGER = firmwarePath('src/ui/font_manager.cpp')
const WIDGET_HELPERS = firmwarePath('src/ui/widgets/widget_helpers.h')
const FORMAT_FLOAT = firmwarePath('rust/format-float/src/lib.rs')

const firmwarePresent = [FONT_MANAGER, WIDGET_HELPERS, FORMAT_FLOAT].every((p) => existsSync(p))
const describeIfFirmware = firmwarePresent ? describe : describe.skip

const valueFaceAdvances = (px: number, inFlash: boolean): number[] => {
  if (inFlash) return inFlashAdvances(`src/ui/fonts/lv_font_jbmono_extrabold_${String(px)}_nk.c`)
  const advance = binAdvance(`data/fonts/jbmono_extrabold_${String(px)}.bin`)
  return advance === null ? [] : [advance]
}

describeIfFirmware('value face firmware parity', () => {
  const fontManager = readFirmwareSource(FONT_MANAGER)

  it('measures the faces the font manager loads', () => {
    const faces = firmwareValueFaces(fontManager)
    expect(faces.map((face) => face.px)).toEqual(Object.keys(VALUE_FACE_ADVANCE_PX).map(Number))
  })

  it.each(firmwareValueFaces(readFirmwareSource(FONT_MANAGER)))(
    'gives the $px px face the advance its font data carries, on every glyph',
    ({ px, inFlash }) => {
      const advances = valueFaceAdvances(px, inFlash)
      expect(advances.length).toBeGreaterThan(0)
      expect(new Set(advances)).toEqual(new Set([VALUE_FACE_ADVANCE_PX[px]]))
    }
  )

  it('measures units in the face FontManager::units() returns', () => {
    const face = /FontManager::units\(\)\s*\{\s*return &(\w+);/.exec(fontManager)?.[1]
    expect(face).toBe(`lv_font_jbmono_medium_${String(UNIT_FACE.px)}_nk`)
    expect(new Set(inFlashAdvances(`src/ui/fonts/${face ?? ''}.c`))).toEqual(
      new Set([UNIT_FACE.advancePx])
    )
  })
})

describeIfFirmware('value fit layout parity', () => {
  const helpers = readFirmwareSource(WIDGET_HELPERS)

  it('keeps the right inset the column budget subtracts', () => {
    expect(VALUE_RIGHT_INSET_PX).toBe(firmwareConstant(helpers, 'kValueRightInsetPx'))
  })

  it('tracks the value face at the firmware steps', () => {
    const body = /valueTrackingPx\(uint8_t devicePx\)\s*\{([\s\S]*?)\n\}/.exec(helpers)?.[1] ?? ''
    const steps = [...body.matchAll(/devicePx >= (\d+)\)\s*return (-?\d+);/g)].map((m) => ({
      minPx: Number(m[1]),
      trackingPx: Number(m[2]),
    }))
    const fallback = Number(/return (-?\d+);\s*$/.exec(body.trim())?.[1])
    expect(VALUE_TRACKING_STEPS).toEqual([...steps, { minPx: 0, trackingPx: fallback }])
  })

  it('maps big to the device size the firmware picks', () => {
    const table = /kBigFontSteps\[\]\s*=\s*\{([\s\S]*?)\};/.exec(helpers)?.[1] ?? ''
    const steps = [...table.matchAll(/\{(\d+),\s*(\d+)\}/g)].map((m) => ({
      minBig: Number(m[1]),
      px: Number(m[2]),
    }))
    expect(BIG_TO_DEVICE_FONT).toEqual(steps)
  })

  it('caps decimals where format_fixed clamps them', () => {
    const source = readFirmwareSource(FORMAT_FLOAT)
    expect(FORMAT_MAX_DECIMALS).toBe(Number(/const MAX_DECIMALS: i32 = (\d+);/.exec(source)?.[1]))
  })
})
