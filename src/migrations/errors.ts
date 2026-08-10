export type MigrationErrorCode =
  'downgrade' | 'incomplete_chain' | 'registry_corrupt' | 'invalid_input' | 'not_serializable'

export class MigrationError extends Error {
  readonly code: MigrationErrorCode
  constructor(code: MigrationErrorCode, message: string, options?: { cause?: unknown }) {
    super(message, options)
    this.name = 'MigrationError'
    this.code = code
  }
}
