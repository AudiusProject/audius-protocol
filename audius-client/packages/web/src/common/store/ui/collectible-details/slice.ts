import { createSlice, PayloadAction } from '@reduxjs/toolkit'

import { Collectible } from 'common/models/Collectible'

export type CollectibleDetailsState = {
  collectible: Collectible | null
}

const initialState: CollectibleDetailsState = {
  collectible: null
}

const slice = createSlice({
  name: 'collectible-details',
  initialState,
  reducers: {
    setCollectible: (
      state,
      action: PayloadAction<{ collectible: Collectible | null }>
    ) => {
      state.collectible = action.payload.collectible
    }
  }
})

export const { setCollectible } = slice.actions

export default slice.reducer
