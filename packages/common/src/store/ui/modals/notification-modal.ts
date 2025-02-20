import { createModal } from './createModal'
import { BaseModalState } from './types'

const notificationModal = createModal<BaseModalState>({
  reducerPath: 'Notification',
  initialState: {
    isOpen: false
  },
  sliceSelector: (state) => state.ui.modals
})

export const {
  hook: useNotificationModal,
  reducer: notificationModalReducer,
  actions: notificationModalActions
} = notificationModal
