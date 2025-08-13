import { createModal } from '../createModal'
import { ReceiveTokensModalState } from '../types'

const receiveTokensModal = createModal<ReceiveTokensModalState>({
  reducerPath: 'ReceiveTokensModal',
  initialState: {
    isOpen: false,
    mint: undefined
  },
  sliceSelector: (state) => state.ui.modals
})

export const {
  hook: useReceiveTokensModal,
  actions: receiveTokensModalActions,
  reducer: receiveTokensModalReducer
} = receiveTokensModal
