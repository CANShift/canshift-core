import { z } from 'zod'

import { CURRENT_SCHEMA_VERSION } from '../schema-version.js'
import { migrateConfig } from '../migrations/index.js'
import { isSemverGreater } from '../migrations/semver.js'
import { asPlainObject, stripForbiddenKeys } from '../wire/plain-object.js'
import { isIntegerFormatVersion, parseJsonObject } from '../wire/parse-envelope.js'
import { MigrationError, type MigrationErrorCode } from '../migrations/errors.js'

import { ProjectSchema, type Project } from './project.js'

export const CANSHIFT_FILE_FORMAT = 'canshift'
export const CANSHIFT_FILE_FORMAT_VERSION = 1
export const CANSHIFT_FILE_EXTENSION = '.canshift'
export const CANSHIFT_FILE_MIME = 'application/json'

const CanshiftFileEnvelopeSchema = z
  .object({
    format: z.literal(CANSHIFT_FILE_FORMAT),
    formatVersion: z.number().int().positive(),
    project: z.record(z.string(), z.unknown()),
  })
  .strict()

export interface CanshiftFile {
  format: typeof CANSHIFT_FILE_FORMAT
  formatVersion: number
  project: Project
}

export type CanshiftFileResult =
  | { kind: 'ok'; project: Project; migratedFrom: string | null }
  | { kind: 'invalid_json'; raw: string }
  | { kind: 'not_an_object'; payload: unknown }
  | { kind: 'not_a_canshift_file'; payload: unknown }
  | { kind: 'unsupported_format_version'; fileVersion: number; supported: number }
  | { kind: 'schema_too_new'; fileSchemaVersion: string; supported: string }
  | { kind: 'migration_failed'; code: MigrationErrorCode; reason: string }
  | { kind: 'wrong_shape'; issues: z.core.$ZodIssue[] }

export type CanshiftFileError = Exclude<CanshiftFileResult, { kind: 'ok' }>

export const serializeCanshiftFile = (project: Project): string => {
  const validated = ProjectSchema.parse(project)
  const file: CanshiftFile = {
    format: CANSHIFT_FILE_FORMAT,
    formatVersion: CANSHIFT_FILE_FORMAT_VERSION,
    project: validated,
  }
  return JSON.stringify(file, null, 2)
}

export const parseCanshiftFile = (raw: string): CanshiftFileResult => {
  const json = parseJsonObject(raw, stripForbiddenKeys)
  if (json.kind !== 'ok') return json
  const parsed = json.value
  const record = parsed as Record<string, unknown>

  if (record.format !== CANSHIFT_FILE_FORMAT) {
    return { kind: 'not_a_canshift_file', payload: parsed }
  }
  if (
    isIntegerFormatVersion(record.formatVersion) &&
    record.formatVersion > CANSHIFT_FILE_FORMAT_VERSION
  ) {
    return {
      kind: 'unsupported_format_version',
      fileVersion: record.formatVersion,
      supported: CANSHIFT_FILE_FORMAT_VERSION,
    }
  }

  const envelope = CanshiftFileEnvelopeSchema.safeParse(parsed)
  if (!envelope.success) {
    return { kind: 'wrong_shape', issues: envelope.error.issues }
  }

  const project = envelope.data.project
  const dashboard = asPlainObject(project.dashboard)
  const dashboardVersion =
    dashboard !== null && typeof dashboard.version === 'string' ? dashboard.version : null

  if (dashboardVersion !== null && isSemverGreater(dashboardVersion, CURRENT_SCHEMA_VERSION)) {
    return {
      kind: 'schema_too_new',
      fileSchemaVersion: dashboardVersion,
      supported: CURRENT_SCHEMA_VERSION,
    }
  }

  let candidate: Record<string, unknown> = project
  if (dashboard !== null && dashboardVersion !== null) {
    try {
      const migrated = migrateConfig(dashboard, CURRENT_SCHEMA_VERSION)
      candidate = { ...project, dashboard: migrated.config }
    } catch (err) {
      return toMigrationFailure(err)
    }
  }

  const result = ProjectSchema.safeParse(candidate)
  if (!result.success) {
    return { kind: 'wrong_shape', issues: result.error.issues }
  }

  return {
    kind: 'ok',
    project: result.data,
    migratedFrom:
      dashboardVersion !== null && dashboardVersion !== CURRENT_SCHEMA_VERSION
        ? dashboardVersion
        : null,
  }
}

const toMigrationFailure = (err: unknown): CanshiftFileError => {
  if (err instanceof MigrationError) {
    return { kind: 'migration_failed', code: err.code, reason: err.message }
  }
  return {
    kind: 'migration_failed',
    code: 'registry_corrupt',
    reason: err instanceof Error ? err.message : String(err),
  }
}

const MIGRATION_FAILURE_COPY: Record<MigrationErrorCode, string> = {
  downgrade:
    'This project was saved by a newer version of CANShift and cannot be downgraded. Update CANShift to open it.',
  invalid_input:
    'The project’s dashboard is missing a usable schema version, so it cannot be upgraded.',
  not_serializable: 'The project contains values that cannot be saved, so it cannot be upgraded.',
  incomplete_chain:
    'This project cannot be upgraded to the current schema — the upgrade path is missing a step. Please report this.',
  registry_corrupt:
    'The upgrade could not run because of a defect in CANShift. Please report this.',
}

const summarizeIssues = (issues: z.core.$ZodIssue[]): string =>
  issues
    .slice(0, 3)
    .map((issue) => {
      const path = issue.path.join('.')
      return path ? `${path}: ${issue.message}` : issue.message
    })
    .join('; ')

export const describeCanshiftFileError = (error: CanshiftFileError): string => {
  switch (error.kind) {
    case 'invalid_json':
      return 'The file is not valid JSON.'
    case 'not_an_object':
      return 'The file does not contain a CANShift project.'
    case 'not_a_canshift_file':
      return 'This is not a .canshift file.'
    case 'unsupported_format_version':
      return `This file was created by a newer version of CANShift (file format v${String(error.fileVersion)}; this app supports up to v${String(error.supported)}). Update CANShift to open it.`
    case 'schema_too_new':
      return `This project uses a newer dashboard schema (${error.fileSchemaVersion}) than this app supports (${error.supported}). Update CANShift to open it.`
    case 'migration_failed':
      return MIGRATION_FAILURE_COPY[error.code]
    case 'wrong_shape':
      return `The project is malformed: ${summarizeIssues(error.issues)}`
  }
}
