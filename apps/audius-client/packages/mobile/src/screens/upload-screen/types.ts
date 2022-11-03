import type { Nullable, Genre, TrackMetadata } from '@audius/common'
import type { DocumentPickerResponse } from 'react-native-document-picker'

export type UploadTrackMetadata = {
  [T in keyof TrackMetadata]: Nullable<TrackMetadata[T]>
}

export type CompletedTrackMetadata = {
  name: string
  description: Nullable<string>
  genre: Genre
  artwork: { url: string }
}

export type UploadTrack = {
  file: DocumentPickerResponse
  metadata: TrackMetadata
}

export type CompletedTrackUpload = {
  file: DocumentPickerResponse
  metadata: CompletedTrackMetadata
}
