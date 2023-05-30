import { ID, Nullable } from '@audius/common'
import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export type FocusableFields = 'name' | 'description' | 'artwork'

export type EditPlaylistModalState = {
  isOpen: boolean
  collectionId: ID | null
  initialFocusedField: Nullable<FocusableFields>
}

const initialState: EditPlaylistModalState = {
  isOpen: false,
  collectionId: null,
  initialFocusedField: null
}

type OpenPayload = PayloadAction<{
  collectionId: ID
  // Which field in edit-playlist form should be autofocused
  initialFocusedField?: 'name' | 'description' | 'artwork'
}>

const slice = createSlice({
  name: 'application/ui/editPlaylistModal',
  initialState,
  reducers: {
    open: (state, action: OpenPayload) => {
      const { collectionId, initialFocusedField } = action.payload
      state.isOpen = true
      state.collectionId = collectionId
      if (initialFocusedField) {
        state.initialFocusedField = initialFocusedField
      }
    },
    close: (state) => {
      state.isOpen = false
      state.collectionId = null
      state.initialFocusedField = null
    }
  }
})

export const { open, close } = slice.actions

export default slice.reducer
