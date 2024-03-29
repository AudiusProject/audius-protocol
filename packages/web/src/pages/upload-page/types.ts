import { CollectionValues } from '@audius/common/schemas'
import {
  UploadType,
  TrackMetadataForUpload,
  TrackForUpload
} from '@audius/common/store'
import { Nullable } from '@audius/common/utils'

export type InitialFormState = {
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

export type SingleTrackEditValues = Omit<TrackMetadataForUpload, 'remixOf'> & {
  licenseType: {
    allowAttribution: Nullable<boolean>
    commercialUse: Nullable<boolean>
    derivativeWorks: Nullable<boolean>
  }
  remix_of: {
    tracks: { parent_track_id: number }[]
  } | null
}

export type TrackEditFormValues = {
  tracks: TrackForUpload[]
  trackMetadatas: SingleTrackEditValues[]
  trackMetadatasIndex: number
}

export type CollectionTrackForUpload = TrackForUpload & {
  override: boolean
}
