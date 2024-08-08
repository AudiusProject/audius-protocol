import { createModal } from '../createModal'

export type HideContentConfirmationModalState = {
  confirmCallback: () => void
  cancelCallback?: () => void
}

const hideContentConfirmationModal =
  createModal<HideContentConfirmationModalState>({
    reducerPath: 'HideContentConfirmation',
    initialState: {
      isOpen: false,
      confirmCallback: () => {},
      cancelCallback: () => {}
    },
    sliceSelector: (state) => state.ui.modals
  })

export const {
  hook: useHideContentConfirmationModal,
  reducer: hideContentConfirmationModalReducer,
  actions: hideContentConfirmationModalActions
} = hideContentConfirmationModal
