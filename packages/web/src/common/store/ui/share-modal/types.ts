import {
  ID,
  ShareSource,
  Collection,
  Track,
  User,
  Nullable
} from '@audius/common'
import { PayloadAction } from '@reduxjs/toolkit'

export type ShareType =
  | 'track'
  | 'profile'
  | 'album'
  | 'playlist'
  | 'audioNftPlaylist'

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
  album: Collection
  artist: User
}

type SharePlaylistContent = {
  type: 'playlist'
  playlist: Collection
  creator: User
}

type ShareAudioNftPlaylistContent = {
  type: 'audioNftPlaylist'
  user: User
}

export type ShareModalContent =
  | ShareTrackContent
  | ShareProfileContent
  | ShareAlbumContent
  | SharePlaylistContent
  | ShareAudioNftPlaylistContent

export type ShareModalState = {
  source: Nullable<ShareSource>
  content: Nullable<ShareModalContent>
}

type RequestOpenPayload = { source: ShareSource } & (
  | { type: 'track'; trackId: ID }
  | { type: 'profile'; profileId: ID }
  | { type: 'collection'; collectionId: ID }
  | { type: 'audioNftPlaylist'; userId: ID }
)

export type RequestOpenAction = PayloadAction<RequestOpenPayload>

type OpenPayload = { source: ShareSource } & (
  | ShareTrackContent
  | ShareProfileContent
  | ShareAlbumContent
  | SharePlaylistContent
  | ShareAudioNftPlaylistContent
)

export type OpenAction = PayloadAction<OpenPayload>
