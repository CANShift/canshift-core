import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export const FIRMWARE_ROOT = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../../../canshift-firmware'
)

export const firmwarePath = (relative: string): string => resolve(FIRMWARE_ROOT, relative)

export const readFirmwareSource = (path: string): string =>
  existsSync(path) ? readFileSync(path, 'utf8') : ''

export const firmwareConstant = (source: string, name: string): number | null => {
  const match = new RegExp(
    `constexpr\\s+[\\w:]+\\s+${name}\\s*=\\s*(0x[0-9a-fA-F]+|\\d+(?:\\.\\d+)?)f?;`
  ).exec(source)
  return match ? Number(match[1]) : null
}
