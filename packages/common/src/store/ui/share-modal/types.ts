import { PayloadAction } from '@reduxjs/toolkit'

import { Nullable } from '~/utils/typeUtils'

import { ID, ShareSource, Collection, Track, User } from '../../../models'

export type ShareType = 'track' | 'profile' | 'album' | 'playlist'

type ShareTrackContent = {
  type: 'track'
  track: Track
  artist: User
}

type ShareProfileContent = {
  type: 'profile'
  profile: User
}

type ShareAlbumContent = {
  type: 'album'
  album: Pick<
    Collection,
    'playlist_name' | 'playlist_id' | 'permalink' | 'is_album' | 'is_private'
  >
  artist: User
}

type SharePlaylistContent = {
  type: 'playlist'
  playlist: Pick<
    Collection,
    'playlist_name' | 'playlist_id' | 'permalink' | 'is_album' | 'is_private'
  >
  creator: User
}

export type ShareContent =
  | ShareTrackContent
  | ShareProfileContent
  | ShareAlbumContent
  | SharePlaylistContent

export type ShareModalState = {
  source: Nullable<ShareSource>
  content: Nullable<ShareContent>
}

type RequestOpenPayload = { source: ShareSource } & (
  | { type: 'track'; trackId: ID }
  | { type: 'profile'; profileId: ID }
  | { type: 'collection'; collectionId: ID }
)

export type ShareModalRequestOpenAction = PayloadAction<RequestOpenPayload>

type OpenPayload = { source: ShareSource } & (
  | ShareTrackContent
  | ShareProfileContent
  | ShareAlbumContent
  | SharePlaylistContent
)

export type ShareModalOpenAction = PayloadAction<OpenPayload>
