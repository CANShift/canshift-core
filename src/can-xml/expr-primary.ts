import { parseNumber } from './expr-tokenise.js'
import { eat, parseExpression, peek } from './expr-parse.js'
import type { ExprFn, ParseState } from './expr-parse.js'
import type { EvalContext } from './eval-expr.js'

const readByte = (ctx: EvalContext, index: number): number => ctx.bytes[index] ?? 0

const FN_IMPLS: Record<string, (value: number) => number> = {
  Floor: Math.floor,
  Ceil: Math.ceil,
  Round: Math.round,
}

const parseFnCall = (state: ParseState, fnName: string): ExprFn | null => {
  const impl = FN_IMPLS[fnName]
  if (!impl) return null
  state.pos++
  if (!eat(state, '(')) return null
  const arg = parseExpression(state)
  if (arg === null || !eat(state, ')')) return null
  return (ctx) => impl(arg(ctx))
}

const parseIdentifier = (state: ParseState, text: string): ExprFn | null => {
  if (text === 'V') {
    state.pos++
    return (ctx) => ctx.v
  }
  if (/^B[0-7]$/.test(text)) {
    const idx = parseInt(text.slice(1), 10)
    state.pos++
    return (ctx) => readByte(ctx, idx)
  }
  if (/^ID\d+$/i.test(text)) {
    const targetId = parseInt(text.slice(2), 10)
    state.pos++
    return (ctx) => ctx.refs?.get(targetId) ?? NaN
  }
  return parseFnCall(state, text)
}

export const parsePrimary = (state: ParseState): ExprFn | null => {
  const token = peek(state)
  if (token === undefined) return null
  if (token.kind === 'op' && token.text === '(') {
    state.pos++
    const inner = parseExpression(state)
    if (inner === null || !eat(state, ')')) return null
    return inner
  }
  if (token.kind === 'num') {
    const n = parseNumber(token.text)
    if (!Number.isFinite(n)) return null
    state.pos++
    return () => n
  }
  if (token.kind === 'id') {
    return parseIdentifier(state, token.text)
  }
  return null
}
