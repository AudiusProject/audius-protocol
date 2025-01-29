import { createSlice, PayloadAction } from '@reduxjs/toolkit'

import {
  PlaylistLibrary,
  PlaylistLibraryFolder,
  PlaylistLibraryID,
  PlaylistLibraryKind
} from '../../models'

export type PlaylistLibraryState = Partial<PlaylistLibrary>

const initialState: PlaylistLibraryState = {}

export type UpdatePayload = {
  playlistLibrary: PlaylistLibrary
}

export type ReorderAction = PayloadAction<{
  draggingId: PlaylistLibraryID
  droppingId: PlaylistLibraryID
  draggingKind: PlaylistLibraryKind
}>

export type AddToFolderAction = PayloadAction<{
  folder: PlaylistLibraryFolder
  draggingKind: PlaylistLibraryKind
  draggingId: PlaylistLibraryID
}>

const slice = createSlice({
  name: 'playlist-library',
  initialState,
  reducers: {
    addToFolder: (_state, _action: AddToFolderAction) => {}
  }
})

export const actions = slice.actions

export default slice.reducer
