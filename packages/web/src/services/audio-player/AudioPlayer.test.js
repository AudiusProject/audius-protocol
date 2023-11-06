import { describe, it, beforeAll, expect, vitest } from 'vitest'

import AudioPlayer from './AudioPlayer'

beforeAll(() => {
  global.AudioContext = vitest.fn().mockImplementation(() => ({
    createMediaElementSource: vitest.fn().mockReturnValue({
      connect: vitest.fn()
    }),
    createGain: vitest.fn().mockReturnValue({
      connect: vitest.fn(),
      gain: {
        value: 1,
        exponentialRampToValueAtTime: vitest.fn()
      }
    })
  }))
  global.URL = {
    createObjectURL: vitest.fn()
  }
  // Set timeouts to resolve instantly.
  global.setTimeout = vitest.fn().mockImplementation((cb) => {
    cb()
  })
})

describe('play', () => {
  it('plays', () => {
    const play = vitest.fn()
    global.Audio = vitest.fn().mockImplementation(() => ({
      addEventListener: vitest.fn(),
      removeEventListener: vitest.fn(),
      dispatchEvent: vitest.fn(),
      play
    }))
    const audioStream = new AudioPlayer()
    audioStream.load(6, () => {})
    audioStream.play()

    expect(play).toHaveBeenCalled()
  })
})

describe('pause', () => {
  it('pauses', () => {
    const pause = vitest.fn()
    global.Audio = vitest.fn().mockImplementation(() => ({
      addEventListener: vitest.fn().mockImplementation((event, cb) => {
        cb()
      }),
      removeEventListener: vitest.fn(),
      dispatchEvent: vitest.fn(),
      pause
    }))
    const audioStream = new AudioPlayer()
    audioStream.load(6, () => {})
    audioStream.pause()

    expect(pause).toHaveBeenCalled()
  })
})

describe('stop', () => {
  it('stops', () => {
    const pause = vitest.fn()
    global.Audio = vitest.fn().mockImplementation(() => ({
      addEventListener: vitest.fn(),
      removeEventListener: vitest.fn(),
      dispatchEvent: vitest.fn(),
      pause
    }))
    const audioStream = new AudioPlayer()
    audioStream.load(6, () => {})
    audioStream.stop()

    expect(pause).toHaveBeenCalled()
    setTimeout(() => {
      expect(audioStream.audio.currentTime).toEqual(0)
    }, 0)
  })
})
