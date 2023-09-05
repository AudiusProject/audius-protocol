import { createSlice, PayloadAction } from '@reduxjs/toolkit'

const initialState = {
  feePayer: null as string | null
}

type SetFeePayerPayload = {
  feePayer: string
}

const slice = createSlice({
  name: 'solana',
  initialState,
  reducers: {
    setFeePayer: (state, action: PayloadAction<SetFeePayerPayload>) => {
      const { feePayer } = action.payload
      state.feePayer = feePayer
    }
  }
})

export const { setFeePayer } = slice.actions
export const actions = slice.actions

export default slice.reducer
