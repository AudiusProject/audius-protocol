import { createModal } from '../createModal'

export type ReplaceTrackConfirmationModalState = {
  confirmCallback: () => void
  cancelCallback?: () => void
}

const replaceTrackConfirmationModal =
  createModal<ReplaceTrackConfirmationModalState>({
    reducerPath: 'ReplaceTrackConfirmation',
    initialState: {
      isOpen: false,
      confirmCallback: () => {},
      cancelCallback: () => {}
    },
    sliceSelector: (state) => state.ui.modals
  })

export const {
  hook: useReplaceTrackConfirmationModal,
  reducer: replaceTrackConfirmationModalReducer,
  actions: replaceTrackConfirmationModalActions
} = replaceTrackConfirmationModal
