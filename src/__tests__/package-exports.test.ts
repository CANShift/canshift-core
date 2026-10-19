import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const PACKAGE_JSON = fileURLToPath(new URL('../../package.json', import.meta.url))
const ENTRIES_DIR = fileURLToPath(new URL('../entries', import.meta.url))
const INDEX = fileURLToPath(new URL('../index.ts', import.meta.url))

interface ExportTarget {
  types: string
  import: string
  default: string
}

const packageExports = (): Record<string, ExportTarget> =>
  (JSON.parse(readFileSync(PACKAGE_JSON, 'utf8')) as { exports: Record<string, ExportTarget> })
    .exports

const entryNames = (): string[] =>
  readdirSync(ENTRIES_DIR)
    .filter((file) => file.endsWith('.ts'))
    .map((file) => file.replace(/\.ts$/, ''))
    .sort()

describe('package subpath exports', () => {
  it('publishes one subpath per entry file', () => {
    const subpaths = Object.keys(packageExports())
      .filter((key) => key !== '.')
      .map((key) => key.replace(/^\.\//, ''))
      .sort()
    expect(subpaths).toEqual(entryNames())
  })

  it.each(entryNames())('points %s at its built entry', (name) => {
    expect(packageExports()[`./${name}`]).toEqual({
      types: `./dist/entries/${name}.d.ts`,
      import: `./dist/entries/${name}.js`,
      default: `./dist/entries/${name}.js`,
    })
  })

  it.each(entryNames())('re-exports %s from the package root', (name) => {
    expect(readFileSync(INDEX, 'utf8')).toContain(`export * from './entries/${name}.js'`)
  })
})
