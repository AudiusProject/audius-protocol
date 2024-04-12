import { ID } from '~/models'

import { createModal } from './createModal'

export type AlbumTrackRemoveConfirmationModalState = {
  trackId: ID | undefined
  playlistId: ID | undefined
  uid: string | undefined
  timestamp: number | undefined
}

const albumTrackRemoveConfirmationModal =
  createModal<AlbumTrackRemoveConfirmationModalState>({
    reducerPath: 'AlbumTrackRemoveConfirmation',
    initialState: {
      isOpen: false,
      trackId: undefined,
      playlistId: undefined,
      uid: undefined,
      timestamp: undefined
    },
    sliceSelector: (state) => state.ui.modals
  })

export const {
  hook: useAlbumTrackRemoveConfirmationModal,
  reducer: albumTrackRemoveConfirmationModalReducer,
  actions: albumTrackRemoveConfirmationModalActions
} = albumTrackRemoveConfirmationModal
