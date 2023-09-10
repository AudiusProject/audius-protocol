import AudioPlayer from './AudioPlayer'

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

describe('play', () => {
  it('plays', () => {
    const play = jest.fn()
    global.Audio = jest.fn().mockImplementation(() => ({
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
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
    const pause = jest.fn()
    global.Audio = jest.fn().mockImplementation(() => ({
      addEventListener: jest.fn().mockImplementation((event, cb) => {
        cb()
      }),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
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
    const pause = jest.fn()
    global.Audio = jest.fn().mockImplementation(() => ({
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
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
