import { Action } from '@reduxjs/toolkit'

import { createModal } from '../modals/createModal'

export type CreateChatModalState = {
  presetMessage?: string
  onCancelAction?: Action
}

const createChatModal = createModal<CreateChatModalState>({
  reducerPath: 'createChatModal',
  initialState: {
    isOpen: false
  },
  sliceSelector: (state) => state.ui.modalsWithState
})

export const {
  hook: useCreateChatModal,
  actions: createChatModalActions,
  reducer: createChatModalReducer
} = createChatModal
