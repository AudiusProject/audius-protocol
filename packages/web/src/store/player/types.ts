import AudioStream from 'audio/AudioStream'
import NativeMobileAudio from 'audio/NativeMobileAudio'

export type AudioState = AudioStream | NativeMobileAudio | null

export type Info = {
  title: string
  artist: string
  artwork: string
}
