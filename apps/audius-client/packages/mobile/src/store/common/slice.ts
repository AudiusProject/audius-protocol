import { createSlice } from '@reduxjs/toolkit'

const initialState: any = {}

// Slice

const slice = createSlice({
  name: 'COMMON',
  initialState,
  reducers: {
    receive: (state, action) => {
      return {
        ...state,
        ...action.payload
      }
    }
  }
})

export const { receive } = slice.actions

export default slice.reducer
