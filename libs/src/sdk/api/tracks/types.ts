import type { TrackMetadata } from '../../../utils'
import { File } from '../../types/File'

export type UploadTrackRequest = {
  artistId: string
  coverArtFile: File
  metadata: TrackMetadata
  onProgress: (progress: number) => void
  trackFile: File
}
