import { ID } from '~/models/Identifiers'

import { createModal } from '../createModal'

export type DeleteTrackConfirmationModalState = {
  trackId: ID
  onSuccess?: () => void
  onCancel?: () => void
}

const deleteTrackConfirmationModal =
  createModal<DeleteTrackConfirmationModalState>({
    reducerPath: 'DeleteTrackConfirmation',
    initialState: {
      isOpen: false,
      trackId: 0,
      onSuccess: () => {},
      onCancel: () => {}
    },
    sliceSelector: (state) => state.ui.modals
  })

export const {
  hook: useDeleteTrackConfirmationModal,
  actions: deleteTrackConfirmationModalActions,
  reducer: deleteTrackConfirmationModalReducer
} = deleteTrackConfirmationModal
