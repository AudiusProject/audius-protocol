import { SearchPlaylist, SearchTrack, SearchUser, Status } from '@audius/common'

type NewType = SearchPlaylist

export type SearchResults = {
  users: SearchUser[]
  tracks: SearchTrack[]
  playlists: SearchPlaylist[]
  albums: NewType[]
}

type SearchBarState = SearchResults & {
  searchText: string
  status: Status
  disregardResponses: boolean
}

export default SearchBarState
