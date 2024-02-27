import { CollectionValues } from '@audius/common/schemas'
import {
  UploadTrack,
  UploadType,
  ExtendedTrackMetadata
} from '@audius/common/store'
import { Nullable } from '@audius/common/utils'

export type TrackForUpload = UploadTrack

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

export type SingleTrackEditValues = Omit<ExtendedTrackMetadata, 'remixOf'> & {
  licenseType: {
    allowAttribution: Nullable<boolean>
    commercialUse: Nullable<boolean>
    derivativeWorks: Nullable<boolean>
  }
  remixOf: {
    tracks: { parentTrackId: number }[]
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
