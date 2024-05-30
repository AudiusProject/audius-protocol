import { TrackMetadataForUpload, TrackForUpload } from '@audius/common/store'
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

export type TrackEditFormValues = {
  tracks: TrackForUpload[]
  trackMetadatas: SingleTrackEditValues[]
  trackMetadatasIndex: number
}
