import type { Nullable } from '@audius/common'

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
  seek = () => {}
  setVolume = () => null
  isBuffering = () => false
  getPosition = async () => 0
  getDuration = () => 0
  onBufferingChange = () => {}
  onError = () => {}
}
