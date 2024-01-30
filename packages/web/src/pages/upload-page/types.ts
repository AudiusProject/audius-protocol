import { Nullable, UploadType } from '@audius/common'
import { TrackMetadata } from '@audius/common/models'

import { CollectionValues } from './validation'

export type TrackForUpload = {
  file: File
  preview: HTMLAudioElement
  metadata: TrackMetadata
}

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

export type SingleTrackEditValues = TrackMetadata & {
  licenseType: {
    allowAttribution: Nullable<boolean>
    commercialUse: Nullable<boolean>
    derivativeWorks: Nullable<boolean>
  }
}

export type TrackEditFormValues = {
  tracks: TrackForUpload[]
  trackMetadatas: SingleTrackEditValues[]
  trackMetadatasIndex: number
}

export type CollectionTrackForUpload = TrackForUpload & {
  override: boolean
}
