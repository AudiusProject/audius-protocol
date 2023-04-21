import { createPlaylistModalUISelectors } from 'store/ui'
import { Nullable } from 'utils/typeUtils'

import { Track, UID, User, ID, Cache, Collection } from '../../../models'

export enum PlaylistOperations {
  ADD_TRACK = 'ADD_TRACK',
  REMOVE_TRACK = 'REMOVE_TRACK',
  REORDER = 'REORDER'
}

export type EnhancedCollectionTrack = Track & { user: User; uid: UID }

export interface CollectionsCacheState extends Cache<Collection> {
  permalinks: { [permalink: string]: ID }
}

export type Image = {
  height?: number
  width?: number
  name?: string
  size?: number
  fileType?: string
  url: string
  file?: string
}

type PlaylistTrack = { time: number; metadata_time?: number; track: number }

export type EditPlaylistValues = {
  playlist_name: string
  description: Nullable<string>
  artwork: Image
  tracks: ReturnType<typeof createPlaylistModalUISelectors.getTracks>
  track_ids: PlaylistTrack[]
  removedTracks: { trackId: ID; timestamp: number }[]
}
