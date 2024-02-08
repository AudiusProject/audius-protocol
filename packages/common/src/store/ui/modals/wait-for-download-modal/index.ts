import { ID } from '~/models/Identifiers'

import { createModal } from '../createModal'

export type WaitForDownloadModalState = {
  // List of track ids to download, if larger than 1
  // the first track is the parent track id.
  trackIds: ID[]
}

const waitForDownloadModal = createModal<WaitForDownloadModalState>({
  reducerPath: 'WaitForDownloadModal',
  initialState: {
    isOpen: false,
    trackIds: []
  },
  sliceSelector: (state) => state.ui.modals
})

export const {
  hook: useWaitForDownloadModal,
  reducer: waitForDownloadModalReducer
} = waitForDownloadModal
