import { existsSync, readFileSync } from 'node:fs'
import { firmwarePath, readFirmwareSource } from './firmware-source.js'

const BIN_HEAD = {
  defaultAdvanceOffset: 0x1e,
  advanceFormatOffset: 0x24,
  advanceBitsOffset: 0x28,
} as const

const SUBPIXELS_PER_PX = 16

export interface FirmwareFace {
  px: number
  inFlash: boolean
}

export const firmwareValueFaces = (fontManager: string): FirmwareFace[] => {
  const ladder = /kValueFaces\[\]\s*=\s*\{([\s\S]*?)\};/.exec(fontManager)?.[1] ?? ''
  return [...ladder.matchAll(/\{(\d+),\s*(nullptr|&\w+)\}/g)].map((m) => ({
    px: Number(m[1]),
    inFlash: m[2] !== 'nullptr',
  }))
}

export const lvglPx = (advanceSubpixels: number): number =>
  Math.floor((advanceSubpixels + SUBPIXELS_PER_PX / 2) / SUBPIXELS_PER_PX)

export const inFlashAdvances = (fontSourceRelative: string): number[] => {
  const source = readFirmwareSource(firmwarePath(fontSourceRelative))
  const advances = [...source.matchAll(/\.adv_w = (\d+)/g)].map((m) => Number(m[1]))
  return advances.filter((adv) => adv > 0).map(lvglPx)
}

export const binAdvance = (binRelative: string): number | null => {
  const path = firmwarePath(binRelative)
  if (!existsSync(path)) return null
  const bin = readFileSync(path)
  if (bin.readUInt8(BIN_HEAD.advanceBitsOffset) !== 0) return null
  const advance = bin.readUInt16LE(BIN_HEAD.defaultAdvanceOffset)
  const fixedPoint = bin.readUInt8(BIN_HEAD.advanceFormatOffset) !== 0
  return fixedPoint ? lvglPx(advance) : advance
}
