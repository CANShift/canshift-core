import * as z from 'zod'

import { STRING_CAPS } from '../constants/firmware-caps.js'

const PageButtonSignalSchema = z
  .string()
  .min(1, 'page button signal must be a non-empty string')
  .max(STRING_CAPS.SIGNAL_NAME)

export const PageButtonsSchema = z
  .object({
    next: PageButtonSignalSchema.optional(),
    previous: PageButtonSignalSchema.optional(),
  })
  .strict()

export type PageButtons = z.infer<typeof PageButtonsSchema>
export type PageButtonRole = keyof PageButtons
