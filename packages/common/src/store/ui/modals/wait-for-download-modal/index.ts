import { DownloadQuality } from '~/models'
import { ID } from '~/models/Identifiers'

import { createModal } from '../createModal'

export type WaitForDownloadModalState = {
  parentTrackId?: ID
  trackIds: ID[]
  quality: DownloadQuality
}

const waitForDownloadModal = createModal<WaitForDownloadModalState>({
  reducerPath: 'WaitForDownloadModal',
  initialState: {
    isOpen: false,
    trackIds: [],
    quality: DownloadQuality.MP3
  },
  sliceSelector: (state) => state.ui.modals
})

export const {
  hook: useWaitForDownloadModal,
  reducer: waitForDownloadModalReducer
} = waitForDownloadModal
