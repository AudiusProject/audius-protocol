import Collection from 'models/Collection'
import Track from 'models/Track'
import { Status } from 'store/types'

export interface ArtistDashboardTrack extends Track {
  listenCount: number
}

export default interface ArtistDashboardState {
  status: Status
  tracks: ArtistDashboardTrack[]
  unlistedTracks: ArtistDashboardTrack[]
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
