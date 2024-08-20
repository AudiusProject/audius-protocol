import { createModal } from '../createModal'

export type ChatBlastModalState = {}

const ChatBlastModal = createModal<ChatBlastModalState>({
  reducerPath: 'ChatBlastModal',
  initialState: {
    isOpen: false
  },
  sliceSelector: (state) => state.ui.modals
})

export const {
  hook: useChatBlastModal,
  actions: chatBlastModalActions,
  reducer: chatBlastModalReducer
} = ChatBlastModal
