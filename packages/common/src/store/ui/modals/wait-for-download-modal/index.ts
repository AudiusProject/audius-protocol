import { ID } from '~/models/Identifiers'

import { createModal } from '../createModal'

export type WaitForDownloadModalState = {
  contentId: ID
}

const waitForDownloadModal = createModal<WaitForDownloadModalState>({
  reducerPath: 'WaitForDownloadModal',
  initialState: {
    isOpen: false,
    contentId: -1
  },
  sliceSelector: (state) => state.ui.modals
})

export const {
  hook: useWaitForDownloadModal,
  reducer: waitForDownloadModalReducer
} = waitForDownloadModal
