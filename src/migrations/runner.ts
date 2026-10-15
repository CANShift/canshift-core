import { cloneAndStripForbiddenKeys } from './config-traverse.js'
import { MigrationError } from './errors.js'
import { BUILTIN_MIGRATIONS, MIGRATION_FLOOR_VERSION } from './registry.js'
import { SEMVER_PATTERN, isSemverGreater } from './semver.js'
import type { Migration, MigrationResult } from './types.js'

const assertNoDowngrade = (fromVersion: string, toVersion: string): void => {
  if (!isSemverGreater(fromVersion, toVersion)) return
  throw new MigrationError('downgrade', `downgrade not supported: ${fromVersion} → ${toVersion}`)
}

const assertAboveFloor = (version: string): void => {
  if (!isSemverGreater(MIGRATION_FLOOR_VERSION, version)) return
  throw new MigrationError(
    'below_floor',
    `schema ${version} is older than ${MIGRATION_FLOOR_VERSION}, the oldest version that can still be upgraded`
  )
}

export const assertVersionBump = (
  produced: unknown,
  fromVersion: string,
  toVersion: string
): void => {
  if (produced !== toVersion) {
    const got = typeof produced === 'string' ? `"${produced}"` : String(produced)
    throw new MigrationError(
      'registry_corrupt',
      `Migration ${fromVersion} → ${toVersion} did not set version to "${toVersion}" (got ${got})`
    )
  }
}

const invalidInput = (message: string): MigrationError =>
  new MigrationError('invalid_input', `migrateConfig: ${message}`)

const assertValidVersion = (raw: unknown, label: string): string => {
  if (typeof raw !== 'string') {
    throw invalidInput(`${label} is not a string (got ${raw === null ? 'null' : typeof raw})`)
  }
  if (raw.length === 0) throw invalidInput(`${label} is an empty string`)
  if (!SEMVER_PATTERN.test(raw)) {
    throw invalidInput(`${label} "${raw}" does not match semver pattern "MAJOR.MINOR.PATCH"`)
  }
  return raw
}

const assertValidInputConfig = (config: Record<string, unknown>): string => {
  const raw: unknown = config
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
    throw invalidInput('input must be a non-null object')
  }
  return assertValidVersion(config.version, 'input.version')
}

const stepsBetween = (fromVersion: string, toVersion: string): Migration[] =>
  BUILTIN_MIGRATIONS.filter(
    (step) =>
      !isSemverGreater(fromVersion, step.fromVersion) && !isSemverGreater(step.toVersion, toVersion)
  )

const applyStep = (config: Record<string, unknown>, step: Migration): Record<string, unknown> => {
  const migrated = step.migrate(config)
  assertVersionBump(migrated.version, step.fromVersion, step.toVersion)
  return migrated
}

export const migrateConfig = (
  config: Record<string, unknown>,
  targetVersion: string
): MigrationResult => {
  const currentVersion = assertValidInputConfig(config)
  const target = assertValidVersion(targetVersion, 'targetVersion')
  let current = cloneAndStripForbiddenKeys(config)
  const applied: string[] = []
  if (currentVersion === target) return { config: current, applied }

  assertNoDowngrade(currentVersion, target)
  assertAboveFloor(currentVersion)

  for (const step of stepsBetween(currentVersion, target)) {
    applied.push(`${String(current.version)} → ${step.toVersion}`)
    current = applyStep(current, step)
  }
  if (current.version !== target) {
    applied.push(`${String(current.version)} → ${target}`)
    current = { ...current, version: target }
  }
  return { config: current, applied }
}
