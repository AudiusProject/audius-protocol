import { ID } from '~/models/Identifiers'

import { createModal } from '../createModal'

export type RecentUserCommentsModalState = {
  userId?: ID
}

const recentUserCommentsModal = createModal<RecentUserCommentsModalState>({
  reducerPath: 'RecentUserComments',
  initialState: {
    isOpen: false,
    userId: undefined
  },
  sliceSelector: (state) => state.ui.modals
})

export const {
  hook: useRecentUserCommentsModal,
  reducer: recentUserCommentsModalReducer,
  actions: recentUserCommentsModalActions
} = recentUserCommentsModal
