import { createSlice } from '@reduxjs/toolkit'

const initialState = {}

const slice = createSlice({
  name: 'RATE_CTA',
  initialState,
  reducers: {
    requestReview: (state) => {}
  }
})

export const { requestReview } = slice.actions

export default slice.reducer
