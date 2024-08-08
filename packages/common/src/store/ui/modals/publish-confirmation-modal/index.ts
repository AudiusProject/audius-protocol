import { createModal } from '../createModal'

export type PublishConfirmationModalState = {
  contentType: 'track' | 'album' | 'playlist'
  confirmCallback: () => void
  cancelCallback?: () => void
}

const publishConfirmationModal = createModal<PublishConfirmationModalState>({
  reducerPath: 'PublishConfirmation',
  initialState: {
    isOpen: false,
    contentType: 'track',
    confirmCallback: () => {},
    cancelCallback: () => {}
  },
  sliceSelector: (state) => state.ui.modals
})

export const {
  hook: usePublishConfirmationModal,
  reducer: publishConfirmationModalReducer,
  actions: publishConfirmationModalActions
} = publishConfirmationModal
