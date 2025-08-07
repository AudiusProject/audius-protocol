import { ID } from '~/models/Identifiers'

export type PlaylistLibraryID = ID

export type PlaylistLibraryKind =
  | 'library-playlist'
  | 'playlist'
  | 'playlist-folder'

export type PlaylistLibraryIdentifier = {
  type: 'playlist'
  playlist_id: number
}

export type PlaylistLibraryFolder = {
  id: string
  type: 'folder'
  name: string
  contents: (PlaylistLibraryFolder | PlaylistLibraryIdentifier)[]
}

export type PlaylistLibraryItem =
  | PlaylistLibraryIdentifier
  | PlaylistLibraryFolder

export type PlaylistLibraryItemWithUser = PlaylistLibraryItem & {
  user: { id: ID; handle: string; is_deactivated?: boolean }
}

export type PlaylistLibrary = {
  contents: (PlaylistLibraryFolder | PlaylistLibraryIdentifier)[]
}

export type PlaylistUpdate = {
  playlist_id: number
  updated_at: number
  last_seen_at: number | null
}
