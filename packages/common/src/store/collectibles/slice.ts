import { createSlice, PayloadAction } from '@reduxjs/toolkit'

import { Chain, Collectible, ID } from '../../models'

import { Metadata } from '@metaplex-foundation/mpl-token-metadata'
import { Nullable } from '../../utils'

export type CollectiblesState = {
  userCollectibles: {
    [id: ID]: {
      [Chain.Eth]: Collectible[],
      [Chain.Sol]: Collectible[]
    }
  },
  solCollections: {
    [mint: string]: (Metadata & { imageUrl: Nullable<string> })
  }
}

const initialState: CollectiblesState = {
  userCollectibles: {},
  solCollections: {}
}

type UpdateUserCollectiblesPayload = {
  userId: ID,
  userCollectibles: Collectible[]
}

type UpdateSolCollectionsPayload = {
  metadatas: { [mint: string]: (Metadata & { imageUrl: Nullable<string> }) }
}

const slice = createSlice({
  name: 'collectibles',
  initialState,
  reducers: {
    updateUserEthCollectibles: (state, action: PayloadAction<UpdateUserCollectiblesPayload>) => {
      state.userCollectibles[action.payload.userId] = {
        ...state.userCollectibles[action.payload.userId],
        [Chain.Eth]: action.payload.userCollectibles
      }
    },
    updateUserSolCollectibles: (state, action: PayloadAction<UpdateUserCollectiblesPayload>) => {
      state.userCollectibles[action.payload.userId] = {
        ...state.userCollectibles[action.payload.userId],
        [Chain.Sol]: action.payload.userCollectibles
      }
    },
    updateSolCollections: (state, action: PayloadAction<UpdateSolCollectionsPayload>) => {
      state.solCollections = {
        ...state.solCollections,
        ...action.payload.metadatas
      }
    }
  }
})

export const {
  updateUserEthCollectibles,
  updateUserSolCollectibles,
  updateSolCollections
} = slice.actions

export const reducer = slice.reducer
export const actions = slice.actions

export default slice


