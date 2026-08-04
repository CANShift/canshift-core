import { z } from 'zod'

export const CHIP_FAMILIES = ['esp32', 'esp32s3'] as const
export const LCD_DRIVERS = ['ili9341', 'st7789', 'ili9488', 'gc9a01'] as const
export const TOUCH_DRIVERS = ['none', 'xpt2046', 'ft6336', 'gt911', 'cst816s'] as const
export const CAN_CONTROLLERS = ['none', 'esp_twai'] as const

export type ChipFamily = (typeof CHIP_FAMILIES)[number]
export type LcdDriver = (typeof LCD_DRIVERS)[number]
export type TouchDriver = (typeof TOUCH_DRIVERS)[number]
export type CanController = (typeof CAN_CONTROLLERS)[number]

export const BOARD_ID_MAX_LEN = 48
export const BOARD_NAME_MAX_LEN = 64

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
  })
  .strict()

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
  })
  .strict()

export type BoardProfileWire = z.infer<typeof BoardProfileWireSchema>

export interface LcdProfile {
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

export interface BacklightProfile {
  present: boolean
  pwmChannel: number
  pwmFreqHz: number
  defaultDuty: number
  invert: boolean
}

export interface TouchProfile {
  driver: TouchDriver
  pinCs: number
  pinIrq: number
  freqHz: number
  needsCalibration: boolean
  pinSda: number
  pinScl: number
}

export interface CanProfile {
  controller: CanController
  pinTx: number
  pinRx: number
  defaultSpeedKbps: number
}

export interface StorageProfile {
  spiffsPresent: boolean
  spiffsSizeKb: number
  sdPresent: boolean
  sdPinCs: number
}

export interface ConnectivityProfile {
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
}

const lcdFromWire = (w: BoardProfileWire['lcd']): LcdProfile => ({
  driver: w.driver,
  pinMosi: w.pin_mosi,
  pinMiso: w.pin_miso,
  pinSclk: w.pin_sclk,
  pinCs: w.pin_cs,
  pinDc: w.pin_dc,
  pinRst: w.pin_rst,
  pinBl: w.pin_bl,
  freqWriteHz: w.freq_write_hz,
  panelWidth: w.panel_width,
  panelHeight: w.panel_height,
  memoryWidth: w.memory_width,
  memoryHeight: w.memory_height,
  defaultRotation: w.default_rotation,
  rgbOrderBgr: w.rgb_order_bgr,
  invert: w.invert,
  busSharedWithTouch: w.bus_shared_with_touch,
  readable: w.readable,
  colorDepth: w.color_depth,
})

const lcdToWire = (l: LcdProfile): BoardProfileWire['lcd'] => ({
  driver: l.driver,
  pin_mosi: l.pinMosi,
  pin_miso: l.pinMiso,
  pin_sclk: l.pinSclk,
  pin_cs: l.pinCs,
  pin_dc: l.pinDc,
  pin_rst: l.pinRst,
  pin_bl: l.pinBl,
  freq_write_hz: l.freqWriteHz,
  panel_width: l.panelWidth,
  panel_height: l.panelHeight,
  memory_width: l.memoryWidth,
  memory_height: l.memoryHeight,
  default_rotation: l.defaultRotation,
  rgb_order_bgr: l.rgbOrderBgr,
  invert: l.invert,
  bus_shared_with_touch: l.busSharedWithTouch,
  readable: l.readable,
  color_depth: l.colorDepth,
})

const backlightFromWire = (w: BoardProfileWire['backlight']): BacklightProfile => ({
  present: w.present,
  pwmChannel: w.pwm_channel,
  pwmFreqHz: w.pwm_freq_hz,
  defaultDuty: w.default_duty,
  invert: w.invert,
})

const backlightToWire = (b: BacklightProfile): BoardProfileWire['backlight'] => ({
  present: b.present,
  pwm_channel: b.pwmChannel,
  pwm_freq_hz: b.pwmFreqHz,
  default_duty: b.defaultDuty,
  invert: b.invert,
})

const touchFromWire = (w: BoardProfileWire['touch']): TouchProfile => ({
  driver: w.driver,
  pinCs: w.pin_cs,
  pinIrq: w.pin_irq,
  freqHz: w.freq_hz,
  needsCalibration: w.needs_calibration,
  pinSda: w.pin_sda,
  pinScl: w.pin_scl,
})

const touchToWire = (t: TouchProfile): BoardProfileWire['touch'] => ({
  driver: t.driver,
  pin_cs: t.pinCs,
  pin_irq: t.pinIrq,
  freq_hz: t.freqHz,
  needs_calibration: t.needsCalibration,
  pin_sda: t.pinSda,
  pin_scl: t.pinScl,
})

const canFromWire = (w: BoardProfileWire['can']): CanProfile => ({
  controller: w.controller,
  pinTx: w.pin_tx,
  pinRx: w.pin_rx,
  defaultSpeedKbps: w.default_speed_kbps,
})

const canToWire = (c: CanProfile): BoardProfileWire['can'] => ({
  controller: c.controller,
  pin_tx: c.pinTx,
  pin_rx: c.pinRx,
  default_speed_kbps: c.defaultSpeedKbps,
})

const storageFromWire = (w: BoardProfileWire['storage']): StorageProfile => ({
  spiffsPresent: w.spiffs_present,
  spiffsSizeKb: w.spiffs_size_kb,
  sdPresent: w.sd_present,
  sdPinCs: w.sd_pin_cs,
})

const storageToWire = (s: StorageProfile): BoardProfileWire['storage'] => ({
  spiffs_present: s.spiffsPresent,
  spiffs_size_kb: s.spiffsSizeKb,
  sd_present: s.sdPresent,
  sd_pin_cs: s.sdPinCs,
})

const connFromWire = (w: BoardProfileWire['conn']): ConnectivityProfile => ({
  wifiSupported: w.wifi_supported,
  bleSupported: w.ble_supported,
  psramPresent: w.psram_present,
})

const connToWire = (c: ConnectivityProfile): BoardProfileWire['conn'] => ({
  wifi_supported: c.wifiSupported,
  ble_supported: c.bleSupported,
  psram_present: c.psramPresent,
})

export const boardProfileFromWire = (wire: BoardProfileWire): BoardProfile => ({
  boardId: wire.board_id,
  boardName: wire.board_name,
  chipFamily: wire.chip_family,
  lcd: lcdFromWire(wire.lcd),
  backlight: backlightFromWire(wire.backlight),
  touch: touchFromWire(wire.touch),
  can: canFromWire(wire.can),
  storage: storageFromWire(wire.storage),
  conn: connFromWire(wire.conn),
})

export const boardProfileToWire = (profile: BoardProfile): BoardProfileWire => ({
  board_id: profile.boardId,
  board_name: profile.boardName,
  chip_family: profile.chipFamily,
  lcd: lcdToWire(profile.lcd),
  backlight: backlightToWire(profile.backlight),
  touch: touchToWire(profile.touch),
  can: canToWire(profile.can),
  storage: storageToWire(profile.storage),
  conn: connToWire(profile.conn),
})
