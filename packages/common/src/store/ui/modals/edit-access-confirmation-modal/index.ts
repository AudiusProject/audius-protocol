import { createModal } from '../createModal'

export type EditAccessConfirmationModalState = {
  confirmCallback: () => void
  cancelCallback?: () => void
}

const editAccessConfirmationModal =
  createModal<EditAccessConfirmationModalState>({
    reducerPath: 'EditAccessConfirmation',
    initialState: {
      isOpen: false,
      confirmCallback: () => {},
      cancelCallback: () => {}
    },
    sliceSelector: (state) => state.ui.modals
  })

export const {
  hook: useEditAccessConfirmationModal,
  actions: editAccessConfirmationModalActions,
  reducer: editAccessConfirmationModalReducer
} = editAccessConfirmationModal
