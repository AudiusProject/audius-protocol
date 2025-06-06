import { createModal } from '../createModal'

export type FinalizeWinnersConfirmationModalState = {
  confirmCallback: () => void
  cancelCallback?: () => void
  isInitialSave: boolean
}

const finalizeWinnersConfirmationModal =
  createModal<FinalizeWinnersConfirmationModalState>({
    reducerPath: 'FinalizeWinnersConfirmation',
    initialState: {
      isOpen: false,
      confirmCallback: () => {},
      cancelCallback: () => {},
      isInitialSave: false
    },
    sliceSelector: (state) => state.ui.modals
  })

export const {
  hook: useFinalizeWinnersConfirmationModal,
  reducer: finalizeWinnersConfirmationModalReducer,
  actions: finalizeWinnersConfirmationModalActions
} = finalizeWinnersConfirmationModal
