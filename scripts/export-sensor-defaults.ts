import { SENSOR_DEFAULT_RAMPS } from '../dist/sensor-defaults.js'

const sorted = Object.fromEntries(
  Object.entries(SENSOR_DEFAULT_RAMPS).sort(([a], [b]) => a.localeCompare(b))
)

process.stdout.write(JSON.stringify(sorted, null, 2) + '\n')
