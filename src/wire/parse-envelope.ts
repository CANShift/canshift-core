import * as z from 'zod'
import { findForbiddenKey } from './plain-object.js'
import { summarizeIssues } from './summarize-issues.js'

export type WireEnvelopeFailure =
  | { kind: 'invalid_json'; raw: string }
  | { kind: 'not_an_object'; payload: unknown }
  | { kind: 'wrong_shape'; issues: z.core.$ZodIssue[] }

export type WireParseFailure = WireEnvelopeFailure | { kind: 'forbidden_key'; key: string }

export const parseJsonObject = (
  raw: string,
  reviver?: (key: string, value: unknown) => unknown
): { kind: 'ok'; value: object } | WireEnvelopeFailure => {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw, reviver)
  } catch {
    return { kind: 'invalid_json', raw }
  }
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return { kind: 'not_an_object', payload: parsed }
  }
  return { kind: 'ok', value: parsed }
}

export const parseUntrustedJsonObject = (
  raw: string
): { kind: 'ok'; value: object } | WireParseFailure => {
  const json = parseJsonObject(raw)
  if (json.kind !== 'ok') return json
  const forbidden = findForbiddenKey(json.value)
  if (forbidden !== null) return { kind: 'forbidden_key', key: forbidden }
  return json
}

export const describeWireParseFailure = (failure: WireParseFailure): string => {
  switch (failure.kind) {
    case 'invalid_json':
      return 'The device sent something that is not valid JSON.'
    case 'not_an_object':
      return 'The device sent a value where an object was expected.'
    case 'forbidden_key':
      return `The device sent a payload containing a forbidden key ("${failure.key}").`
    case 'wrong_shape':
      return `The device sent a malformed payload: ${summarizeIssues(failure.issues)}`
  }
}

export const isIntegerFormatVersion = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value)
