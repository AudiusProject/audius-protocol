import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export const CAST_METHOD = 'cast'

export type CastMethod = 'airplay' | 'chromecast'

type CastState = {
  method: CastMethod
}

const initialState: CastState = {
  method: 'airplay'
}

const slice = createSlice({
  name: 'cast',
  initialState,
  reducers: {
    updateMethod: (
      state,
      {
        payload: { method }
      }: PayloadAction<{ method: CastMethod; persist?: boolean }>
    ) => {
      state.method = method
    }
  }
})

export const { updateMethod } = slice.actions

export default slice.reducer
