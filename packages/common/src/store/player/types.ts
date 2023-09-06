export const PLAYBACK_RATE_LS_KEY = 'playbackRate'

export type PlaybackRate =
  | '0.5x'
  | '0.8x'
  | '1x'
  | '1.1x'
  | '1.2x'
  | '1.5x'
  | '2x'
  | '2.5x'
  | '3x'

export const playbackRateValueMap: Record<PlaybackRate, number> = {
  '0.5x': 0.5,
  '0.8x': 0.8,
  '1x': 1.0,
  '1.1x': 1.1,
  '1.2x': 1.2,
  '1.5x': 1.5,
  '2x': 2.0,
  '2.5x': 2.5,
  '3x': 3.0
}
