import type { CrossPlatformFile as File } from '../../types/File'
import type { TrackMetadata } from '../../types/types'

export type UploadTrackRequest = {
  artistId: string
  coverArtFile: File
  metadata: TrackMetadata
  onProgress: (progress: number) => void
  trackFile: File
}
