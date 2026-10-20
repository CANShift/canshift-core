import {
  BOARD_PROFILES,
  boardHasImu,
  getBoardProfile,
  parseBoardProfile,
  serializeBoardProfile,
} from '../board-profile/index.js'

const waveshare = getBoardProfile('waveshare_s3_28')!
const crowpanel = getBoardProfile('crowpanel_28')!

const blobWithImu = (imu: Record<string, unknown>): string => {
  const blob = JSON.parse(serializeBoardProfile(waveshare)) as {
    profile: Record<string, unknown>
  }
  blob.profile.imu = imu
  return JSON.stringify(blob)
}

const qmi = {
  driver: 'qmi8658',
  pin_sda: 11,
  pin_scl: 10,
  i2c_addr: 0x6b,
  freq_hz: 400_000,
  screen_x: '-y',
  screen_y: 'x',
  screen_z: 'z',
}

describe('board profile imu', () => {
  it('declares the IMU on the Waveshare only', () => {
    expect(BOARD_PROFILES.filter(boardHasImu).map((profile) => profile.boardId)).toEqual([
      'waveshare_s3_28',
    ])
  })

  it('reads a board with no imu section as having none', () => {
    expect(boardHasImu(crowpanel)).toBe(false)
    const parsed = parseBoardProfile(serializeBoardProfile(crowpanel))
    expect(parsed.kind === 'ok' && parsed.profile.imu).toBeUndefined()
  })

  it('treats a driver of none as no IMU', () => {
    expect(boardHasImu({ ...waveshare, imu: { ...waveshare.imu!, driver: 'none' } })).toBe(false)
  })

  it('accepts a touch section without the reset pin', () => {
    const blob = JSON.parse(serializeBoardProfile(crowpanel)) as {
      profile: { touch: Record<string, unknown> }
    }
    delete blob.profile.touch.pin_rst
    expect(parseBoardProfile(JSON.stringify(blob)).kind).toBe('ok')
  })
})

describe('board profile imu blob', () => {
  it('round-trips the imu section through a blob', () => {
    const parsed = parseBoardProfile(blobWithImu(qmi))
    expect(parsed.kind).toBe('ok')
    if (parsed.kind !== 'ok') return
    expect(parsed.profile.imu).toEqual({
      driver: 'qmi8658',
      pinSda: 11,
      pinScl: 10,
      i2cAddr: 0x6b,
      freqHz: 400_000,
      screenX: '-y',
      screenY: 'x',
      screenZ: 'z',
    })
  })

  it('rejects an axis map that names one axis twice', () => {
    const parsed = parseBoardProfile(blobWithImu({ ...qmi, screen_x: 'x', screen_y: '-x' }))
    expect(parsed.kind).toBe('wrong_shape')
  })

  it('rejects an unknown IMU driver', () => {
    expect(parseBoardProfile(blobWithImu({ ...qmi, driver: 'mpu6050' })).kind).toBe('wrong_shape')
  })
})
