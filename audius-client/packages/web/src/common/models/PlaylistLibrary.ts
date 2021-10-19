import { SmartCollectionVariant } from 'common/models/SmartCollectionVariant'

export type PlaylistIdentifier = {
  type: 'playlist'
  playlist_id: number
}

export type ExplorePlaylistIdentifier = {
  type: 'explore_playlist'
  playlist_id: SmartCollectionVariant
}

// Never written to backends
export type TempPlaylistIdentifier = {
  type: 'temp_playlist'
  playlist_id: string
}

export type PlaylistLibraryIdentifier =
  | PlaylistIdentifier
  | ExplorePlaylistIdentifier
  | TempPlaylistIdentifier

export type PlaylistLibraryFolder = {
  type: 'folder'
  name: string
  contents: (PlaylistLibraryFolder | PlaylistLibraryIdentifier)[]
}

export type PlaylistLibrary = {
  contents: (PlaylistLibraryFolder | PlaylistLibraryIdentifier)[]
}
