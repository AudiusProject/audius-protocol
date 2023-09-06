import type { RouteProp } from '@react-navigation/native'

import type { UploadingTracksParams, CompleteTrackParams } from '../screens'

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
