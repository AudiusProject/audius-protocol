import { createModal } from '../createModal'

export type EarlyReleaseConfirmationModalState = {
  contentType: 'track' | 'album'
  confirmCallback: () => void
  cancelCallback?: () => void
}

const earlyReleaseConfirmationModal =
  createModal<EarlyReleaseConfirmationModalState>({
    reducerPath: 'EarlyReleaseConfirmation',
    initialState: {
      isOpen: false,
      contentType: 'track',
      confirmCallback: () => {},
      cancelCallback: () => {}
    },
    sliceSelector: (state) => state.ui.modals
  })

export const {
  hook: useEarlyReleaseConfirmationModal,
  reducer: earlyReleaseConfirmationModalReducer,
  actions: earlyReleaseConfirmationModalActions
} = earlyReleaseConfirmationModal
