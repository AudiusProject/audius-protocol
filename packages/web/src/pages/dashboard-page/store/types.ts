import { Nullable } from '@audius/common'
import { Status, Collection, Track } from '@audius/common/models'

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
