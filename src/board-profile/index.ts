export {
  CHIP_FAMILIES,
  LCD_DRIVERS,
  TOUCH_DRIVERS,
  CAN_CONTROLLERS,
  BOARD_ID_MAX_LEN,
  BOARD_NAME_MAX_LEN,
  BoardProfileWireSchema,
  boardProfileFromWire,
  boardProfileToWire,
} from './board-profile.js'
export type {
  ChipFamily,
  LcdDriver,
  TouchDriver,
  CanController,
  LcdProfile,
  BacklightProfile,
  TouchProfile,
  CanProfile,
  StorageProfile,
  ConnectivityProfile,
  BoardProfile,
  BoardProfileWire,
} from './board-profile.js'
export {
  BOARD_PROFILE_MAGIC,
  BOARD_PROFILE_SCHEMA,
  BOARD_PROFILE_FORMAT_VERSION,
  serializeBoardProfile,
  parseBoardProfile,
} from './serializer.js'
export type { BoardProfileBlob, BoardProfileResult } from './serializer.js'
export { BOARD_PROFILES, getBoardProfile } from './catalog.js'
