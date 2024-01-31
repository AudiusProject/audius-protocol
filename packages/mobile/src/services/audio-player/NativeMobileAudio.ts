import { PlaybackRate  } from '@audius/common/store'
     import type { } from '@audius/common'
import type { Nullable } from '@audius/common/utils'
import TrackPlayer from 'react-native-track-player'

// Shim definition for audio-player needed for player sagas to not break.
// Ideally we remove audio-player instance from sagas, and have web handle
// it all in a component like we do on mobile
export class NativeMobileAudio {
  audio: HTMLAudioElement
  audioCtx: Nullable<AudioContext>

  load = () => {}
  play = () => {}
  pause = () => {}
  stop = () => {}
  seek = (position: number) => {
    TrackPlayer.seekTo(position)
  }

  setVolume = () => null
  setPlaybackRate = () => {}
  isBuffering = () => false
  getPosition = async () => await TrackPlayer.getPosition()
  getDuration = async () => await TrackPlayer.getDuration()
  getPlaybackRate = () => '1x' as PlaybackRate
  getAudioPlaybackRate = () => 1.0
  onBufferingChange = () => {}
  onError = () => {}
}
