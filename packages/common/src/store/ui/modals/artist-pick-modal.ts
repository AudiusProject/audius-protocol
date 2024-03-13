import { ID } from '~/models/Identifiers'
import { Nullable } from '~/utils/typeUtils'

import { createModal } from './createModal'

export type ArtistPickModalState = {
  trackId: Nullable<ID>
}

const artistPickModal = createModal<ArtistPickModalState>({
  reducerPath: 'ArtistPick',
  initialState: {
    isOpen: false,
    trackId: null
  },
  sliceSelector: (state) => state.ui.modals
})

export const {
  hook: useArtistPickModal,
  reducer: artistPickModalReducer,
  actions: artistPickModalActions
} = artistPickModal
