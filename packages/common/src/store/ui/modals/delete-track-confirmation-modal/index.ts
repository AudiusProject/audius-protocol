import { ID } from '~/models/Identifiers'

import { createModal } from '../createModal'

export type DeleteTrackConfirmationModalState = {
  trackId: ID
}

const deleteTrackConfirmationModal =
  createModal<DeleteTrackConfirmationModalState>({
    reducerPath: 'DeleteTrackConfirmation',
    initialState: {
      isOpen: false,
      trackId: 0
    },
    sliceSelector: (state) => state.ui.modals
  })

export const {
  hook: useDeleteTrackConfirmationModal,
  actions: deleteTrackConfirmationModalActions,
  reducer: deleteTrackConfirmationModalReducer
} = deleteTrackConfirmationModal
