import type * as z from 'zod'

const SUMMARIZED_ISSUE_COUNT = 3

export const summarizeIssues = (issues: readonly z.core.$ZodIssue[]): string =>
  issues
    .slice(0, SUMMARIZED_ISSUE_COUNT)
    .map((issue) => {
      const path = issue.path.join('.')
      return path ? `${path}: ${issue.message}` : issue.message
    })
    .join('; ')
