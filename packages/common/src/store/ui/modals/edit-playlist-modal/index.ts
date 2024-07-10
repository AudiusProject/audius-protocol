import { ID } from '~/models/Identifiers'
import { Nullable } from '~/utils/typeUtils'

import { createModal } from '../createModal'

export type FocusableFields = 'name' | 'description' | 'artwork'

export type EditPlaylistModalState = {
  collectionId: Nullable<ID>
  initialFocusedField?: Nullable<FocusableFields>
  isCollectionViewed?: boolean
}

const editPlaylistModal = createModal<EditPlaylistModalState>({
  reducerPath: 'EditPlaylist',
  initialState: {
    isOpen: false,
    collectionId: null,
    initialFocusedField: null,
    isCollectionViewed: false
  },
  sliceSelector: (state) => state.ui.modals
})

export const {
  hook: useEditPlaylistModal,
  actions: editPlaylistModalActions,
  reducer: editPlaylistModalReducer
} = editPlaylistModal
