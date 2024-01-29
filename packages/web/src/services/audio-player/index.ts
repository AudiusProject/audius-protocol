import { AudioPlayer } from './AudioPlayer'

export const audioPlayer =
  typeof Audio !== 'undefined' ? new AudioPlayer() : null
