import { SmartCollectionVariant } from 'models/SmartCollectionVariant'

export type PlaylistIdentifier = {
  type: 'playlist'
  playlist_id: number
}

export type ExplorePlaylistIdentifier = {
  type: 'explore_playlist'
  playlist_id: SmartCollectionVariant
}

export type AudioNftPlaylistIdentifier = {
  type: 'audio_nft_playlist'
  playlist_id: SmartCollectionVariant.AUDIO_NFT_PLAYLIST
}

// Never written to backends
export type TempPlaylistIdentifier = {
  type: 'temp_playlist'
  playlist_id: string
}

export type PlaylistLibraryIdentifier =
  | PlaylistIdentifier
  | ExplorePlaylistIdentifier
  | AudioNftPlaylistIdentifier
  | TempPlaylistIdentifier

export type PlaylistLibraryFolder = {
  id: string
  type: 'folder'
  name: string
  contents: (PlaylistLibraryFolder | PlaylistLibraryIdentifier)[]
}

export type PlaylistLibrary = {
  contents: (PlaylistLibraryFolder | PlaylistLibraryIdentifier)[]
}
