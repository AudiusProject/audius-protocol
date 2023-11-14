import { ID } from 'models/Identifiers'
import { Nullable } from 'utils/typeUtils'

import { createModal } from '../createModal'

import * as selectors from './selectors'

export type EditTrackModalState = {
  trackId: Nullable<ID>
}

const editTrackModal = createModal<EditTrackModalState>({
  reducerPath: 'EditTrack',
  initialState: {
    isOpen: false,
    trackId: null
  },
  sliceSelector: (state) => state.ui.modals
})

export const {
  hook: useEditTrackModal,
  actions: editTrackModalActions,
  reducer: editTrackModalReducer
} = editTrackModal
export const editTrackModalSelectors = selectors
