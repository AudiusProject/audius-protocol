import { ID } from '@audius/common'
import { createSlice, PayloadAction } from '@reduxjs/toolkit'

import Status from 'common/models/Status'

import { ExploreCollectionsVariant } from '../types'

type FetchPayload = {
  variant: ExploreCollectionsVariant
  moods?: string[]
}

type FetchSucceededPayload = {
  variant: ExploreCollectionsVariant
  collectionIds: ID[]
}

type CollectionsVariant = {
  collectionIds: ID[]
  status: Status
}

export type CollectionsState = {
  [key in ExploreCollectionsVariant]?: CollectionsVariant
}

const initialState: CollectionsState = {}

const slice = createSlice({
  name: 'application/pages/explore/collections',
  initialState,
  reducers: {
    fetch: (state, action: PayloadAction<FetchPayload>) => {
      const { variant } = action.payload
      state[variant] = {
        status: Status.LOADING,
        collectionIds: []
      }
    },
    fetchSucceeded: (state, action: PayloadAction<FetchSucceededPayload>) => {
      const { variant, collectionIds } = action.payload
      state[variant] = {
        status: Status.SUCCESS,
        collectionIds
      }
    }
  }
})

export const { fetch, fetchSucceeded } = slice.actions

export default slice.reducer
