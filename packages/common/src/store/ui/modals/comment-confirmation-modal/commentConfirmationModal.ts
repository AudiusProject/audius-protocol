import { ReactNode } from 'react'

import { createModal } from '../createModal'

export type CommentConfirmationModalState = {
  messages: {
    title: string
    body: ReactNode
    cancel: string
    confirm: String
  }
  confirmButtonType?: 'primary' | 'destructive'
  confirmCallback: () => void
  cancelCallback?: () => void
}

const commentConfirmationModal = createModal<CommentConfirmationModalState>({
  reducerPath: 'CommentConfirmation',
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
  hook: useCommentConfirmationModal,
  actions: commentConfirmationModalActions,
  reducer: commentConfirmationModalReducer
} = commentConfirmationModal
