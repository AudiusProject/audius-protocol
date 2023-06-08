import { TrackMetadata } from '@audius/common'

export type TrackForUpload = {
  file: File
  preview: HTMLAudioElement
  metadata: TrackMetadata
}
