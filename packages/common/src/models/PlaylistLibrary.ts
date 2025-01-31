import { SmartCollectionVariant } from '~/models/SmartCollectionVariant'
import { Nullable } from '~/utils/typeUtils'

import { ID } from './Identifiers'

export type PlaylistLibraryID = ID | string | SmartCollectionVariant

export type PlaylistLibraryKind =
  | 'library-playlist'
  | 'playlist'
  | 'playlist-folder'

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

export type PlaylistLibraryIdentifier =
  | PlaylistIdentifier
  | ExplorePlaylistIdentifier
  | AudioNftPlaylistIdentifier

export type PlaylistLibraryFolder = {
  id: string
  type: 'folder'
  name: string
  contents: (PlaylistLibraryFolder | PlaylistLibraryIdentifier)[]
}

export type PlaylistLibraryItem =
  | PlaylistLibraryIdentifier
  | PlaylistLibraryFolder

export type PlaylistLibrary = {
  contents: PlaylistLibraryItem[]
}

export type PlaylistUpdate = {
  playlist_id: number
  updated_at: number
  last_seen_at: Nullable<number>
}
