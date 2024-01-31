import { EntityState, PayloadAction } from '@reduxjs/toolkit'

import { ID } from '~/models/Identifiers'

export type PlaylistUpdate = {
  playlist_id: number
  updated_at: string
  last_seen_at: string
}

export type PlaylistUpdateState = EntityState<PlaylistUpdate>

export type PlaylistUpdatesReceivedAction = PayloadAction<{
  playlistUpdates: PlaylistUpdate[]
}>

export type UpdatedPlaylistViewedAction = PayloadAction<{
  playlistId: ID
}>
