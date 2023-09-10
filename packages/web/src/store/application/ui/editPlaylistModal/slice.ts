import { ID, Nullable } from '@audius/common'
import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export type FocusableFields = 'name' | 'description' | 'artwork'

export type EditPlaylistModalState = {
  isOpen: boolean
  collectionId: ID | null
  initialFocusedField: Nullable<FocusableFields>
  isCollectionViewed: boolean
}

const initialState: EditPlaylistModalState = {
  isOpen: false,
  collectionId: null,
  initialFocusedField: null,
  isCollectionViewed: false
}

type OpenPayload = PayloadAction<{
  collectionId: ID
  // Which field in edit-playlist form should be autofocused
  initialFocusedField?: 'name' | 'description' | 'artwork'
  // Is the collection currently being viewed
  // Used to check if we should reroute back to trending on delete
  isCollectionViewed?: boolean
}>

const slice = createSlice({
  name: 'application/ui/editPlaylistModal',
  initialState,
  reducers: {
    open: (state, action: OpenPayload) => {
      const { collectionId, initialFocusedField, isCollectionViewed } =
        action.payload

      state.isOpen = true
      state.collectionId = collectionId
      state.isCollectionViewed = isCollectionViewed ?? false
      if (initialFocusedField) {
        state.initialFocusedField = initialFocusedField
      }
    },
    close: (state) => {
      state.isOpen = false
      state.collectionId = null
      state.initialFocusedField = null
      state.isCollectionViewed = false
    }
  }
})

export const { open, close } = slice.actions

export default slice.reducer
