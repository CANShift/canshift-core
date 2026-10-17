export const DEVICE_COMMANDS = {
  toggleDayNight: 'toggle_day_night',
  setDayNight: 'set_day_night',
  startCalibration: 'start_calibration',
  resetCalibration: 'reset_calibration',
  reboot: 'reboot',
  trackState: 'track_state',
  ackAlert: 'ack_alert',
} as const

export type DeviceCommand = (typeof DEVICE_COMMANDS)[keyof typeof DEVICE_COMMANDS]
