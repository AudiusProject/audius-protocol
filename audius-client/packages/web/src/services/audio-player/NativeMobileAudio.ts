export class NativeMobileAudio {
  audio = null as any
  audioCtx = null
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
