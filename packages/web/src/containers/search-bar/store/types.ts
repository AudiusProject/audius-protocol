import Collection from 'models/Collection'
import Track from 'models/Track'
import User from 'models/User'
import { Status } from 'store/types'

export default interface SearchBarState {
  searchText: string
  tracks: Track[]
  users: User[]
  playlists: Collection[]
  albums: Collection[]
  status: Status
  disregardResponses: boolean
}
