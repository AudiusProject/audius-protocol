import { createSlice, PayloadAction } from '@reduxjs/toolkit'

const initialState = {}

type SignOutPayload = {}

const slice = createSlice({
  name: 'sign-out',
  initialState,
  reducers: {
    signOut: (state, action: PayloadAction<SignOutPayload>) => {}
  }
})

export const { signOut } = slice.actions

export default slice.reducer
