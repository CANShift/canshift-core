export interface Token {
  kind: 'num' | 'id' | 'op'
  text: string
}

const OPERATORS = [
  '<<',
  '>>',
  '==',
  '!=',
  '<=',
  '>=',
  '+',
  '-',
  '*',
  '/',
  '%',
  '&',
  '|',
  '^',
  '<',
  '>',
  '!',
  '(',
  ')',
  ',',
] as const

const matchOperator = (expr: string, index: number): string | null => {
  for (const op of OPERATORS) {
    if (expr.startsWith(op, index)) return op
  }
  return null
}

const matchRun = (expr: string, start: number, pattern: RegExp): number => {
  let end = start
  while (end < expr.length && pattern.test(expr[end] ?? '')) end++
  return end
}

interface ScannedToken {
  token: Token
  next: number
}

const scanToken = (expr: string, i: number): ScannedToken | null => {
  const op = matchOperator(expr, i)
  if (op !== null) return { token: { kind: 'op', text: op }, next: i + op.length }
  const c = expr[i] ?? ''
  if (c === '0' && (expr[i + 1] === 'x' || expr[i + 1] === 'X')) {
    const j = matchRun(expr, i + 2, /[0-9a-fA-F]/)
    return { token: { kind: 'num', text: expr.slice(i, j) }, next: j }
  }
  if (/[\d.]/.test(c)) {
    const j = matchRun(expr, i, /[\d.]/)
    return { token: { kind: 'num', text: expr.slice(i, j) }, next: j }
  }
  if (/[A-Za-z_]/.test(c)) {
    const j = matchRun(expr, i, /[\w]/)
    return { token: { kind: 'id', text: expr.slice(i, j) }, next: j }
  }
  return null
}

export const tokenise = (expr: string): Token[] | null => {
  const out: Token[] = []
  let i = 0
  while (i < expr.length) {
    if (/\s/.test(expr[i] ?? '')) {
      i++
      continue
    }
    const scanned = scanToken(expr, i)
    if (!scanned) return null
    out.push(scanned.token)
    i = scanned.next
  }
  return out
}

export const parseNumber = (text: string): number =>
  text.startsWith('0x') || text.startsWith('0X') ? parseInt(text.slice(2), 16) : parseFloat(text)
