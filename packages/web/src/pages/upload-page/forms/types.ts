import { ExtendedTrackMetadata, Nullable } from '@audius/common'
import moment from 'moment'

export type SingleTrackEditValues = ExtendedTrackMetadata & {
  releaseDate: moment.Moment
  licenseType: {
    allowAttribution: Nullable<boolean>
    commercialUse: Nullable<boolean>
    derivativeWorks: Nullable<boolean>
  }
}

export type TrackEditFormValues = {
  trackMetadatas: SingleTrackEditValues[]
  trackMetadatasIndex: number
}
