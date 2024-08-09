import { createModal } from '../createModal'

export type TargetedMessageModalState = {}

const targetedMessageModal = createModal<TargetedMessageModalState>({
  reducerPath: 'TargetedMessageModal',
  initialState: {
    isOpen: false
  },
  sliceSelector: (state) => state.ui.modals
})

export const {
  hook: useTargetedMessageModal,
  actions: targetedMessageModalActions,
  reducer: targetedMessageModalReducer
} = targetedMessageModal
