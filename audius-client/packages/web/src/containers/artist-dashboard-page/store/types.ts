import { Collection } from 'common/models/Collection'
import Status from 'common/models/Status'
import { Track } from 'common/models/Track'

export default interface ArtistDashboardState {
  status: Status
  tracks: Track[]
  unlistedTracks: Track[]
  collections: Collection
  listenData: {
    all: {
      labels: string[]
      values: number[]
    }
    [id: number]: {
      labels: string[]
      values: number[]
    }
  }
}
