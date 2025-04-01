import { ID } from '~/models/Identifiers'

import { createModal } from '../createModal'

export type DownloadTrackArchiveModalState = {
  trackId: ID | null
  fileCount: number
}

const downloadTrackArchiveModal = createModal<DownloadTrackArchiveModalState>({
  reducerPath: 'DownloadTrackArchive',
  initialState: {
    isOpen: false,
    trackId: null,
    fileCount: 1
  },
  sliceSelector: (state) => state.ui.modals
})

export const {
  hook: useDownloadTrackArchiveModal,
  reducer: downloadTrackArchiveModalReducer,
  actions: downloadTrackArchiveModalActions
} = downloadTrackArchiveModal
