import Hls from 'hls.js'

import AudioStream from 'audio/AudioStream'

jest.mock('hls.js', () => {
  const hls = jest.fn().mockImplementation(() => ({
    loadSource: jest.fn(),
    attachMedia: jest.fn(),
    on: jest.fn()
  }))
  hls.DefaultConfig = {
    loader: jest.fn().mockImplementation(() => {})
  }
  hls.isSupported = jest.fn().mockReturnValue(true)
  hls.Events = { ERROR: jest.fn() }
  return {
    __esModule: true,
    default: hls
  }
})

beforeAll(() => {
  global.AudioContext = jest.fn().mockImplementation(() => ({
    createMediaElementSource: jest.fn().mockReturnValue({
      connect: jest.fn()
    }),
    createGain: jest.fn().mockReturnValue({
      connect: jest.fn(),
      gain: {
        value: 1,
        exponentialRampToValueAtTime: jest.fn()
      }
    })
  }))
  global.URL = {
    createObjectURL: jest.fn()
  }
  // Set timeouts to resolve instantly.
  global.setTimeout = jest.fn().mockImplementation((cb) => {
    cb()
  })
})

describe('load hls.js', () => {
  let segments
  let audioStream
  beforeEach(() => {
    segments = [
      {
        duration: '6',
        multihash: 'a'
      },
      {
        duration: '6',
        multihash: 'b'
      },
      {
        duration: '6',
        multihash: 'c'
      }
    ]
    audioStream = new AudioStream()
  })

  it('loads segments with hlsjs', () => {
    audioStream.load(segments, () => {})

    expect(audioStream.hls.loadSource).toBeCalled()
    expect(audioStream.hls.attachMedia).toBeCalledWith(audioStream.audio)
    expect(audioStream.duration).toEqual(18)
  })
})

describe('load native hls', () => {
  let segments
  let audioStream
  beforeEach(() => {
    Hls.isSupported = jest.fn().mockReturnValue(false)

    segments = [
      {
        duration: '6',
        multihash: 'a'
      },
      {
        duration: '6',
        multihash: 'b'
      },
      {
        duration: '6',
        multihash: 'c'
      }
    ]
    audioStream = new AudioStream()
  })

  it('loads segments with native hls', () => {
    audioStream.load(segments, () => {})

    expect(audioStream.audio.src).toEqual(
      expect.stringContaining('data:application/vnd.apple.mpegURL;')
    )
    expect(audioStream.duration).toEqual(18)
  })

  it('sets up event listeners', () => {
    const onEnd = jest.fn()
    audioStream.load(segments, onEnd)
    const onBufferingChange = jest.fn()
    audioStream.onBufferingChange = onBufferingChange

    audioStream.audio.dispatchEvent(new Event('waiting'))
    expect(audioStream.buffering).toEqual(true)
    expect(onBufferingChange).toBeCalledWith(true)

    audioStream.audio.dispatchEvent(new Event('canplay'))
    expect(audioStream.buffering).toEqual(false)
    expect(onBufferingChange).toBeCalledWith(false)

    audioStream.audio.dispatchEvent(new Event('ended'))
    expect(onEnd).toBeCalled()
  })
})

describe('play', () => {
  it('plays', () => {
    const play = jest.fn()
    global.Audio = jest.fn().mockImplementation(() => ({
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
      play
    }))
    const audioStream = new AudioStream()
    audioStream.load([{ duration: 6 }], () => {})
    audioStream.play()

    expect(play).toBeCalled()
  })
})

describe('pause', () => {
  it('pauses', () => {
    const pause = jest.fn()
    global.Audio = jest.fn().mockImplementation(() => ({
      addEventListener: jest.fn().mockImplementation((event, cb) => {
        cb()
      }),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
      pause
    }))
    const audioStream = new AudioStream()
    audioStream.load([{ duration: 6 }], () => {})
    audioStream.pause()

    expect(pause).toBeCalled()
  })
})

describe('stop', () => {
  it('stops', () => {
    const pause = jest.fn()
    global.Audio = jest.fn().mockImplementation(() => ({
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
      pause
    }))
    const audioStream = new AudioStream()
    audioStream.load([{ duration: 6 }], () => {})
    audioStream.stop()

    expect(pause).toBeCalled()
    setTimeout(() => {
      expect(audioStream.audio.currentTime).toEqual(0)
    }, 0)
  })
})
