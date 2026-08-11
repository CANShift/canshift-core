import { MAX_EXPR_LENGTH } from '../constants/validation.js'
import { tokenise } from './expr-tokenise.js'
import { parseExpression } from './expr-parse.js'
import type { ExprFn, ParseState } from './expr-parse.js'

export interface EvalContext {
  v: number
  bytes: readonly number[]
  refs?: ReadonlyMap<number, number>
}

export const compileExpr = (expr: string): ExprFn | null => {
  if (expr.length > MAX_EXPR_LENGTH) return null
  const tokens = tokenise(expr)
  if (!tokens || tokens.length === 0) return null
  const state: ParseState = { tokens, pos: 0 }
  const root = parseExpression(state)
  if (root === null || state.pos !== tokens.length) return null
  return root
}

export const evalExprChecked = (expr: string, ctx: EvalContext): number | null => {
  const fn = compileExpr(expr)
  if (!fn) return null
  const result = fn(ctx)
  return Number.isFinite(result) ? result : null
}

export const evalExpr = (expr: string, ctx: EvalContext): number => evalExprChecked(expr, ctx) ?? 0
