import { createModal } from './createModal'

export type AlbumTrackRemoveConfirmationModalState = {
  confirmCallback: (() => void) | undefined
}

const albumTrackRemoveConfirmationModal =
  createModal<AlbumTrackRemoveConfirmationModalState>({
    reducerPath: 'AlbumTrackRemoveConfirmation',
    initialState: {
      isOpen: false,
      confirmCallback: undefined
    },
    sliceSelector: (state) => state.ui.modals
  })

export const {
  hook: useAlbumTrackRemoveConfirmationModal,
  reducer: albumTrackRemoveConfirmationModalReducer,
  actions: albumTrackRemoveConfirmationModalActions,
  selector: albumTrackRemoveConfirmationModalSelector
} = albumTrackRemoveConfirmationModal
