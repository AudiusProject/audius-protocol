import { Action } from '@reduxjs/toolkit'

import { createModal } from '../createModal'

export type CreateChatModalState = {
  defaultUserList?: 'followers' | 'chats'
  presetMessage?: string
  onCancelAction?: Action
}

const createChatModal = createModal<CreateChatModalState>({
  reducerPath: 'CreateChatModal',
  initialState: {
    isOpen: false,
    defaultUserList: 'followers'
  },
  sliceSelector: (state) => state.ui.modals
})

export const {
  hook: useCreateChatModal,
  actions: createChatModalActions,
  reducer: createChatModalReducer
} = createChatModal
