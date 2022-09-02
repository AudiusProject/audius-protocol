import { createSlice, PayloadAction } from '@reduxjs/toolkit'

const initialState = {}

type SignOutPayload = undefined

const slice = createSlice({
  name: 'sign-out',
  initialState,
  reducers: {
    signOut: (_state, _action: PayloadAction<SignOutPayload>) => {}
  }
})

export const { signOut } = slice.actions
export const actions = slice.actions

export default slice.reducer
