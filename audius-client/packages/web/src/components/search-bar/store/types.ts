import { Collection, Status, Track, User } from '@audius/common'

export default interface SearchBarState {
  searchText: string
  tracks: Track[]
  users: User[]
  playlists: Collection[]
  albums: Collection[]
  status: Status
  disregardResponses: boolean
}
