import { AudioPlayer } from './AudioPlayer'
import { NativeMobileAudio } from './NativeMobileAudio'

const NATIVE_MOBILE = process.env.REACT_APP_NATIVE_MOBILE

export const audioPlayer = NATIVE_MOBILE
  ? new NativeMobileAudio()
  : new AudioPlayer()
