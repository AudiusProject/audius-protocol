import { createModal } from '../createModal'

export type DeleteTrackConfirmationModalState = {
  confirmCallback: () => void
  cancelCallback?: () => void
}

const deleteTrackConfirmationModal =
  createModal<DeleteTrackConfirmationModalState>({
    reducerPath: 'DeleteTrackConfirmation',
    initialState: {
      isOpen: false,
      confirmCallback: () => {},
      cancelCallback: () => {}
    },
    sliceSelector: (state) => state.ui.modals
  })

export const {
  hook: useDeleteTrackConfirmationModal,
  actions: deleteTrackConfirmationModalActions,
  reducer: deleteTrackConfirmationModalReducer
} = deleteTrackConfirmationModal
