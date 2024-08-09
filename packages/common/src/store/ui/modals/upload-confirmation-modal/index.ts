import { createModal } from '../createModal'

export type UploadConfirmationModalState = {
  hasPublicTracks: boolean
  confirmCallback: () => void
  cancelCallback?: () => void
}

const uploadConfirmationModal = createModal<UploadConfirmationModalState>({
  reducerPath: 'UploadConfirmation',
  initialState: {
    isOpen: false,
    hasPublicTracks: false,
    confirmCallback: () => {},
    cancelCallback: () => {}
  },
  sliceSelector: (state) => state.ui.modals
})

export const {
  hook: useUploadConfirmationModal,
  reducer: uploadConfirmationModalReducer,
  actions: uploadConfirmationModalActions
} = uploadConfirmationModal
