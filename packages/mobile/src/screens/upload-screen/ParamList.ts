import type { RouteProp } from '@react-navigation/native'

import type { CompleteTrackParams } from './CompleteTrackScreen'
import type { UploadingTracksParams } from './UploadingTracksScreen'

export type UploadParamList = {
  SelectTrack: undefined
  CompleteTrack: CompleteTrackParams
  UploadingTracks: UploadingTracksParams
  UploadComplete: undefined
}

export type UploadRouteProp<Screen extends keyof UploadParamList> = RouteProp<
  UploadParamList,
  Screen
>
