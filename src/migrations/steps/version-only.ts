import type { MigrationFn } from '../types.js'

export const versionOnly =
  (toVersion: string): MigrationFn =>
  (config) => ({ ...config, version: toVersion })
