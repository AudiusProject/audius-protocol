import { CollectionValues } from '@audius/common/schemas'
import { UploadType, TrackForUpload } from '@audius/common/store'

type InitialFormState = {
  uploadType: undefined
  tracks: undefined
  metadata: undefined
}

export type TrackFormState = {
  uploadType: UploadType.INDIVIDUAL_TRACK | UploadType.INDIVIDUAL_TRACKS
  tracks: TrackForUpload[]
}

export type CollectionFormState = {
  uploadType: UploadType.ALBUM | UploadType.PLAYLIST
  tracks: TrackForUpload[]
  metadata: CollectionValues
}

export type UploadFormState =
  | TrackFormState
  | CollectionFormState
  | InitialFormState

export type CollectionTrackForUpload = TrackForUpload & {
  override: boolean
}
