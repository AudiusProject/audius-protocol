import { createSlice } from '@reduxjs/toolkit'

export type State = {
  count: number
}

export const initialState: State = {
  count: 0
}

const slice = createSlice({
  name: 'modal',
  initialState,
  reducers: {
    increment: state => {
      state.count += 1
    },
    decrement: state => {
      state.count -= 1
    }
  }
})

export const { increment, decrement } = slice.actions

export default slice.reducer
