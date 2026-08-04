import { z } from 'zod'

import { CURRENT_SCHEMA_VERSION } from '../schema-version.js'
import { migrateConfig } from '../migrations/migration-runner.js'
import { isSemverGreater } from '../migrations/semver.js'
import { isForbiddenKey } from '../wire/keymap.js'

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
  | { kind: 'migration_failed'; reason: string }
  | { kind: 'wrong_shape'; issues: z.ZodIssue[] }

export type CanshiftFileError = Exclude<CanshiftFileResult, { kind: 'ok' }>

const asPlainObject = (value: unknown): Record<string, unknown> | null =>
  typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null

const stripForbiddenKeys = (key: string, value: unknown): unknown =>
  isForbiddenKey(key) ? undefined : value

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
  let parsed: unknown
  try {
    parsed = JSON.parse(raw, stripForbiddenKeys)
  } catch {
    return { kind: 'invalid_json', raw }
  }

  const record = asPlainObject(parsed)
  if (record === null) {
    return { kind: 'not_an_object', payload: parsed }
  }
  if (record.format !== CANSHIFT_FILE_FORMAT) {
    return { kind: 'not_a_canshift_file', payload: parsed }
  }
  if (
    typeof record.formatVersion === 'number' &&
    Number.isInteger(record.formatVersion) &&
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
      return { kind: 'migration_failed', reason: err instanceof Error ? err.message : String(err) }
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

const summarizeIssues = (issues: z.ZodIssue[]): string =>
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
      return `The project could not be upgraded to the current schema: ${error.reason}`
    case 'wrong_shape':
      return `The project is malformed: ${summarizeIssues(error.issues)}`
  }
}
