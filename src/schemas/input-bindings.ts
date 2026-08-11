import { z } from 'zod'

import { ButtonActionSchema } from './widgets/button-action.js'
import { Esp32InputGpioSchema } from './device.js'
import { STRING_CAPS } from '../constants/firmware-caps.js'
import { camelToSnakeKeys, snakeToCamelKeys } from '../wire/keymap.js'
import { parseUntrustedJsonObject, type WireParseFailure } from '../wire/parse-envelope.js'

export const MAX_INPUT_BINDINGS = 16

const DEBOUNCE_MIN_MS = 1
const DEBOUNCE_MAX_MS = 500

export const INPUT_BINDING_ID_MAX_LEN = 32

const InputBindingIdSchema = z
  .string()
  .min(1, 'id is required')
  .max(
    INPUT_BINDING_ID_MAX_LEN,
    `id must be at most ${String(INPUT_BINDING_ID_MAX_LEN)} characters`
  )

export const InputActiveLevelSchema = z.enum(['low', 'high'])
export type InputActiveLevel = z.infer<typeof InputActiveLevelSchema>

export const InputPressKindSchema = z.enum(['short', 'long', 'double'])
export type InputPressKind = z.infer<typeof InputPressKindSchema>

const DebounceMsSchema = z
  .number()
  .int()
  .min(DEBOUNCE_MIN_MS, `debounce must be at least ${String(DEBOUNCE_MIN_MS)}ms`)
  .max(DEBOUNCE_MAX_MS, `debounce must be at most ${String(DEBOUNCE_MAX_MS)}ms`)

export const InputBindingWireSchema = z
  .object({
    id: InputBindingIdSchema,
    pin: Esp32InputGpioSchema,
    active: InputActiveLevelSchema,
    pullup: z.boolean(),
    debounce_ms: DebounceMsSchema,
    kind: InputPressKindSchema,
    action: ButtonActionSchema,
    signal: z.string().max(STRING_CAPS.BINDING_SIGNAL).optional(),
  })
  .strict()

export type InputBindingWire = z.infer<typeof InputBindingWireSchema>

export const InputBindingsConfigWireSchema = z
  .object({
    input_bindings: z
      .array(InputBindingWireSchema)
      .max(
        MAX_INPUT_BINDINGS,
        `input_bindings cannot exceed ${String(MAX_INPUT_BINDINGS)} entries (firmware cap)`
      ),
  })
  .strict()

export type InputBindingsConfigWire = z.infer<typeof InputBindingsConfigWireSchema>

export const InputBindingSchema = z
  .object({
    id: InputBindingIdSchema,
    pin: Esp32InputGpioSchema,
    active: InputActiveLevelSchema,
    pullup: z.boolean(),
    debounceMs: DebounceMsSchema,
    kind: InputPressKindSchema,
    action: ButtonActionSchema,
    signal: z.string().max(STRING_CAPS.BINDING_SIGNAL).optional(),
  })
  .strict()

export type InputBinding = z.infer<typeof InputBindingSchema>

export const InputBindingsConfigSchema = z
  .object({
    inputBindings: z
      .array(InputBindingSchema)
      .max(
        MAX_INPUT_BINDINGS,
        `inputBindings cannot exceed ${String(MAX_INPUT_BINDINGS)} entries (firmware cap)`
      ),
  })
  .strict()

export type InputBindingsConfig = z.infer<typeof InputBindingsConfigSchema>

const inputBindingFromWire = (wire: InputBindingWire): InputBinding =>
  snakeToCamelKeys(wire) as InputBinding

const inputBindingToWire = (binding: InputBinding): InputBindingWire =>
  camelToSnakeKeys(binding) as InputBindingWire

export const inputBindingsFromWire = (wire: InputBindingsConfigWire): InputBindingsConfig => ({
  inputBindings: wire.input_bindings.map(inputBindingFromWire),
})

export const inputBindingsToWire = (cfg: InputBindingsConfig): InputBindingsConfigWire => ({
  input_bindings: cfg.inputBindings.map(inputBindingToWire),
})

export type InputBindingsResult = { kind: 'ok'; config: InputBindingsConfig } | WireParseFailure

export const parseInputBindings = (raw: string): InputBindingsResult => {
  const json = parseUntrustedJsonObject(raw)
  if (json.kind !== 'ok') return json
  const result = InputBindingsConfigWireSchema.safeParse(json.value)
  if (!result.success) {
    return { kind: 'wrong_shape', issues: result.error.issues }
  }
  return { kind: 'ok', config: inputBindingsFromWire(result.data) }
}
