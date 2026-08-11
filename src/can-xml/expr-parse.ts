import type { Token } from './expr-tokenise.js'
import { parsePrimary } from './expr-primary.js'
import type { EvalContext } from './eval-expr.js'

export interface ParseState {
  tokens: Token[]
  pos: number
}

export type ExprFn = (ctx: EvalContext) => number

export const peek = (state: ParseState): Token | undefined => state.tokens[state.pos]

export const eat = (state: ParseState, op: string): boolean => {
  const token = peek(state)
  if (token?.kind === 'op' && token.text === op) {
    state.pos++
    return true
  }
  return false
}

type BinaryCombiner = (leftFn: ExprFn, rightFn: ExprFn) => ExprFn

const BINARY_OPS: Record<string, BinaryCombiner> = {
  '|': (leftFn, rightFn) => (ctx) => (Math.trunc(leftFn(ctx)) | Math.trunc(rightFn(ctx))) >>> 0,
  '^': (leftFn, rightFn) => (ctx) => (Math.trunc(leftFn(ctx)) ^ Math.trunc(rightFn(ctx))) >>> 0,
  '&': (leftFn, rightFn) => (ctx) => (Math.trunc(leftFn(ctx)) & Math.trunc(rightFn(ctx))) >>> 0,
  '==': (leftFn, rightFn) => (ctx) => (leftFn(ctx) === rightFn(ctx) ? 1 : 0),
  '!=': (leftFn, rightFn) => (ctx) => (leftFn(ctx) !== rightFn(ctx) ? 1 : 0),
  '<': (leftFn, rightFn) => (ctx) => (leftFn(ctx) < rightFn(ctx) ? 1 : 0),
  '<=': (leftFn, rightFn) => (ctx) => (leftFn(ctx) <= rightFn(ctx) ? 1 : 0),
  '>': (leftFn, rightFn) => (ctx) => (leftFn(ctx) > rightFn(ctx) ? 1 : 0),
  '>=': (leftFn, rightFn) => (ctx) => (leftFn(ctx) >= rightFn(ctx) ? 1 : 0),
  '<<': (leftFn, rightFn) => (ctx) => (Math.trunc(leftFn(ctx)) << Math.trunc(rightFn(ctx))) >>> 0,
  '>>': (leftFn, rightFn) => (ctx) => Math.trunc(leftFn(ctx)) >>> Math.trunc(rightFn(ctx)),
  '+': (leftFn, rightFn) => (ctx) => leftFn(ctx) + rightFn(ctx),
  '-': (leftFn, rightFn) => (ctx) => leftFn(ctx) - rightFn(ctx),
  '*': (leftFn, rightFn) => (ctx) => leftFn(ctx) * rightFn(ctx),
  '/': (leftFn, rightFn) => (ctx) => leftFn(ctx) / rightFn(ctx),
  '%': (leftFn, rightFn) => (ctx) => leftFn(ctx) % rightFn(ctx),
}

const PRECEDENCE_LEVELS: readonly (readonly string[])[] = [
  ['|'],
  ['^'],
  ['&'],
  ['==', '!='],
  ['<', '<=', '>', '>='],
  ['<<', '>>'],
  ['+', '-'],
  ['*', '/', '%'],
]

const parseUnary = (state: ParseState): ExprFn | null => {
  const token = peek(state)
  if (token?.kind === 'op' && (token.text === '+' || token.text === '-' || token.text === '!')) {
    state.pos++
    const inner = parseUnary(state)
    if (inner === null) return null
    if (token.text === '-') return (ctx) => -inner(ctx)
    if (token.text === '!') return (ctx) => (inner(ctx) === 0 ? 1 : 0)
    return inner
  }
  return parsePrimary(state)
}

const parseBinaryLevel = (state: ParseState, level: number): ExprFn | null => {
  const operators = PRECEDENCE_LEVELS[level]
  if (!operators) return parseUnary(state)
  let left = parseBinaryLevel(state, level + 1)
  while (left !== null) {
    const token = peek(state)
    if (token?.kind !== 'op' || !operators.includes(token.text)) return left
    state.pos++
    const right = parseBinaryLevel(state, level + 1)
    if (right === null) return null
    const combine = BINARY_OPS[token.text]
    if (!combine) return null
    left = combine(left, right)
  }
  return left
}

export const parseExpression = (state: ParseState): ExprFn | null => parseBinaryLevel(state, 0)
