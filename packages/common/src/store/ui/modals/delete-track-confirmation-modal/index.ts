import { ID } from '~/models/Identifiers'

import { createModal } from '../createModal'

export type DeleteTrackConfirmationModalState = {
  trackId: ID | null
}

const deleteTrackConfirmationModal =
  createModal<DeleteTrackConfirmationModalState>({
    reducerPath: 'DeleteTrackConfirmation',
    initialState: {
      isOpen: false,
      trackId: null
    },
    sliceSelector: (state) => state.ui.modals
  })

export const {
  hook: useDeleteTrackConfirmationModal,
  actions: deleteTrackConfirmationModalActions,
  reducer: deleteTrackConfirmationModalReducer
} = deleteTrackConfirmationModal
