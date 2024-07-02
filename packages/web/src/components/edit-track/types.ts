import {
  TrackMetadataForUpload,
  TrackForUpload,
  TrackForEdit
} from '@audius/common/store'
import { Nullable } from '@audius/common/utils'

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

/**
 * Represents a track file, its metadata prior to upload, and a preview.
 */
export type TrackEditFormValues = {
  tracks: (TrackForUpload | TrackForEdit)[]
  trackMetadatas: SingleTrackEditValues[]
  trackMetadatasIndex: number
}
