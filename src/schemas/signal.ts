import * as z from 'zod'

import { SemVerSchema } from './common.js'
import { dropDeprecatedSignalKeys } from './deprecated-signal-keys.js'
import { Obd2PollingSchema } from './obd2.js'
import { SignalTypeSchema } from './signal-type.js'
import {
  CAN_29BIT_MAX,
  CAN_FRAME_MAX_BYTES,
  FIRMWARE_CAPS,
  STRING_CAPS,
} from '../constants/firmware-caps.js'
import {
  MAX_EXPR_LENGTH,
  MAX_EXPR_REFS,
  MAX_SIGNAL_TIMEOUT_MS,
  SAFE_EXPR_REGEX,
} from '../constants/validation.js'

const CAN_FRAME_ID_REGEX = /^0[xX][0-9a-fA-F]{1,8}$/

const BIT_MASK_REGEX = /^0[xX][0-9a-fA-F]+$/

const BIT_MASK_MAX = 0xff

const OUTBOUND_FRAME_ID_REGEX = /^0[xX][0-9a-fA-F]{1,8}$/

const SignalByteLengthSchema = z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)], {
  error: 'must be 1, 2, 3 or 4 bytes',
})

export type SignalByteLength = z.infer<typeof SignalByteLengthSchema>

export const SIGNAL_BYTE_LENGTHS: readonly SignalByteLength[] = SignalByteLengthSchema.options.map(
  (o) => o.value
)

type LevelKey = 'warningLevel' | 'dangerLevel' | 'highWarningLevel' | 'highDangerLevel'

const LEVEL_KEYS: readonly LevelKey[] = [
  'warningLevel',
  'dangerLevel',
  'highWarningLevel',
  'highDangerLevel',
]

interface SignalLevels {
  min: number
  max: number
  warningLevel?: number | undefined
  dangerLevel?: number | undefined
  highWarningLevel?: number | undefined
  highDangerLevel?: number | undefined
}

interface LevelIssue {
  path: LevelKey
  message: string
}

const outOfRangeIssue = (s: SignalLevels, key: LevelKey): LevelIssue[] => {
  const v = s[key]
  if (v === undefined) return []
  if (!(v < s.min || v > s.max)) return []
  return [
    {
      path: key,
      message: `${key} (${v.toString()}) must be within [min=${s.min.toString()}, max=${s.max.toString()}]`,
    },
  ]
}

const flatLowRampIssue = (s: SignalLevels): LevelIssue[] =>
  s.warningLevel !== undefined && s.dangerLevel !== undefined && s.warningLevel === s.dangerLevel
    ? [
        {
          path: 'dangerLevel',
          message:
            'warningLevel and dangerLevel must differ to form a monotonic ramp: ' +
            'use warningLevel < dangerLevel for high-side, ' +
            'or warningLevel > dangerLevel for low-side',
        },
      ]
    : []

const invertedHighRampIssue = (s: SignalLevels): LevelIssue[] =>
  s.highWarningLevel !== undefined &&
  s.highDangerLevel !== undefined &&
  s.highWarningLevel > s.highDangerLevel
    ? [
        {
          path: 'highDangerLevel',
          message: 'highWarningLevel must be <= highDangerLevel (high-side ramp)',
        },
      ]
    : []

const isLowSideRamp = (s: SignalLevels): boolean =>
  s.warningLevel !== undefined && s.dangerLevel !== undefined && s.dangerLevel <= s.warningLevel

const overlappingRampsIssue = (s: SignalLevels): LevelIssue[] =>
  isLowSideRamp(s) &&
  s.highDangerLevel !== undefined &&
  s.highWarningLevel !== undefined &&
  s.warningLevel !== undefined &&
  s.warningLevel >= s.highWarningLevel
    ? [
        {
          path: 'highWarningLevel',
          message: 'low-side warningLevel must be below highWarningLevel',
        },
      ]
    : []

const levelIssues = (s: SignalLevels): LevelIssue[] => [
  ...LEVEL_KEYS.flatMap((key) => outOfRangeIssue(s, key)),
  ...flatLowRampIssue(s),
  ...invertedHighRampIssue(s),
  ...overlappingRampsIssue(s),
]

const SignalDefShapeSchema = z
  .object({
    _comment: z.string().optional(),
    _batteryThresholds: z.string().optional(),
    name: z.string().max(STRING_CAPS.SIGNAL_NAME),
    canFrameId: z
      .string()
      .regex(CAN_FRAME_ID_REGEX, 'canFrameId must be hex like 0x123 or 0x1E005000 (1-8 hex chars)')
      .refine(
        (s) => Number.parseInt(s, 16) <= CAN_29BIT_MAX,
        `canFrameId must fit in 29 bits (≤ 0x${CAN_29BIT_MAX.toString(16).toUpperCase()})`
      ),
    startByte: z
      .number()
      .int()
      .min(0)
      .max(CAN_FRAME_MAX_BYTES - 1),
    byteLength: SignalByteLengthSchema,
    bigEndian: z.boolean(),
    signed: z.boolean(),
    bitMask: z
      .string()
      .regex(BIT_MASK_REGEX, 'bitMask must be a hex literal like 0xFF')
      .refine(
        (s) => Number.parseInt(s, 16) <= BIT_MASK_MAX,
        'bitMask must fit in 8 bits (≤ 0xFF, firmware stores uint8_t)'
      )
      .optional(),
    scale: z.number(),
    offset: z.number(),
    expr: z
      .string()
      .max(MAX_EXPR_LENGTH, `expr cannot exceed ${String(MAX_EXPR_LENGTH)} chars`)
      .regex(SAFE_EXPR_REGEX, 'expr contains disallowed characters')
      .optional(),
    targetId: z.number().int().nonnegative().optional(),
    exprRefs: z
      .array(z.number().int().nonnegative())
      .max(MAX_EXPR_REFS, `exprRefs cannot exceed ${String(MAX_EXPR_REFS)} entries`)
      .optional(),
    unit: z.string().max(STRING_CAPS.SIGNAL_UNIT),
    min: z.number(),
    max: z.number(),
    warningLevel: z.number().optional(),
    dangerLevel: z.number().optional(),
    highWarningLevel: z.number().optional(),
    highDangerLevel: z.number().optional(),
    timeoutMs: z.number().int().min(0).max(MAX_SIGNAL_TIMEOUT_MS),
    type: SignalTypeSchema.optional(),
    polling: Obd2PollingSchema.optional(),
  })
  .strict()
  .refine((s) => s.startByte + s.byteLength <= CAN_FRAME_MAX_BYTES, {
    message: `startByte + byteLength must fit within a ${CAN_FRAME_MAX_BYTES.toString()}-byte CAN frame`,
    path: ['byteLength'],
  })
  .refine((s) => s.min < s.max, {
    message: 'min must be less than max',
    path: ['min'],
  })
  .superRefine((s, ctx) => {
    for (const issue of levelIssues(s)) {
      ctx.addIssue({ code: 'custom' as const, message: issue.message, path: [issue.path] })
    }
  })

export const SignalDefSchema = z.preprocess(dropDeprecatedSignalKeys, SignalDefShapeSchema)

export const CanSpeedKbpsSchema = z.union([
  z.literal(125),
  z.literal(250),
  z.literal(500),
  z.literal(1000),
])

export type CanSpeedKbps = z.infer<typeof CanSpeedKbpsSchema>

const OutboundCanSignalSchema = z
  .object({
    id: z
      .string()
      .regex(OUTBOUND_FRAME_ID_REGEX, 'id must be a hex literal like 0x600 (up to 8 hex chars)')
      .refine(
        (s) => Number.parseInt(s, 16) <= CAN_29BIT_MAX,
        `id must fit in 29 bits (≤ 0x${CAN_29BIT_MAX.toString(16).toUpperCase()})`
      ),
    extended: z.boolean().optional(),
    encoding: z.string().optional(),
  })
  .strict()

export const SignalConfigSchema = z
  .object({
    _comment: z.string().optional(),
    _warning: z.string().optional(),
    _outboundWarning: z.string().optional(),
    version: SemVerSchema,
    protocol: z.string().max(STRING_CAPS.PROTOCOL),
    canSpeedKbps: CanSpeedKbpsSchema,
    out: z.record(z.string(), OutboundCanSignalSchema).optional(),
    signals: z
      .array(SignalDefSchema)
      .max(
        FIRMWARE_CAPS.MAX_SIGNALS,
        `signals cannot exceed ${String(FIRMWARE_CAPS.MAX_SIGNALS)} entries (firmware cap)`
      ),
  })
  .strict()

export type SignalDef = z.infer<typeof SignalDefSchema>
export type SignalConfig = z.infer<typeof SignalConfigSchema>
