import { createModal } from '../createModal'

export type HideConfirmationModalState = {
  confirmCallback: () => void
  cancelCallback?: () => void
}

const hideConfirmationModal = createModal<HideConfirmationModalState>({
  reducerPath: 'HideConfirmation',
  initialState: {
    isOpen: false,
    confirmCallback: () => {},
    cancelCallback: () => {}
  },
  sliceSelector: (state) => state.ui.modals
})

export const {
  hook: useHideConfirmationModal,
  reducer: hideConfirmationModalReducer,
  actions: hideConfirmationModalActions
} = hideConfirmationModal
