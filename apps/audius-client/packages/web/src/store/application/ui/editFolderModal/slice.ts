import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export type EditFolderModalState = {
  folderId: string | null
}

const initialState: EditFolderModalState = {
  folderId: null
}

const slice = createSlice({
  name: 'application/ui/editFolderModal',
  initialState,
  reducers: {
    setFolderId: (state, action: PayloadAction<string | null>) => {
      state.folderId = action.payload
    }
  }
})

export const { setFolderId } = slice.actions

export default slice.reducer
