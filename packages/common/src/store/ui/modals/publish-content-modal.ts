import { ID } from '~/models/Identifiers'
import { Nullable } from '~/utils/typeUtils'

import { createModal } from './createModal'

export type PublishContentModal = {
  contentId: Nullable<ID>
  contentType: Nullable<'playlist' | 'album' | 'track'>
}

const publishContentModal = createModal<PublishContentModal>({
  reducerPath: 'PublishContent',
  initialState: {
    isOpen: false,
    contentId: null,
    contentType: null
  },
  sliceSelector: (state) => state.ui.modals
})

export const {
  hook: usePublishContentModal,
  reducer: publishContentModalReducer,
  actions: publishContentModalActions
} = publishContentModal
