import { Collection } from 'common/models/Collection'
import Status from 'common/models/Status'
import { Track } from 'common/models/Track'
import { User } from 'common/models/User'

export default interface SearchBarState {
  searchText: string
  tracks: Track[]
  users: User[]
  playlists: Collection[]
  albums: Collection[]
  status: Status
  disregardResponses: boolean
}
