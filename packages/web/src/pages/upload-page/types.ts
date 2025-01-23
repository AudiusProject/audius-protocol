import { TrackForUpload } from '@audius/common/store'

export type CollectionTrackForUpload = TrackForUpload & {
  override: boolean
}
