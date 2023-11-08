import { Status, Collection, Track, Nullable } from '@audius/common'

export default interface ArtistDashboardState {
  status: Status
  tracksStatus: Status
  tracks: Track[]
  collections: Collection[]
  listenData: Nullable<{
    all: {
      labels: string[]
      values: number[]
    }
    [id: number]: {
      labels: string[]
      values: number[]
    }
  }>
}
