export type { TrackTelemetry } from '../schemas/track-telemetry.js'
export { TrackTelemetrySchema } from '../schemas/track-telemetry.js'
export type {
  LapCrossingDetector,
  LapCrossingDetectorOptions,
  LineSegment,
} from '../track/lap-detection.js'
export { createLapCrossingDetector } from '../track/lap-detection.js'
export { startFinishLineFromPosition } from '../track/start-finish-line.js'
