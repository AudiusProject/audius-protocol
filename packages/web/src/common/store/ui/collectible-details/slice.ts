import { createSlice, PayloadAction } from '@reduxjs/toolkit'

import { Collectible } from 'common/models/Collectible'
import { ID } from 'common/models/Identifiers'

export type CollectibleDetailsState = {
  collectible: Collectible | null
  ownerId?: ID | null
}

const initialState: CollectibleDetailsState = {
  collectible: null,
  ownerId: null
}

const slice = createSlice({
  name: 'collectible-details',
  initialState,
  reducers: {
    setCollectible: (state, action: PayloadAction<CollectibleDetailsState>) => {
      const { payload } = action
      state.collectible = payload.collectible
      state.ownerId = payload.ownerId
    }
  }
})

export const { setCollectible } = slice.actions

export default slice.reducer
