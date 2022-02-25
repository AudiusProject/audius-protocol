import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export const CAST_METHOD = 'cast'

export type CastMethod = 'airplay' | 'chromecast'

type CastState = {
  method: CastMethod
}

const getInitialCastMethod = (): CastMethod => {
  try {
    const castMethod = window.localStorage.getItem(CAST_METHOD)
    if (castMethod === 'chromecast') return 'chromecast'
    return 'airplay'
  } catch (e) {
    console.error(e)
    return 'airplay'
  }
}

const initialState: CastState = {
  method: getInitialCastMethod()
}

const slice = createSlice({
  name: 'cast',
  initialState,
  reducers: {
    updateMethod: (
      state,
      { payload: { method } }: PayloadAction<{ method: CastMethod }>
    ) => {
      state.method = method
    }
  }
})

export const { updateMethod } = slice.actions

export default slice.reducer
