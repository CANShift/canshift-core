import * as z from 'zod'

import { camelToSnakeDeep, snakeToCamelDeep } from '../wire/keymap.js'

const CHIP_FAMILIES = ['esp32', 'esp32s3'] as const
const LCD_DRIVERS = ['ili9341', 'st7789', 'ili9488', 'gc9a01'] as const
const TOUCH_DRIVERS = ['none', 'xpt2046', 'ft6336', 'gt911', 'cst816s', 'cst3530'] as const
const CAN_CONTROLLERS = ['none', 'esp_twai'] as const
const IMU_DRIVERS = ['none', 'qmi8658'] as const
const IMU_AXES = ['x', '-x', 'y', '-y', 'z', '-z'] as const
const SD_BUSES = ['none', 'sdmmc_1bit'] as const

type ChipFamily = (typeof CHIP_FAMILIES)[number]
type LcdDriver = (typeof LCD_DRIVERS)[number]
type TouchDriver = (typeof TOUCH_DRIVERS)[number]
type CanController = (typeof CAN_CONTROLLERS)[number]
type ImuDriver = (typeof IMU_DRIVERS)[number]
type ImuAxis = (typeof IMU_AXES)[number]
type SdBus = (typeof SD_BUSES)[number]

const BOARD_ID_MAX_LEN = 48
const BOARD_NAME_MAX_LEN = 64

const Int8Schema = z.number().int().min(-128).max(127)
const UInt8Schema = z.number().int().min(0).max(255)
const UInt16Schema = z.number().int().min(0).max(65_535)
const UInt32Schema = z.number().int().min(0).max(4_294_967_295)

const LcdProfileWireSchema = z
  .object({
    driver: z.enum(LCD_DRIVERS),
    pin_mosi: Int8Schema,
    pin_miso: Int8Schema,
    pin_sclk: Int8Schema,
    pin_cs: Int8Schema,
    pin_dc: Int8Schema,
    pin_rst: Int8Schema,
    pin_bl: Int8Schema,
    freq_write_hz: UInt32Schema,
    panel_width: UInt16Schema,
    panel_height: UInt16Schema,
    memory_width: UInt16Schema,
    memory_height: UInt16Schema,
    default_rotation: UInt8Schema,
    rgb_order_bgr: z.boolean(),
    invert: z.boolean(),
    bus_shared_with_touch: z.boolean(),
    readable: z.boolean(),
    color_depth: UInt8Schema,
  })
  .strict()

const BacklightProfileWireSchema = z
  .object({
    present: z.boolean(),
    pwm_channel: UInt8Schema,
    pwm_freq_hz: UInt32Schema,
    default_duty: UInt8Schema,
    invert: z.boolean(),
  })
  .strict()

const TouchProfileWireSchema = z
  .object({
    driver: z.enum(TOUCH_DRIVERS),
    pin_cs: Int8Schema,
    pin_irq: Int8Schema,
    freq_hz: UInt32Schema,
    needs_calibration: z.boolean(),
    pin_sda: Int8Schema,
    pin_scl: Int8Schema,
    pin_rst: Int8Schema.optional(),
  })
  .strict()

const axisLetter = (axis: ImuAxis): string => axis.replace('-', '')

const namesEachAxisOnce = (imu: {
  screen_x: ImuAxis
  screen_y: ImuAxis
  screen_z: ImuAxis
}): boolean => new Set([imu.screen_x, imu.screen_y, imu.screen_z].map(axisLetter)).size === 3

const ImuProfileWireSchema = z
  .object({
    driver: z.enum(IMU_DRIVERS),
    pin_sda: Int8Schema,
    pin_scl: Int8Schema,
    i2c_addr: UInt8Schema,
    freq_hz: UInt32Schema,
    screen_x: z.enum(IMU_AXES),
    screen_y: z.enum(IMU_AXES),
    screen_z: z.enum(IMU_AXES),
  })
  .strict()
  .refine(namesEachAxisOnce, {
    message: 'imu: screen_x, screen_y and screen_z must name each axis once',
  })

const CanProfileWireSchema = z
  .object({
    controller: z.enum(CAN_CONTROLLERS),
    pin_tx: Int8Schema,
    pin_rx: Int8Schema,
    default_speed_kbps: UInt16Schema,
  })
  .strict()

const StorageProfileWireSchema = z
  .object({
    spiffs_present: z.boolean(),
    spiffs_size_kb: UInt16Schema,
    sd_present: z.boolean(),
    sd_pin_cs: Int8Schema,
    sd_bus: z.enum(SD_BUSES).optional(),
    sd_pin_clk: Int8Schema.optional(),
    sd_pin_cmd: Int8Schema.optional(),
    sd_pin_d0: Int8Schema.optional(),
    sd_pin_d3: Int8Schema.optional(),
  })
  .strict()

const ConnectivityProfileWireSchema = z
  .object({
    wifi_supported: z.boolean(),
    ble_supported: z.boolean(),
    psram_present: z.boolean(),
  })
  .strict()

export const BoardProfileWireSchema = z
  .object({
    board_id: z.string().min(1).max(BOARD_ID_MAX_LEN),
    board_name: z.string().min(1).max(BOARD_NAME_MAX_LEN),
    chip_family: z.enum(CHIP_FAMILIES),
    lcd: LcdProfileWireSchema,
    backlight: BacklightProfileWireSchema,
    touch: TouchProfileWireSchema,
    can: CanProfileWireSchema,
    storage: StorageProfileWireSchema,
    conn: ConnectivityProfileWireSchema,
    imu: ImuProfileWireSchema.optional(),
  })
  .strict()

export type BoardProfileWire = z.infer<typeof BoardProfileWireSchema>

interface LcdProfile {
  driver: LcdDriver
  pinMosi: number
  pinMiso: number
  pinSclk: number
  pinCs: number
  pinDc: number
  pinRst: number
  pinBl: number
  freqWriteHz: number
  panelWidth: number
  panelHeight: number
  memoryWidth: number
  memoryHeight: number
  defaultRotation: number
  rgbOrderBgr: boolean
  invert: boolean
  busSharedWithTouch: boolean
  readable: boolean
  colorDepth: number
}

interface BacklightProfile {
  present: boolean
  pwmChannel: number
  pwmFreqHz: number
  defaultDuty: number
  invert: boolean
}

interface TouchProfile {
  driver: TouchDriver
  pinCs: number
  pinIrq: number
  freqHz: number
  needsCalibration: boolean
  pinSda: number
  pinScl: number
  pinRst?: number
}

interface ImuProfile {
  driver: ImuDriver
  pinSda: number
  pinScl: number
  i2cAddr: number
  freqHz: number
  screenX: ImuAxis
  screenY: ImuAxis
  screenZ: ImuAxis
}

interface CanProfile {
  controller: CanController
  pinTx: number
  pinRx: number
  defaultSpeedKbps: number
}

interface StorageProfile {
  spiffsPresent: boolean
  spiffsSizeKb: number
  sdPresent: boolean
  sdPinCs: number
  sdBus?: SdBus
  sdPinClk?: number
  sdPinCmd?: number
  sdPinD0?: number
  sdPinD3?: number
}

interface ConnectivityProfile {
  wifiSupported: boolean
  bleSupported: boolean
  psramPresent: boolean
}

export interface BoardProfile {
  boardId: string
  boardName: string
  chipFamily: ChipFamily
  lcd: LcdProfile
  backlight: BacklightProfile
  touch: TouchProfile
  can: CanProfile
  storage: StorageProfile
  conn: ConnectivityProfile
  imu?: ImuProfile
}

export const boardHasImu = (profile: BoardProfile): boolean =>
  profile.imu !== undefined && profile.imu.driver !== 'none'

export const boardProfileFromWire = (wire: BoardProfileWire): BoardProfile =>
  snakeToCamelDeep(wire) as unknown as BoardProfile

export const boardProfileToWire = (profile: BoardProfile): BoardProfileWire =>
  camelToSnakeDeep(profile) as unknown as BoardProfileWire
