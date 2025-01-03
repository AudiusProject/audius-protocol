import {
  Status,
  SearchUser,
  SearchTrack,
  SearchPlaylist
} from '@audius/common/models'

export type SearchResults = {
  users: SearchUser[]
  tracks: SearchTrack[]
  playlists: SearchPlaylist[]
  albums: SearchPlaylist[]
}

export type SearchBarState = SearchResults & {
  searchText: string
  status: Status
  disregardResponses: boolean
}
