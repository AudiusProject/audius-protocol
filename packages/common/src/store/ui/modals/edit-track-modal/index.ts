import { ID } from 'models/Identifiers'
import { Nullable } from 'utils/typeUtils'

import { createModal } from '../createModal'

export type EditTrackModalState = {
  isOpen: boolean
  trackId: Nullable<ID>
}

const editTrackModal = createModal<EditTrackModalState>({
  reducerPath: 'EditPlaylist',
  initialState: {
    isOpen: false,
    trackId: null
  },
  sliceSelector: (state) => state.ui.modals
})

export const {
  hook: useEditTracktModal,
  actions: editTracktModalActions,
  reducer: editTracktModalReducer
} = editTrackModal

export * as editTrackModalSelectors from './selectors'
