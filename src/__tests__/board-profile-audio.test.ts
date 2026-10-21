import { describe, expect, it } from 'vitest'

import {
  BOARD_PROFILES,
  getBoardProfile,
  parseBoardProfile,
  serializeBoardProfile,
} from '../board-profile/index.js'

const waveshare = getBoardProfile('waveshare_s3_28')!
const crowpanel = getBoardProfile('crowpanel_28')!

const blobWithAudio = (audio: unknown): string => {
  const blob = JSON.parse(serializeBoardProfile(crowpanel)) as {
    profile: Record<string, unknown>
  }
  blob.profile.audio = audio
  return JSON.stringify(blob)
}

const speaker = { present: true, pin_bck: 48, pin_ws: 38, pin_dout: 47 }

describe('board profile audio', () => {
  it('declares a speaker on the Waveshare only', () => {
    expect(
      BOARD_PROFILES.filter((profile) => profile.audio?.present).map((profile) => profile.boardId)
    ).toEqual(['waveshare_s3_28'])
  })

  it('reads a board with no audio section as silent', () => {
    const parsed = parseBoardProfile(serializeBoardProfile(crowpanel))
    expect(parsed.kind === 'ok' && parsed.profile.audio).toBeUndefined()
  })

  it('round-trips the catalog speaker through a blob', () => {
    const parsed = parseBoardProfile(serializeBoardProfile(waveshare))
    expect(parsed.kind === 'ok' && parsed.profile.audio).toEqual({
      present: true,
      pinBck: 48,
      pinWs: 38,
      pinDout: 47,
    })
  })

  it('accepts a section that declares no speaker', () => {
    const silent = { present: false, pin_bck: -1, pin_ws: -1, pin_dout: -1 }
    expect(parseBoardProfile(blobWithAudio(silent)).kind).toBe('ok')
  })
})

describe('board profile audio rejections', () => {
  it('rejects a present speaker with an unwired pin', () => {
    expect(parseBoardProfile(blobWithAudio({ ...speaker, pin_ws: -1 })).kind).toBe('wrong_shape')
  })

  it('rejects a section missing a pin', () => {
    const missing = { present: true, pin_bck: 48, pin_ws: 38 }
    expect(parseBoardProfile(blobWithAudio(missing)).kind).toBe('wrong_shape')
  })

  it('rejects an unknown audio field', () => {
    expect(parseBoardProfile(blobWithAudio({ ...speaker, pin_mclk: 1 })).kind).toBe('wrong_shape')
  })

  it('rejects an audio section that is not an object', () => {
    expect(parseBoardProfile(blobWithAudio(true)).kind).toBe('wrong_shape')
  })
})
