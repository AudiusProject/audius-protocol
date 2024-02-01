import { createModal } from '../createModal'
import { CreateChatModalState } from '../types'

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
