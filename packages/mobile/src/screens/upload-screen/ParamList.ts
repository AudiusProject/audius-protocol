import type { CompleteTrackParams } from './CompleteTrackScreen'
import type { UploadCompleteParams } from './UploadCompleteScreen'
import type { UploadingTracksParams } from './UploadingTracksScreen'

export type UploadParamList = {
  Upload: undefined
  CompleteTrack: CompleteTrackParams
  UploadingTracks: UploadingTracksParams
  UploadComplete: UploadCompleteParams
}
