import { createSlice } from '@reduxjs/toolkit'

const initialState: any = {}

// Slice

const slice = createSlice({
  name: 'CLIENT_STORE',
  initialState,
  reducers: {
    receive: (state, action) => {
      return action.payload
    }
  }
})

export const { receive } = slice.actions

export default slice.reducer
