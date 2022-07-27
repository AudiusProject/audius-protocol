import { ID, Collectible } from '@audius/common'
import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export type CollectibleDetailsState = {
  collectible: Collectible | null
  ownerId: ID | null
  ownerHandle: string | null
  embedCollectibleHash: string | null
  isUserOnTheirProfile: boolean
  // Optional Callbacks
  updateProfilePicture?: (
    selectedFiles: any,
    source: 'original' | 'unsplash' | 'url'
  ) => void
  onSave?: () => void
  setIsEmbedModalOpen?: (isOpen: boolean) => void
  onClose?: () => void
}

const initialState: CollectibleDetailsState = {
  collectible: null,
  ownerId: null,
  ownerHandle: null,
  embedCollectibleHash: null,
  isUserOnTheirProfile: false
}

type SetCollectibleAction = Partial<CollectibleDetailsState>

const slice = createSlice({
  name: 'collectible-details',
  initialState,
  reducers: {
    setCollectible: (state, action: PayloadAction<SetCollectibleAction>) => {
      const {
        collectible,
        ownerId,
        ownerHandle,
        embedCollectibleHash,
        isUserOnTheirProfile,
        updateProfilePicture,
        onSave,
        setIsEmbedModalOpen,
        onClose
      } = action.payload
      state.collectible = collectible ?? state.collectible
      state.ownerId = ownerId ?? state.ownerId
      state.ownerHandle = ownerHandle ?? state.ownerHandle
      state.embedCollectibleHash =
        embedCollectibleHash ?? state.embedCollectibleHash
      state.isUserOnTheirProfile =
        isUserOnTheirProfile ?? state.isUserOnTheirProfile

      state.updateProfilePicture = updateProfilePicture
      state.onSave = onSave
      state.setIsEmbedModalOpen = setIsEmbedModalOpen
      state.onClose = onClose
    }
  }
})

export const { setCollectible } = slice.actions

export default slice.reducer
