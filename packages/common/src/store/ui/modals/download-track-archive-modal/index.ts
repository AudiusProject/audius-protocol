import { ID } from '~/models/Identifiers'

import { createModal } from '../createModal'

export type DownloadTrackArchiveModalState = {
  trackId: ID
}

const downloadTrackArchiveModal = createModal<DownloadTrackArchiveModalState>({
  reducerPath: 'DownloadTrackArchive',
  initialState: {
    isOpen: false,
    trackId: -1
  },
  sliceSelector: (state) => state.ui.modals
})

export const {
  hook: useDownloadTrackArchiveModal,
  reducer: downloadTrackArchiveModalReducer,
  actions: downloadTrackArchiveModalActions
} = downloadTrackArchiveModal
