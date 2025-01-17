import { AnnouncementNotification } from '~/store/notifications/types'
import { Nullable } from '~/utils/typeUtils'

import { createModal } from './createModal'

export type AnnouncementModalState = {
  announcementNotification: Nullable<AnnouncementNotification>
}

const announcementModal = createModal<AnnouncementModalState>({
  reducerPath: 'Announcement',
  initialState: {
    isOpen: false,
    announcementNotification: null
  },
  sliceSelector: (state) => state.ui.modals
})

export const {
  hook: useAnnouncementModal,
  reducer: announcementModalReducer,
  actions: announcementModalActions
} = announcementModal
