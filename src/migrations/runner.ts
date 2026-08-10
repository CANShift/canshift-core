import { cloneAndStripForbiddenKeys } from './helpers.js'
import { MigrationError } from './errors.js'
import { MIGRATIONS } from './registry.js'
import { SEMVER_PATTERN, isSemverGreater } from './semver.js'
import type { Migration, MigrationRegistry, MigrationResult } from './types.js'

const assertNoDowngrade = (fromVersion: string, toVersion: string): void => {
  if (!SEMVER_PATTERN.test(fromVersion) || !SEMVER_PATTERN.test(toVersion)) return
  if (!isSemverGreater(fromVersion, toVersion)) return
  throw new MigrationError('downgrade', `downgrade not supported: ${fromVersion} → ${toVersion}`)
}

interface RegistryWalk {
  chain: Migration[]
  missing: string[]
}

const walkRegistry = (
  fromVersion: string,
  toVersion: string,
  registry: MigrationRegistry
): RegistryWalk => {
  const chain: Migration[] = []
  const missing: string[] = []
  let current = fromVersion

  while (current !== toVersion) {
    if (chain.length > registry.length) {
      throw new MigrationError(
        'registry_corrupt',
        `Migration walk from ${fromVersion} to ${toVersion} exceeded ${String(registry.length)} steps — cyclic or self-referential registry`
      )
    }
    const next = registry.find((m) => m.fromVersion === current)
    if (!next) {
      missing.push(`${current}→${toVersion}`)
      break
    }
    chain.push(next)
    current = next.toVersion
  }

  return { chain, missing }
}

const assertUniqueFromVersions = (registry: MigrationRegistry): void => {
  const seen = new Set<string>()
  for (const migration of registry) {
    if (seen.has(migration.fromVersion)) {
      throw new MigrationError(
        'registry_corrupt',
        `Migration registry has a duplicate fromVersion "${migration.fromVersion}" — ambiguous chain`
      )
    }
    seen.add(migration.fromVersion)
  }
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

export const validateMigrationChain = (
  fromVersion: string,
  toVersion: string,
  registry: MigrationRegistry
): string[] => {
  assertNoDowngrade(fromVersion, toVersion)
  assertUniqueFromVersions(registry)
  return walkRegistry(fromVersion, toVersion, registry).missing
}

const invalidInput = (message: string): MigrationError =>
  new MigrationError('invalid_input', `migrateConfig: ${message}`)

const assertValidInputConfig = (config: Record<string, unknown>): string => {
  const raw: unknown = config
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
    throw invalidInput('input must be a non-null object')
  }
  const rawVersion: unknown = config.version
  if (typeof rawVersion !== 'string') {
    throw invalidInput(
      `input.version is not a string (got ${rawVersion === null ? 'null' : typeof rawVersion})`
    )
  }
  if (rawVersion.length === 0) throw invalidInput('input.version is an empty string')
  if (!SEMVER_PATTERN.test(rawVersion)) {
    throw invalidInput(
      `input.version "${rawVersion}" does not match semver pattern "MAJOR.MINOR.PATCH"`
    )
  }
  return rawVersion
}

export const migrateConfig = (
  config: Record<string, unknown>,
  targetVersion: string
): MigrationResult => {
  const currentVersion = assertValidInputConfig(config)
  let current = cloneAndStripForbiddenKeys(config)
  const applied: string[] = []

  if (currentVersion === targetVersion) {
    return { config: current, applied }
  }

  assertNoDowngrade(currentVersion, targetVersion)

  assertUniqueFromVersions(MIGRATIONS)

  const { chain, missing } = walkRegistry(currentVersion, targetVersion, MIGRATIONS)
  if (missing.length > 0) {
    throw new MigrationError(
      'incomplete_chain',
      `Migration chain incomplete: missing steps [${missing.join(', ')}]`
    )
  }

  for (const migration of chain) {
    current = migration.migrate(current)
    assertVersionBump(current.version, migration.fromVersion, migration.toVersion)
    applied.push(`${migration.fromVersion} → ${migration.toVersion}`)
  }

  return { config: current, applied }
}
