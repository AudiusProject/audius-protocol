import { ReactNode } from 'react'

import { ButtonVariant } from '@audius/harmony'

import { createModal } from '../createModal'

export type ConfirmationModalState = {
  messages: {
    title: string
    body: ReactNode
    cancel: string
    confirm: String
  }
  confirmButtonType?: ButtonVariant
  confirmCallback: () => void
  cancelCallback?: () => void
}

const confirmationModal = createModal<ConfirmationModalState>({
  reducerPath: 'ConfirmationModal',
  initialState: {
    isOpen: false,
    messages: {
      title: '',
      body: '',
      cancel: '',
      confirm: ''
    },
    confirmCallback: () => {},
    cancelCallback: () => {}
  },
  sliceSelector: (state) => state.ui.modals
})

export const {
  hook: useConfirmationModal,
  actions: confirmationModalActions,
  reducer: confirmationModalReducer
} = confirmationModal
