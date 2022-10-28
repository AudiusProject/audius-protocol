import { Nullable } from '../utils'

export type AudioInfo = {
  id: string
  title: string
  artist: string
  artwork: string
  premiumContentHeaders: object
}

export enum AudioError {
  AUDIO = 'AUDIO',
  HLS = 'HLS'
}

export type AudioPlayer = {
  audio: HTMLAudioElement
  load: (
    streamMp3Url: string,
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
  onBufferingChange: (isBuffering: boolean) => void
  onError: (error: string, data: string | Event) => void
  audioCtx: Nullable<AudioContext>
}
