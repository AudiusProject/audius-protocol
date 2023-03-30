import type { TrackMetadata } from '../../../utils'

export type File = {
  buffer: Buffer
  name: string
}

export type UploadTrackRequest = {
  artistId: string
  coverArtFile: File
  metadata: TrackMetadata
  onProgress: (progress: ProgressEvent) => void
  trackFile: File
}
