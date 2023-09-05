import { createSlice, PayloadAction } from '@reduxjs/toolkit'

import { SmartCollection } from '../../../models/Collection'
import { SmartCollectionVariant } from '../../../models/SmartCollectionVariant'

import { SmartCollectionState } from './types'

type FetchPayload = {
  variant: SmartCollectionVariant
}

type FetchSucceededPayload = {
  variant: SmartCollectionVariant
  collection: SmartCollection
}

// Smart variants are dynamically added
const initialState: SmartCollectionState = {}

const slice = createSlice({
  name: 'application/pages/smartCollectionPage',
  initialState,
  reducers: {
    fetchSmartCollection: (_state, _action: PayloadAction<FetchPayload>) => {},
    fetchSmartCollectionSucceeded: (
      state,
      action: PayloadAction<FetchSucceededPayload>
    ) => {
      const { variant, collection } = action.payload
      state[variant] = collection
    }
  }
})

export const { fetchSmartCollection, fetchSmartCollectionSucceeded } =
  slice.actions

export const actions = slice.actions

export default slice.reducer
