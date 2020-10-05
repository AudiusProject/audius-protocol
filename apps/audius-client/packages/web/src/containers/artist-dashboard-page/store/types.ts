import Collection from 'models/Collection'
import Track from 'models/Track'
import { Status } from 'store/types'

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
