import { TrackSegment } from '../../models'
import { Nullable } from '../../utils'

export type AudioInfo = {
  id: string
  title: string
  artist: string
  artwork?: string
}

export type AudioPlayer = {
  load: (
    segments: TrackSegment[],
    onEnd: () => void,
    prefetchedSegments: string[],
    gateways: string[],
    info: AudioInfo,
    forceStreamSrc?: Nullable<string>
  ) => void
  play: () => void
  pause: () => void
  stop: () => void
  seek: (seconds: number) => void
  setVolume: (volume: number) => void
  isBuffering: () => boolean
  getPosition: () => number | Promise<number>
  getDuration: () => number
}

export type TAudioPlayer = {
  new (): AudioPlayer
}
