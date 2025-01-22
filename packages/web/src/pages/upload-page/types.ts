import { TrackForEdit, TrackForUpload } from '@audius/common/store'

export type CollectionTrackForUpload = TrackForUpload & {
  override: boolean
}

export type CollectionTrackForEdit = TrackForEdit & {
  override: boolean
}
