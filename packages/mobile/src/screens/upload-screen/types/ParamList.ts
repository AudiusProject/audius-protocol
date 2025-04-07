import type { TrackMetadataForUpload } from '@audius/common/store'
import type { RouteProp } from '@react-navigation/native'

import type { UploadingTracksParams, CompleteTrackParams } from '../screens'

export type UploadParamList = {
  SelectTrack: {
    initialMetadata?: Partial<TrackMetadataForUpload>
  }
  CompleteTrack: CompleteTrackParams
  UploadingTracks: UploadingTracksParams
  UploadComplete: undefined
}

export type UploadRouteProp<Screen extends keyof UploadParamList> = RouteProp<
  UploadParamList,
  Screen
>
