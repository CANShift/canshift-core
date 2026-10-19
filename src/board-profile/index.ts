export { boardProfileFromWire, boardProfileToWire } from './board-profile.js'
export {
  BOARD_PROFILE_MAGIC,
  BOARD_PROFILE_SCHEMA,
  BOARD_PROFILE_FORMAT_VERSION,
  serializeBoardProfile,
  parseBoardProfile,
} from './serializer.js'
export type { BoardProfileBlob } from './serializer.js'
export { BOARD_PROFILES, getBoardProfile } from './catalog.js'
