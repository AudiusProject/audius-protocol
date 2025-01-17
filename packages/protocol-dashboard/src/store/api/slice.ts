import { createSlice } from '@reduxjs/toolkit'
const gqlBackupUri = import.meta.env.VITE_GQL_BACKUP_URI

export type State = {
  didError: boolean
  hasBackupClient: boolean
}

export const initialState: State = {
  didError: false,
  hasBackupClient: !!gqlBackupUri
}

const slice = createSlice({
  name: 'api',
  initialState,
  reducers: {
    setDidError: (state) => {
      state.didError = true
    }
  }
})

export const { setDidError } = slice.actions

export default slice.reducer
