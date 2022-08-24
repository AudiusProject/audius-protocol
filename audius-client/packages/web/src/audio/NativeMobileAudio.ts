import { TrackSegment, AudioInfo } from '@audius/common'

import {
  PlayTrackMessage,
  PauseTrackMessage,
  GetPositionMessage,
  SeekMessage
} from 'services/native-mobile-interface/player'
import { generateM3U8Variants } from 'utils/hlsUtil'

const PUBLIC_IPFS_GATEWAY = 'http://cloudflare-ipfs.com/ipfs/'

class NativeMobileAudio {
  m3u8: string
  position: number
  duration: number
  // Whether or not the user has made a seek action.
  // We use this to make sure we don't read stale position values from the native layer.
  seekOverride: number | null

  constructor() {
    this.m3u8 = ''
    this.position = 0
    this.duration = 0
    this.seekOverride = null
  }

  load = (
    segments: TrackSegment[],
    onEnd: () => void,
    prefetchedSegments: string[],
    gateways: string[],
    info: AudioInfo
  ) => {
    const m3u8Gateways = gateways.concat(PUBLIC_IPFS_GATEWAY)
    this.m3u8 = generateM3U8Variants(segments, [], m3u8Gateways)
  }

  play = () => {
    const message = new PlayTrackMessage(this.m3u8)
    message.send()
  }

  pause = () => {
    const message = new PauseTrackMessage()
    message.send()
  }

  stop = () => {}

  seek = (seconds: number) => {
    this.seekOverride = seconds
    const message = new SeekMessage(seconds)
    message.send()
  }

  // Unused on mobile
  setVolume = () => null
  isBuffering = () => false

  getPosition = async () => {
    // Note: we only send a message to the native layer on get position and not duration
    // because we could potentially be racing two inflight requests that would
    // return conflicting results (e.g. an updated duration for a stale position).
    const message = new GetPositionMessage()
    message.send()
    const result = await message.receive()

    if (this.seekOverride !== null) {
      const position = this.seekOverride
      // Cancel the seek override time, but in a little bit (less than 1 second)
      // to debounce the UI.
      setTimeout(() => {
        this.seekOverride = null
      }, 200)
      return position
    }
    this.position = result.currentTime
    this.duration = result.seekableDuration

    return this.position
  }

  getDuration = () => {
    return this.duration
  }
}

export default NativeMobileAudio
