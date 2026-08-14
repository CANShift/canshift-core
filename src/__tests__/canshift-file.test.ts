import {
  CANSHIFT_FILE_FORMAT,
  CANSHIFT_FILE_FORMAT_VERSION,
  CURRENT_SCHEMA_VERSION,
  PROJECT_FILE_VERSION,
  describeCanshiftFileError,
  parseCanshiftFile,
  serializeCanshiftFile,
  type CanshiftFileError,
  type Project,
} from '../index.js'

const dashboardAt = (version: string): Record<string, unknown> => ({
  version,
  name: 'Test',
  defaultPageId: 'p1',
  revLimitRpm: 7000,
  topBar: { height: 16, bgColor: '#000000', textColor: '#FFFFFF' },
  pages: [
    {
      id: 'p1',
      backgroundImage: null,
      backgroundColor: '#000000',
      showTopBar: true,
      visible: true,
      widgets: [],
    },
  ],
})

const projectAt = (version: string): Record<string, unknown> => ({
  projectVersion: PROJECT_FILE_VERSION,
  id: 'proj_1',
  name: 'My car',
  createdAt: '2026-08-02T12:00:00.000Z',
  updatedAt: '2026-08-02T12:00:00.000Z',
  dashboard: dashboardAt(version),
  ecuProfileKey: 'builtin:maxxecu-street',
  signals: [],
})

const currentProject = projectAt(CURRENT_SCHEMA_VERSION) as unknown as Project

const fileWith = (
  project: Record<string, unknown>,
  formatVersion = CANSHIFT_FILE_FORMAT_VERSION
): string => JSON.stringify({ format: CANSHIFT_FILE_FORMAT, formatVersion, project })

describe('serializeCanshiftFile / parseCanshiftFile round-trip', () => {
  it('round-trips a current-version project to a byte-equivalent file', () => {
    const serialized = serializeCanshiftFile(currentProject)
    const result = parseCanshiftFile(serialized)
    expect(result.kind).toBe('ok')
    if (result.kind === 'ok') {
      expect(result.migratedFrom).toBeNull()
      expect(serializeCanshiftFile(result.project)).toBe(serialized)
    }
  })

  it('wraps the project in the canshift envelope', () => {
    const envelope = JSON.parse(serializeCanshiftFile(currentProject)) as Record<string, unknown>
    expect(envelope.format).toBe(CANSHIFT_FILE_FORMAT)
    expect(envelope.formatVersion).toBe(CANSHIFT_FILE_FORMAT_VERSION)
    expect((envelope.project as Record<string, unknown>).id).toBe('proj_1')
  })
})

describe('parseCanshiftFile migration', () => {
  it('migrates an older-schema project up to the current version', () => {
    const result = parseCanshiftFile(fileWith(projectAt('1.26.0')))
    expect(result.kind).toBe('ok')
    if (result.kind === 'ok') {
      expect(result.migratedFrom).toBe('1.26.0')
      expect((result.project.dashboard as { version: string }).version).toBe(CURRENT_SCHEMA_VERSION)
    }
  })

  it('reports migration failure for an unreachable ancient version', () => {
    const result = parseCanshiftFile(fileWith(projectAt('0.0.1')))
    expect(result.kind).toBe('migration_failed')
  })
})

describe('parseCanshiftFile rejection paths', () => {
  it('flags invalid JSON', () => {
    expect(parseCanshiftFile('{not json').kind).toBe('invalid_json')
  })

  it('flags non-object payloads', () => {
    expect(parseCanshiftFile('42').kind).toBe('not_an_object')
    expect(parseCanshiftFile('[1,2]').kind).toBe('not_an_object')
  })

  it('flags JSON that is not a canshift file', () => {
    expect(parseCanshiftFile(JSON.stringify({ hello: 'world' })).kind).toBe('not_a_canshift_file')
  })

  it('flags a malformed project with readable issues', () => {
    const badProject = { ...projectAt(CURRENT_SCHEMA_VERSION), name: '' }
    const result = parseCanshiftFile(fileWith(badProject))
    expect(result.kind).toBe('wrong_shape')
  })

  it('rejects an unknown top-level project key (strict)', () => {
    const result = parseCanshiftFile(fileWith({ ...projectAt(CURRENT_SCHEMA_VERSION), evil: 1 }))
    expect(result.kind).toBe('wrong_shape')
  })
})

describe('parseCanshiftFile forward-compatibility', () => {
  it('rejects a newer envelope format version', () => {
    const result = parseCanshiftFile(fileWith(projectAt(CURRENT_SCHEMA_VERSION), 2))
    expect(result.kind).toBe('unsupported_format_version')
    if (result.kind === 'unsupported_format_version') {
      expect(result.fileVersion).toBe(2)
      expect(result.supported).toBe(CANSHIFT_FILE_FORMAT_VERSION)
    }
  })

  it('rejects a project whose dashboard schema is newer than supported', () => {
    const result = parseCanshiftFile(fileWith(projectAt('1.99.0')))
    expect(result.kind).toBe('schema_too_new')
    if (result.kind === 'schema_too_new') {
      expect(result.fileSchemaVersion).toBe('1.99.0')
      expect(result.supported).toBe(CURRENT_SCHEMA_VERSION)
    }
  })
})

describe('parseCanshiftFile prototype-pollution hardening', () => {
  it('strips a __proto__ key without polluting Object.prototype', () => {
    const raw = `{"format":"${CANSHIFT_FILE_FORMAT}","formatVersion":${String(CANSHIFT_FILE_FORMAT_VERSION)},"project":${JSON.stringify(projectAt(CURRENT_SCHEMA_VERSION))},"__proto__":{"polluted":true}}`
    const result = parseCanshiftFile(raw)
    expect(result.kind).toBe('ok')
    expect(({} as Record<string, unknown>).polluted).toBeUndefined()
  })

  it('strips a nested __proto__ inside the project without polluting', () => {
    const project = { ...projectAt(CURRENT_SCHEMA_VERSION) }
    const raw = JSON.stringify({
      format: CANSHIFT_FILE_FORMAT,
      formatVersion: CANSHIFT_FILE_FORMAT_VERSION,
      project,
    }).replace('"projectVersion"', '"__proto__":{"polluted":true},"projectVersion"')
    const result = parseCanshiftFile(raw)
    expect(result.kind).toBe('ok')
    expect(({} as Record<string, unknown>).polluted).toBeUndefined()
  })
})

describe('a project saved before colorRamp was dropped', () => {
  const legacySignal = {
    name: 'coolant',
    canFrameId: '0x370',
    startByte: 0,
    byteLength: 2,
    bigEndian: false,
    signed: false,
    scale: 1,
    offset: 0,
    unit: 'C',
    min: 0,
    max: 120,
    timeoutMs: 1000,
    colorRamp: {
      stops: [
        { value: 0, color: '#00FF00' },
        { value: 110, color: '#FF0000' },
      ],
      interpolate: 'linear',
    },
  }

  const legacyFile = (): string =>
    JSON.stringify({
      format: CANSHIFT_FILE_FORMAT,
      formatVersion: CANSHIFT_FILE_FORMAT_VERSION,
      project: { ...projectAt(CURRENT_SCHEMA_VERSION), signals: [legacySignal] },
    })

  it('still opens', () => {
    expect(parseCanshiftFile(legacyFile()).kind).toBe('ok')
  })

  it('comes back without the dropped field', () => {
    const result = parseCanshiftFile(legacyFile())
    if (result.kind !== 'ok') throw new Error(`expected ok, got ${result.kind}`)
    expect(result.project.signals[0]).not.toHaveProperty('colorRamp')
    expect(result.project.signals[0]?.name).toBe('coolant')
  })

  it('does not write the field back out on the next save', () => {
    const result = parseCanshiftFile(legacyFile())
    if (result.kind !== 'ok') throw new Error(`expected ok, got ${result.kind}`)
    expect(serializeCanshiftFile(result.project)).not.toContain('colorRamp')
  })
})

describe('describeCanshiftFileError', () => {
  it('produces a readable message for every error kind', () => {
    const errors: CanshiftFileError[] = [
      { kind: 'invalid_json', raw: '' },
      { kind: 'not_an_object', payload: 42 },
      { kind: 'not_a_canshift_file', payload: {} },
      { kind: 'unsupported_format_version', fileVersion: 2, supported: 1 },
      { kind: 'schema_too_new', fileSchemaVersion: '1.99.0', supported: CURRENT_SCHEMA_VERSION },
      { kind: 'migration_failed', code: 'incomplete_chain', reason: 'chain incomplete' },
      { kind: 'migration_failed', code: 'downgrade', reason: 'downgrade not supported' },
      { kind: 'wrong_shape', issues: [] },
    ]
    for (const error of errors) {
      expect(describeCanshiftFileError(error).length).toBeGreaterThan(0)
    }
  })
})
