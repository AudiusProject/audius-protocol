import { EntityState, PayloadAction } from '@reduxjs/toolkit'

import { ID } from '~/models/Identifiers'
import { PlaylistUpdate } from '~/models/PlaylistLibrary'

export type PlaylistUpdateState = EntityState<PlaylistUpdate>

export type PlaylistUpdatesReceivedAction = PayloadAction<{
  playlistUpdates: PlaylistUpdate[]
}>

export type UpdatedPlaylistViewedAction = PayloadAction<{
  playlistId: ID
}>
